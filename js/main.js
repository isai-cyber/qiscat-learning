// QisCat Learning — lógica principal del juego
import { LEVELS, COMMANDS, GLOSSARY } from './levels.js';
import { World, DIRS, WALKABLE } from './world.js';
import { CodeEditor } from './editor.js?v=5';
import { QState } from './quantum.js?v=5';
import { sfx, sound } from './audio.js';
import { Tutor } from './tutor.js';
import { Progress } from './progress.js?v=6';
import { PathScreen } from './path.js?v=6';
import { Routes, RoutesScreen, ROUTE, flatItems } from './routes.js';
import { MlPlayer } from './ml.js';
import { CHALLENGES } from './challenges-data.js';
import { showOnboarding } from './onboarding.js?v=4';
import { ONBOARDING, UNITS } from './onboarding-data.js?v=4';
import { Challenges } from './challenges.js';
import { LANGS, getLang, setLang, cmd, tr, trCode, QUANTUM } from './lang.js';
import { OP, toOp } from './ops.js';
import { renderPalette } from './palette.js';
import { renderCircuit } from './circuit.js';
import { toQiskit, toQasm, circuitItems } from './codegen.js';
import { Lab } from './lab.js';
import { OpsGuide } from './guide.js';

const $ = id => document.getElementById(id);
const SAVE_KEY = 'qiscat-learning-v1';
const save = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
save.done ||= {}; save.code ||= {};
const persist = () => localStorage.setItem(SAVE_KEY, JSON.stringify(save));
const progress = new Progress(save, persist);
setLang(save.lang || 'py');

const world = new World($('canvas-host'));
const qs = new QState();
const editor = new CodeEditor($('code'), lines => { save.code[level().id] = lines; persist(); renderCircuitPanel(); });
const tutor = new Tutor(tutorContext);

let idx = progress.isUnlocked(save.last ?? 0) ? Math.min(save.last ?? 0, LEVELS.length - 1) : progress.current();
let cat, flags, collected, running = null, lastResult = '', history = [];
let runStats = { fails: 0, hint: false }; // para calcular las estrellas del nivel
const level = () => LEVELS[idx];

// ---------- texto con glosario ----------
function rich(s) {
  const html = s
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, term, label) => `<span class="gloss" data-term="${term}">${label || term}</span>`)
    .replace(/`([^`]+)`/g, (_, c) => `<code>${trCode(c)}</code>`);
  return tr(html); // también los comandos escritos con <code> en HTML
}
const plain = s => s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, l) => l || t).replace(/<[^>]+>/g, '').replace(/`/g, '');

document.addEventListener('click', e => {
  const g = e.target.closest('.gloss');
  const pop = $('gloss-pop');
  if (!g) { if (!e.target.closest('#gloss-pop')) pop.classList.add('hidden'); return; }
  const text = GLOSSARY[g.dataset.term];
  if (!text) return;
  pop.innerHTML = text + `<div style="margin-top:10px;text-align:right"><button class="gloss-ask" style="color:#5b3fd0;font-weight:800">🦉 Preguntar más</button></div>`;
  pop.querySelector('.gloss-ask').onclick = () => { pop.classList.add('hidden'); tutor.open(`Explícame más sobre: ${g.dataset.term}`); };
  pop.classList.remove('hidden');
  const r = g.getBoundingClientRect();
  pop.style.left = Math.min(r.left, innerWidth - 340) + 'px';
  pop.style.top = (r.bottom + 8) + 'px';
});

// ---------- cargar nivel ----------
function loadLevel(i) {
  if (!progress.isUnlocked(i)) return false;
  stop();
  hideToast();
  idx = i;
  runStats = { fails: 0, hint: false };
  save.last = i; persist();
  const L = level();
  $('page-title').textContent = L.title;
  $('btn-prev').disabled = i === 0;
  $('btn-next').disabled = i === LEVELS.length - 1 || !progress.isUnlocked(i + 1);
  $('btn-next').title = $('btn-next').disabled && i < LEVELS.length - 1 ? '🔒 Completa este nivel para desbloquear el siguiente' : 'Página siguiente';
  renderPanel();
  editor.load(save.code[L.id]);
  history = [];
  lastResult = '';
  resetWorld();
  updateStats();
  return true;
}

// Instrucciones, selector de lenguaje y chips (cambian con el lenguaje)
function renderPanel() {
  const L = level(), i = idx;
  const quantum = L.commands.some(c => QUANTUM.has(c));
  $('instructions').innerHTML = `
    <span class="chapter-tag">${L.chapter} · ${i + 1}/${LEVELS.length}</span>
    <p><b>Objetivo:</b> ${rich(L.objective)}</p>
    <p class="intro">${rich(L.intro)}</p>
    <ol>${L.steps.map(s => `<li><span>${rich(s)}</span></li>`).join('')}</ol>
    <button class="replay-onb" id="btn-onb">📖 Ver la introducción otra vez</button>
    <div class="lang-row">
      <div class="seg" role="group" aria-label="Lenguaje del código">
        ${Object.entries(LANGS).map(([k, v]) => `<button data-lang="${k}" class="${getLang() === k ? 'on' : ''}">${k === 'py' ? '🐍 ' : '🇪🇸 '}${v}</button>`).join('')}
      </div>
      ${quantum ? '<button class="qk-btn" id="btn-qiskit">📋 Script de Qiskit</button>' : ''}
    </div>`;
  $('btn-onb').onclick = () => intro(i);
  $('instructions').querySelectorAll('[data-lang]').forEach(b => b.onclick = () => {
    if (running) return;
    setLang(b.dataset.lang); save.lang = b.dataset.lang; persist();
    sfx.tap(); renderPanel();
  });
  $('btn-qiskit') && ($('btn-qiskit').onclick = showQiskit);
  // chips del gato (y en los niveles cuánticos, la paleta Operations del Composer)
  const chips = $('chips');
  chips.innerHTML = '';
  L.commands.filter(name => !quantum || (!QUANTUM.has(name) && name !== 'for')).forEach(name => {
    const b = document.createElement('button');
    b.className = 'chip' + (QUANTUM.has(name) ? ' q' : '') + (name === 'for' ? ' kw' : '');
    b.textContent = cmd(name);
    b.title = tr(COMMANDS[name].tip);
    b.onclick = () => { sfx.tap(); editor.insert(name); };
    chips.appendChild(b);
  });
  $('app').classList.toggle('with-ops', quantum);
  $('ops').classList.toggle('hidden', !quantum);
  $('btn-ops-help').classList.toggle('hidden', !quantum);
  if (quantum) {
    const disabled = { ccx: 'Necesita 3 qubits: pruébala en el 🧪 Laboratorio' };
    if (!L.twin) ['cx', 'swap', 'cz'].forEach(id => disabled[id] = 'Necesita a la gemela Qubita (2 qubits). La usarás en «Gatos entrelazados»');
    renderPalette($('ops'), {
      compact: true, title: false, disabled,
      onPick: (id, why) => { if (why) return showToast(`🔒 ${why}`, false); sfx.tap(); editor.insert(id); },
    });
  }
  editor.setContext({ quantum, twin: !!L.twin });
  renderCircuitPanel();
}

// Circuito al estilo IBM Quantum Composer, se dibuja mientras escribes
function renderCircuitPanel() {
  const L = level();
  const box = $('circuit-box');
  const quantum = L.commands.some(c => QUANTUM.has(c));
  box.classList.toggle('hidden', !quantum);
  if (!quantum) return;
  const n = L.twin ? 2 : 1;
  box.innerHTML = `<div class="circ-head"><b>🔌 Tu circuito</b><span>como en IBM Quantum Composer</span></div>
    <div class="circ-scroll">${renderCircuit(circuitItems(editor.tree()), n, { names: ['Schrödi', 'Qubita'] })}</div>`;
}

// Script de Qiskit / OpenQASM 3 con el circuito del niño
function showQiskit() {
  const L = level();
  const tree = editor.tree(), n = L.twin ? 2 : 1;
  const codes = { qiskit: toQiskit(tree, { n, title: L.title }), qasm: toQasm(tree, { n }) };
  showCode(codes, renderCircuit(circuitItems(tree), n, { names: ['Schrödi', 'Qubita'] }));
}
function showCode(codes, svg) {
  const esc = t => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  let tab = 'qiskit';
  modal(`
    <div class="big">🐍</div>
    <h1>Tu circuito cuántico</h1>
    <p>Código de verdad: <b>Qiskit</b> (Python) y <b>OpenQASM 3</b>, como en IBM Quantum Composer. Cópialo y córrelo.</p>
    <div class="circ-scroll modal-circ">${svg}</div>
    <div class="seg code-tabs"><button data-tab="qiskit" class="on">🐍 Qiskit</button><button data-tab="qasm">⚛️ OpenQASM 3</button></div>
    <pre class="qk-code" id="m-code">${esc(codes.qiskit)}</pre>
    <div class="btns"><button id="m-copy">📋 Copiar</button><button class="primary" id="m-ok">Listo</button></div>`);
  $('m-ok').onclick = closeModal;
  document.querySelectorAll('.code-tabs [data-tab]').forEach(b => b.onclick = () => {
    tab = b.dataset.tab;
    document.querySelectorAll('.code-tabs button').forEach(x => x.classList.toggle('on', x === b));
    $('m-code').textContent = codes[tab];
    $('m-copy').textContent = '📋 Copiar';
  });
  $('m-copy').onclick = async () => {
    try { await navigator.clipboard.writeText(codes[tab]); $('m-copy').textContent = '✅ ¡Copiado!'; }
    catch { $('m-copy').textContent = 'Selecciona y copia el texto'; }
  };
}

// Empezar un nivel desde la ruta: primero la introducción (la primera vez)
async function startLevel(i) {
  if (!loadLevel(i)) return;
  if (!progress.seenOnboarding(i)) await intro(i);
  // la primera vez que aparece la paleta, la guía explica cada botón
  if (LEVELS[i].commands.some(c => QUANTUM.has(c)) && guide.firstTime) guide.open();
}

function intro(i) {
  const L = LEVELS[i];
  return showOnboarding({
    level: L, index: i, data: ONBOARDING[L.id], unit: UNITS[L.chapter], rich, tr, lang: getLang(),
    onQuiz: ok => { const xp = progress.recordQuiz(i, ok); updateStats(); return xp; },
  }).then(r => { progress.markOnboarding(i); return r; });
}

function updateStats() {
  $('stat-streak').textContent = progress.streak;
  $('stat-streak').parentElement.classList.toggle('on', progress.playedToday());
  $('stat-xp').textContent = progress.xp;
}

function resetWorld() {
  const L = level();
  world.build(L);
  qs.reset();
  const s = world.L.start;
  cat = { c: s.c, r: s.r, dir: L.dir };
  world.placeCat(cat.c, cat.r, cat.dir);
  collected = 0;
  flags = { measuredBox: false, measuredSuper: false, measuredEnt: false };
  world.setLink(false);
  updateHUD();
}

function updateHUD() {
  const L = level();
  const total = world.L.fish.length;
  $('fish-count').textContent = `${collected}/${total}`;
  document.querySelector('.fish-sign').style.display = total ? '' : 'none';
  const pa = qs.pA1(), pb = qs.pB1();
  $('qfill-a').style.width = (pa * 100) + '%';
  $('qpct-a').textContent = pct(pa);
  $('qrow-b').classList.toggle('hidden', !L.twin);
  $('qfill-b').style.width = (pb * 100) + '%';
  $('qpct-b').textContent = pct(pb);
  $('ket').textContent = qs.ket(!!L.twin);
  $('ent-badge').classList.toggle('hidden', !qs.isEntangled());
  world.cat.setProb(pa);
  world.twin?.setProb(pb);
  $('history').classList.toggle('hidden', !history.length);
  $('history').textContent = history.length ? 'Tus mediciones: ' + history.slice(-12).join(' ') : '';
}
const pct = p => p > 0.99 ? '100% 😺' : p < 0.01 ? '100% 😴' : `${Math.round((1 - p) * 100)}/${Math.round(p * 100)}`;

// ---------- ejecutar el código ----------
class Fail extends Error {}

async function run() {
  if (running) { stop(); return; }
  hideToast();
  const tree = editor.tree();
  if (!tree.length) { showToast('✏️ Primero escribe tu código: toca los comandos de la barra de abajo.', false); return; }
  resetWorld();
  const token = running = { stopped: false };
  editor.locked = true;
  $('code').classList.add('locked');
  $('btn-run').classList.add('stop');
  $('run-label').textContent = 'Detener';
  $('btn-run').querySelector('.play').textContent = '■';
  tutor.close();

  try {
    await world.wait(250);
    let count = 0;
    const execNodes = async nodes => {
      for (const node of nodes) {
        if (token.stopped) return;
        if (++count > 400) throw new Fail('🔁 Tu programa da demasiadas vueltas. ¿Hay un <code>while</code> que nunca termina?');
        editor.setRunning(node.i);
        const ln = node.ln;
        if (node.body) {
          await world.wait(140);
          if (ln.t === 'for') for (let k = 0; k < ln.n && !token.stopped; k++) await execNodes(node.body);
          else if (ln.t === 'if') {
            if (qs.cl[0] === 1) await execNodes(node.body);
            else world.popLabel('if: salió 😴, se salta', world.cat.group.position);
          } else if (ln.t === 'while') {
            let k = 0;
            while (qs.cl[0] === 1 && !token.stopped) {
              if (++k > 12) throw new Fail('🔁 El <code>while</code> dio más de 12 vueltas. ¡Mide dentro del bucle para que pueda terminar!');
              await execNodes(node.body);
            }
          } else await execNodes(node.body); // box
          continue;
        }
        if (ln.t === 'gate') await execGate(ln);
        else await exec(ln.name);
        await world.wait(90);
      }
    };
    await execNodes(tree);
    if (token.stopped) return;
    editor.setRunning(-1);
    checkGoal();
  } catch (e) {
    if (!(e instanceof Fail)) throw e;
    if (!token.stopped) { runStats.fails++; sfx.fail(); lastResult = e.message; showToast(e.message, true); }
  } finally {
    if (running === token) finishRun();
  }
}

function stop() {
  if (!running) return;
  running.stopped = true;
  finishRun();
  resetWorld();
}

function finishRun() {
  running = null;
  editor.locked = false;
  $('code').classList.remove('locked');
  $('btn-run').classList.remove('stop');
  $('run-label').textContent = 'Ejecutar mi código';
  $('btn-run').querySelector('.play').textContent = '▶';
}

// Compuerta de la paleta Operations
async function execGate(ln) {
  const L = level(), o = OP[ln.g];
  if (o.kind === 'g2' && !L.twin) throw new Fail('🐱 Esta compuerta necesita a la gemela Qubita.');
  if (o.kind === 'g3') throw new Fail('🧪 Toffoli necesita 3 qubits: pruébala en el Laboratorio.');
  if (ln.g === 'barrier') { world.popLabel('┆ barrera', world.cat.group.position); await world.wait(250); return; }
  const fx = { red: 0xfa4d56, blue: 0x4589ff, light: 0x7fb3ff, gray: 0xa8a8a8, pink: 0xff7eb6 }[o.color];
  ln.g === 'h' ? sfx.h() : ['cx', 'cz', 'swap'].includes(ln.g) ? sfx.link() : sfx.x();
  qs.apply(toOp(ln));
  world.gateFx(fx);
  if (L.twin) world.setLink(qs.isEntangled());
  updateHUD();
  const who = ln.q === 1 && L.twin ? world.twin.group.position : world.cat.group.position;
  world.popLabel(`${o.label === '⊕' ? 'X' : o.label}${o.kind === 'g1p' ? '(θ)' : ''} → ${qs.isSuperposedA() ? '😴+😺' : qs.isCertainA(1) ? '😺' : '😴'}`, who);
  await world.wait(480);
}

async function exec(name) {
  const at = world.at;
  switch (name) {
    case 'avanzar': {
      const [dx, dz] = DIRS[cat.dir];
      const to = { c: cat.c + dx, r: cat.r + dz };
      const ch = at(to.c, to.r);
      const key = `${to.c},${to.r}`;
      if (ch === ' ') {
        sfx.fall();
        await world.moveCat(cat, to, { fall: true });
        throw new Fail('😿 ¡Uy! Schrödi se cayó de la isla. Revisa hacia dónde mira el gato antes de avanzar.');
      }
      if (!WALKABLE.has(ch)) {
        sfx.bump();
        await world.moveCat(cat, to, { bump: true });
        throw new Fail('🌳 ¡Pum! Hay algo en el camino. El gato solo puede caminar sobre las tablas de madera.');
      }
      if (ch === 'Q') {
        if (!qs.isSuperposedA()) {
          sfx.bump();
          await world.moveCat(cat, to, { bump: true });
          throw new Fail('🟣 El muro cuántico solo deja pasar a gatos en <b>superposición</b>. ¿Qué compuerta convierte al gato en fantasma?');
        }
        world.rippleQWall(key);
      }
      if (ch === 'A' || ch === 'D') {
        const need = ch === 'A' ? 1 : 0;
        if (!qs.isCertainA(need)) {
          sfx.bump();
          await world.moveCat(cat, to, { bump: true });
          const door = need ? 'del sol ☀️ solo se abre para gatos 😺 despiertos' : 'de la luna 🌙 solo se abre para gatos 😴 dormidos';
          const extra = qs.isSuperposedA() ? ' Tu gato está en superposición: ¡no está seguro de nada!' : '';
          throw new Fail(`🚪 La puerta ${door} al 100%.${extra}`);
        }
        sfx.door();
        await world.setDoor(key, true);
      }
      sfx.step();
      await world.moveCat(cat, to);
      cat.c = to.c; cat.r = to.r;
      return;
    }
    case 'girarIzquierda':
    case 'girarDerecha': {
      const nd = (cat.dir + (name === 'girarDerecha' ? 1 : 3)) % 4;
      sfx.turn();
      await world.turnCat(cat.dir, nd);
      cat.dir = nd;
      return;
    }
    case 'recogerPez': {
      const f = world.L.fishAt[`${cat.c},${cat.r}`];
      if (!f || f.userData.taken) throw new Fail('🐟 Aquí no hay ningún pez. El gato debe estar <b>encima</b> del pez para recogerlo.');
      sfx.fish();
      await world.collectFish(f);
      collected++;
      const sign = document.querySelector('.fish-sign');
      sign.classList.remove('bump'); void sign.offsetWidth; sign.classList.add('bump');
      updateHUD();
      return;
    }
    case 'aplicarX':
      sfx.x();
      qs.x();
      world.gateFx(0xffc93c);
      updateHUD();
      world.popLabel(qs.isSuperposedA() ? 'X 🔄' : qs.isCertainA(1) ? 'X → 😺' : 'X → 😴', world.cat.group.position);
      await world.wait(450);
      return;
    case 'aplicarH':
      sfx.h();
      qs.h();
      world.gateFx(0xb388ff);
      updateHUD();
      world.popLabel(qs.isSuperposedA() ? 'H → 😴+😺' : 'H → ¡de vuelta!', world.cat.group.position);
      await world.wait(550);
      return;
    case 'entrelazar': {
      if (!world.twin) throw new Fail('🔗 No hay ningún gato gemelo con quién entrelazarse en esta isla.');
      sfx.link();
      qs.cnot();
      world.gateFx(0xff7ad9);
      world.setLink(qs.isEntangled());
      updateHUD();
      world.popLabel(qs.isEntangled() ? '🔗 ¡Entrelazados!' : '🔗 (no pasó nada…)', world.cat.group.position);
      await world.wait(600);
      return;
    }
    case 'medir': {
      const onBox = world.L.boxPos && world.L.boxPos.c === cat.c && world.L.boxPos.r === cat.r;
      const wasSuper = qs.isSuperposedA(), wasEnt = qs.isEntangled();
      sfx.measure();
      if (onBox) {
        world.hideCatsInBoxes(true);
        await Promise.all([world.closeBoxAndOpen(world.L.box), wasEnt ? world.closeBoxAndOpen(world.L.twinBox) : null]);
      }
      const r = qs.measure();
      world.setLink(false);
      world.hideCatsInBoxes(false);
      updateHUD();
      world.flash(world.cat.group.position);
      world.popLabel(r.a ? '😺 ¡Despierto!' : '😴 ¡Dormido!', world.cat.group.position);
      if (world.twin) {
        world.flash(world.twin.group.position);
        world.popLabel(r.b ? '😺 ¡Despierta!' : '😴 ¡Dormida!', world.twin.group.position, '#0f766e');
      }
      history.push(world.twin ? (r.a ? '😺' : '😴') + (r.b ? '😺' : '😴') : (r.a ? '😺' : '😴'));
      updateHUD();
      if (onBox) {
        flags.measuredBox = true;
        flags.measuredSuper ||= wasSuper;
        flags.measuredEnt ||= wasEnt;
      }
      await world.wait(900);
      return;
    }
  }
}

function checkGoal() {
  const L = level(), g = L.goal;
  const missing = world.L.fish.length - collected;
  let msg = null;
  if (missing > 0) msg = `🐟 ¡Casi! Te ${missing === 1 ? 'falta 1 pez' : `faltan ${missing} peces`}. Revisa tu código.`;
  else if (g.box && !flags.measuredBox) msg = '📦 Lleva al gato a la caja y usa <code>medir()</code> cuando esté adentro.';
  else if (g.entangled && !flags.measuredEnt) msg = '🔗 Los gatos no estaban entrelazados al medir. Usa <code>aplicarH()</code> y luego <code>entrelazar()</code> antes de <code>medir()</code>.';
  else if (g.superposed && !flags.measuredSuper) msg = '✨ El gato tenía que estar en <b>superposición</b> cuando lo mediste. ¿Qué compuerta usarías?';
  if (msg) { runStats.fails++; sfx.fail(); lastResult = plain(msg); showToast(msg, true); return; }
  lastResult = '¡Lo lograste!';
  win();
}

// ---------- mensajes ----------
function showToast(html, canAsk) {
  $('toast-msg').innerHTML = tr(html);
  $('toast-ask').classList.toggle('hidden', !canAsk);
  $('toast').classList.remove('hidden');
}
function hideToast() { $('toast').classList.add('hidden'); }
$('toast-ok').onclick = () => { hideToast(); if (!running) resetWorld(); };
$('toast-ask').onclick = () => { hideToast(); tutor.open('¿Por qué falló mi código? ¿Me das una pista?'); };

function modal(html) {
  $('modal-card').innerHTML = html;
  $('modal').classList.remove('hidden');
}
const closeModal = () => $('modal').classList.add('hidden');

function win() {
  const L = level();
  const r = progress.recordWin(idx, runStats);
  sfx.win();
  confetti();
  updateStats();
  const last = idx === LEVELS.length - 1;
  const msg = r.stars === 3 ? '¡Perfecto! A la primera y sin pistas.' : r.stars === 2 ? '¡Muy bien! Casi perfecto.' : '¡Lo lograste! Repítelo para ganar más estrellas.';
  modal(`
    <div class="win-stars">${[1, 2, 3].map(n => `<span class="${n <= r.stars ? 'on' : ''}" style="animation-delay:${n * 0.18}s">★</span>`).join('')}</div>
    <h1>${last && r.first ? '¡Ruta completada!' : '¡Nivel completado!'}</h1>
    <p>${msg}</p>
    <div class="win-cards">
      <div class="wc xp"><small>XP ganados</small><b>⚡ +${r.xp}</b></div>
      <div class="wc tries"><small>Intentos</small><b>🎯 ${runStats.fails + 1}</b></div>
      <div class="wc fire"><small>Racha</small><b>🔥 ${r.streak} ${r.streak === 1 ? 'día' : 'días'}</b></div>
    </div>
    ${r.unlockedNext ? `<div class="win-unlock">🔓 ¡Desbloqueaste <b>${LEVELS[idx + 1].title}</b>!</div>` : ''}
    ${last && r.first ? '<div class="win-unlock gold">🏆 ¡Ganaste el trofeo de <b>Ingeniero cuántico</b>!</div>' : ''}
    <div class="learned"><b>🧠 Lo que aprendiste:</b><br>${rich(L.learned)}</div>
    <div class="btns">
      <button id="m-again">Repetir</button>
      <button class="primary" id="m-next">Continuar</button>
    </div>`);
  $('m-again').onclick = () => { closeModal(); loadLevel(idx); };
  $('m-next').onclick = () => {
    closeModal();
    const next = Math.min(idx + 1, LEVELS.length - 1);
    path.show({ route: 'intro', focus: kOf(LEVELS[last ? idx : next].id), unlocked: r.unlockedNext ? kOf(LEVELS[idx + 1].id) : -1, canClose: true });
  };
}

function confetti() {
  const colors = ['#ff6b9a', '#ffd23f', '#7c4dff', '#2dd4bf', '#ff8a3d', '#4f9dff'];
  for (let i = 0; i < 80; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 1.8 + Math.random() * 1.8 + 's';
    c.style.animationDelay = Math.random() * 0.5 + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4500);
  }
}

function welcome() {
  modal(`
    <img class="logo" src="assets/logo.webp" alt="QisCat Learning" />
    <h1>QisCat Learning</h1>
    <p>Programa a <b>Schrödi</b>, el gato de Schrödinger, y descubre los secretos de las <b>computadoras cuánticas</b>.</p>
    <div class="legend">
      <div>😴 <b>Dormido</b> = 0</div><div>😺 <b>Despierto</b> = 1</div>
      <div>🐟 Recoge peces</div><div>📦 Mide en la caja</div>
      <div>🟣 Muro cuántico</div><div>🦉 Profe Qubit te ayuda</div>
    </div>
    <div class="btns"><button class="primary" id="m-start">¡A jugar! ▶</button></div>`);
  $('m-start').onclick = () => { closeModal(); sfx.tap(); };
}

// ---------- ruta de aprendizaje ----------
// Rutas al estilo IBM Quantum Learning → ruta Duolingo de cada una → niveles, lecciones y tutoriales
const routes = new Routes(progress);
const kOf = levelId => flatItems(ROUTE.intro).findIndex(it => it.level === levelId); // posición del nivel en su ruta
const goHome = () => { updateStats(); home.show(); };
const path = new PathScreen(progress, routes, {
  onStart: startItem, onBack: goHome,
  onChallenges: () => challenges.show(), onLab: () => lab.show(),
});
const guide = new OpsGuide({ save, persist, progress, onClose: updateStats });
$('btn-ops-help').onclick = () => { sfx.tap(); guide.open(); };
const lab = new Lab({ save, persist, showCode, onBack: goHome, onHelp: () => guide.open() });
const challenges = new Challenges(progress, { onBack: goHome, onChange: updateStats });
const mlPlayer = new MlPlayer({ progress, rich, onClose: () => { updateStats(); path.show({ route: 'qml' }); } });
const dailyPick = () => progress.dailyChallenge(CHALLENGES.filter(c => challenges.unlocked(c)).map(c => c.id));
const home = new RoutesScreen(progress, routes, {
  onRoute: id => path.show({ route: id }),
  onLab: () => lab.show(),
  onChallenges: () => challenges.show(),
  onDaily: () => { const c = dailyPick(); if (c) { challenges.show(c.type); challenges.open(c); } },
  dailyPick,
});
// Material de una ruta: nivel 3D, lección de ML o tutorial del laboratorio
function startItem(it) {
  if (it.level) return startLevel(LEVELS.findIndex(l => l.id === it.level));
  if (it.ml) return mlPlayer.open(it.ml);
  progress.markTut(it.tut);
  updateStats();
  lab.show(it.ex);
}
$('btn-levels').onclick = $('btn-chapter').onclick = () => { stop(); hideToast(); path.show({ route: 'intro', focus: kOf(level().id), canClose: true }); };

// ---------- botones ----------
$('btn-run').onclick = run;
$('btn-prev').onclick = () => idx > 0 && loadLevel(idx - 1);
$('btn-next').onclick = () => idx < LEVELS.length - 1 && startLevel(idx + 1);
$('btn-undo').onclick = () => editor.undo();
$('btn-redo').onclick = () => editor.redo();
$('btn-back').onclick = () => editor.backspace();
$('btn-enter').onclick = () => editor.exitBlock();
$('btn-clear').onclick = () => { if (!running && confirm('¿Borrar todo tu código de esta página?')) editor.clear(); };
$('btn-more').onclick = () => {
  modal(`
  <div class="big">⚙️</div><h1>Opciones</h1>
  <p>Tu progreso se guarda en este navegador.</p>
  <div class="btns">
    <button id="m-reset">Borrar progreso</button>
    <button id="m-welcome">Ver bienvenida</button>
    <button class="primary" id="m-ok">Cerrar</button>
  </div>
  <p style="font-size:13px;color:#888;margin-top:16px">Derivado de <a href="https://github.com/CraigMLdsouza/CatCode" target="_blank" rel="noopener">CatCode</a> (MIT).</p>`);
  $('m-ok').onclick = closeModal;
  $('m-welcome').onclick = welcome;
  $('m-reset').onclick = () => { if (confirm('¿Seguro? Se borrará todo tu avance.')) { localStorage.removeItem(SAVE_KEY); location.reload(); } };
};
$('btn-hint').onclick = () => {
  const L = level();
  runStats.hint = true;
  showToast(`💡 <b>Pista:</b> <code>${tr(L.hint)}</code>`, true);
  $('toast-ask').textContent = '🦉 Explícamelo';
  $('toast-ask').onclick = () => { hideToast(); tutor.open('No entiendo la pista. ¿Me la explicas paso a paso?'); $('toast-ask').textContent = '🦉 Pregúntale al Profe'; $('toast-ask').onclick = () => { hideToast(); tutor.open('¿Por qué falló mi código? ¿Me das una pista?'); }; };
};
$('btn-tutor').onclick = () => tutor.toggle();
$('btn-sound').onclick = () => { sound.on = !sound.on; $('btn-sound').textContent = sound.on ? '🔊' : '🔇'; };
$('btn-speed').onclick = () => $('speed-menu').classList.toggle('hidden');
$('speed-menu').onclick = e => {
  const b = e.target.closest('[data-speed]');
  if (!b) return;
  world.speed = +b.dataset.speed;
  document.querySelectorAll('#speed-menu button').forEach(x => x.classList.toggle('sel', x === b));
  $('speed-menu').classList.add('hidden');
  if (!running) run();
};

// atajos de teclado
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); run(); }
});

// ---------- contexto para el tutor ----------
function tutorContext() {
  const L = level();
  const pa = qs.pA1();
  return {
    levelNumber: idx + 1,
    levelTitle: L.title,
    objective: plain(L.objective),
    steps: L.steps.map(plain).join(' | '),
    language: getLang() === 'py' ? 'Python con Qiskit (qc es el circuito, gato es Schrödi)' : 'comandos en español',
    commands: L.commands.map(c => cmd(c)).join(', '),
    code: editor.toText(),
    catState: `${qs.ket(!!L.twin)} — probabilidad 😴 ${Math.round((1 - pa) * 100)}%, 😺 ${Math.round(pa * 100)}%${qs.isEntangled() ? ', entrelazado con Qubita' : ''}`,
    fish: `${collected}/${world.L.fish.length}`,
    lastResult: plain(lastResult),
    solution: tr(L.hint),
  };
}

// ---------- inicio ----------
loadLevel(idx);
home.show();
setTimeout(() => {
  $('loading').style.opacity = 0;
  setTimeout(() => $('loading').remove(), 400);
  if (!save.seenWelcome) { save.seenWelcome = true; persist(); welcome(); }
}, 600);
