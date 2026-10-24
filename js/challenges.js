// Desafíos extra: Python con Qiskit, quizzes y bloques
import { LEVELS } from './levels.js';
import { CHALLENGES, CHALLENGE_TYPES } from './challenges-data.js';
import { sfx } from './audio.js';
import { tr } from './lang.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const S = Math.SQRT1_2;

// ---------- simulador de 2 qubits (amplitudes reales) ----------
// índice = q0*2 + q1  (q0 = Schrödi, q1 = Qubita)
class Sim {
  constructor() { this.a = [1, 0, 0, 0]; }
  apply(g) {
    const a = this.a;
    const pairs = q => q === 0 ? [[0, 2], [1, 3]] : [[0, 1], [2, 3]];
    if (g === 'cx') { this.a = [a[0], a[1], a[3], a[2]]; return; }
    const q = +g[1];
    const n = [...a];
    for (const [i, j] of pairs(q)) {
      if (g[0] === 'x') { n[i] = a[j]; n[j] = a[i]; }
      if (g[0] === 'h') { n[i] = S * (a[i] + a[j]); n[j] = S * (a[i] - a[j]); }
      if (g[0] === 'z') { n[j] = -a[j]; }
    }
    this.a = n;
  }
  p1(q = 0) { const p = this.a.map(v => v * v); return q === 0 ? p[2] + p[3] : p[1] + p[3]; }
  fidelity(t) { const o = this.a.reduce((s, v, i) => s + v * t[i], 0); return o * o; }
  measure() {
    const p = this.a.map(v => v * v);
    let r = Math.random(), k = 3;
    for (let i = 0; i < 4; i++) { if (r < p[i]) { k = i; break; } r -= p[i]; }
    this.a = [0, 0, 0, 0]; this.a[k] = 1;
  }
}

const GATE_PY = { x0: 'qc.x(0)', x1: 'qc.x(1)', h0: 'qc.h(0)', h1: 'qc.h(1)', z0: 'qc.z(0)', cx: 'qc.cx(0, 1)' };
const GATE_TIP = { x0: 'Voltea a Schrödi', x1: 'Voltea a Qubita', h0: 'Superposición en Schrödi', h1: 'Superposición en Qubita', z0: 'Cambia el signo de 😺 en Schrödi', cx: 'CNOT: si Schrödi 😺, voltea a Qubita' };
const BLOCK = {
  avanzar: { t: 'avanzar', i: '⬆️', k: 'move' },
  girarIzquierda: { t: 'girar a la izquierda', i: '↺', k: 'move' },
  girarDerecha: { t: 'girar a la derecha', i: '↻', k: 'move' },
  recogerPez: { t: 'recoger pez', i: '🐟', k: 'act' },
  aplicarX: { t: 'compuerta X', i: '🔄', k: 'q' },
  aplicarH: { t: 'compuerta H', i: '✨', k: 'q' },
  medir: { t: 'medir', i: '📦', k: 'q' },
  entrelazar: { t: 'entrelazar', i: '🔗', k: 'q' },
};
const BLOCK_GATE = { aplicarX: 'x0', aplicarH: 'h0', entrelazar: 'cx' };
const LABELS = [['😴', '😺'], ['😴😴', '😴😺', '😺😴', '😺😺']];

// Barras de probabilidad con la amplitud (el signo importa en algunos desafíos)
function bars(amps, qubits, cls = '') {
  const idx = qubits === 1 ? [0, 2] : [0, 1, 2, 3];
  const labels = LABELS[qubits - 1];
  return `<div class="qbars ${cls}">${idx.map((k, n) => {
    const v = amps[k], p = Math.round(v * v * 100);
    return `<div class="qb"><div class="qb-col"><i class="${v < -1e-6 ? 'neg' : ''}" style="height:${p}%"></i></div>
      <b>${p}%</b><small>${Math.abs(v) < 1e-6 ? '0' : (v < 0 ? '−' : '') + Math.abs(v).toFixed(2)}</small><span>${labels[n]}</span></div>`;
  }).join('')}</div>`;
}

export class Challenges {
  constructor(progress, { onBack, onChange }) {
    this.p = progress;
    this.onBack = onBack;
    this.onChange = onChange;
    this.tab = 'python';
    this.list = $('chal-list');
    this.play = $('chal-play');
    this.list.addEventListener('click', e => this.onListClick(e));
  }

  unlocked(c) { return this.p.isDone(LEVELS.findIndex(l => l.id === c.requires)); }

  // ---------- lista con pestañas ----------
  show(tab = this.tab) {
    this.tab = tab;
    const p = this.p;
    const count = t => `${CHALLENGES.filter(c => c.type === t && p.chal(c.id)).length}/${CHALLENGES.filter(c => c.type === t).length}`;
    const items = CHALLENGES.filter(c => c.type === tab);
    const T = CHALLENGE_TYPES[tab];
    this.list.innerHTML = `
      <header class="path-top">
        <button class="chal-back" data-act="back">‹ Ruta</button>
        <div class="path-stats">
          <span class="st xp">⚡ ${p.xp} XP</span>
          <span class="st star">🏅 ${CHALLENGES.filter(c => p.chal(c.id)).length}/${CHALLENGES.length}</span>
        </div>
        <span></span>
      </header>
      <div class="path-scroll"><div class="chal-col">
        <h1 class="chal-h">🏅 Desafíos</h1>
        <p class="chal-sub">35 retos extra para practicar. Se desbloquean al avanzar en la ruta.</p>
        <div class="chal-tabs">${Object.entries(CHALLENGE_TYPES).map(([k, v]) =>
          `<button data-tab="${k}" class="${k === tab ? 'on' : ''}" style="--c:${v.color};--d:${v.dark}">${v.icon} ${v.label} <small>${count(k)}</small></button>`).join('')}</div>
        <div class="chal-grid" style="--c:${T.color};--d:${T.dark}">
          ${items.map((c, n) => {
            const st = p.chal(c.id);
            const open = this.unlocked(c);
            const req = LEVELS.find(l => l.id === c.requires);
            return `<button class="chal-card ${st ? 'done' : open ? 'open' : 'locked'}" data-chal="${c.id}">
              <span class="cc-num">${open ? (st ? '✓' : n + 1) : '🔒'}</span>
              <b>${c.title}</b>
              <small>${st ? (c.type === 'quiz' ? '¡Correcto!' : '★'.repeat(st.stars) + '☆'.repeat(3 - st.stars)) : open ? 'Empezar' : `Termina «${req.title}»`}</small>
            </button>`;
          }).join('')}
        </div>
      </div></div>`;
    this.list.classList.remove('hidden');
  }
  hide() { this.list.classList.add('hidden'); }

  onListClick(e) {
    if (e.target.closest('[data-act="back"]')) { sfx.tap(); this.hide(); this.onBack(); return; }
    const t = e.target.closest('[data-tab]');
    if (t) { sfx.tap(); this.show(t.dataset.tab); return; }
    const card = e.target.closest('[data-chal]');
    if (!card) return;
    const c = CHALLENGES.find(x => x.id === card.dataset.chal);
    if (!this.unlocked(c)) {
      sfx.bump();
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
      return;
    }
    sfx.tap();
    this.open(c);
  }

  // ---------- reproductor ----------
  open(c) {
    const T = CHALLENGE_TYPES[c.type];
    const root = this.play;
    root.style.setProperty('--unit', T.color);
    root.style.setProperty('--unit-dark', T.dark);
    root.innerHTML = `
      <div class="onb-top">
        <button class="onb-x" title="Salir">✕</button>
        <span class="chal-tag">${T.icon} ${T.label}</span>
        <b class="chal-title">${c.title}</b>
      </div>
      <div class="onb-body chal-body"></div>
      <div class="onb-foot"><div class="onb-fb"></div><button class="onb-btn">Comprobar</button></div>`;
    root.classList.remove('hidden');
    this.busy = false; this.running = false;
    this.body = root.querySelector('.chal-body');
    this.btn = root.querySelector('.onb-btn');
    this.fb = root.querySelector('.onb-fb');
    this.foot = root.querySelector('.onb-foot');
    root.querySelector('.onb-x').onclick = () => this.close();
    this.c = c;
    ({ python: () => this.python(c), quiz: () => this.quiz(c), blocks: () => this.blocks(c) })[c.type]();
  }
  close() {
    this.play.classList.add('hidden');
    this.busy = true; // detiene animaciones en curso
    this.show(this.tab);
  }

  feedback(ok, title, text, btnText) {
    this.foot.className = `onb-foot ${ok ? 'good' : 'bad'}`;
    this.fb.innerHTML = `<b>${title}</b>${text ? `<span>${text}</span>` : ''}`;
    if (btnText) this.btn.textContent = btnText;
  }
  clearFeedback(btnText = 'Comprobar') {
    this.foot.className = 'onb-foot';
    this.fb.innerHTML = '';
    this.btn.textContent = btnText;
  }
  win(stars, extra = '') {
    const r = this.p.recordChallenge(this.c, stars);
    sfx.win();
    this.feedback(true, `¡Desafío superado! ${this.c.type === 'quiz' ? '' : '★'.repeat(stars) + '☆'.repeat(3 - stars)} ${r.xp ? `+${r.xp} XP` : ''}`, extra, 'Continuar');
    this.onChange?.();
    this.body.classList.add('won');
    this.btn.disabled = false;
    this.btn.onclick = () => { sfx.tap(); this.close(); };
  }

  // ---------- 🐍 Python con Qiskit ----------
  python(c) {
    let code = [];
    const n = c.qubits;
    const run = () => { const s = new Sim(); code.forEach(g => s.apply(g)); return s; };
    const render = () => {
      const s = run();
      this.body.innerHTML = `
        <p class="chal-goal">${esc(c.goal)}</p>
        <div class="chal-split">
          <div>
            <div class="pycode">
              <div class="pre"><span class="kw">from</span> qiskit <span class="kw">import</span> QuantumCircuit</div>
              <div class="pre">qc = QuantumCircuit(<span class="num">${n}</span>)  <span class="cm"># qubit 0 = Schrödi${n === 2 ? ', qubit 1 = Qubita' : ''}</span></div>
              ${code.map((g, i) => `<div class="pyline"><span><span class="qobj">qc</span>.<span class="qfn">${esc(GATE_PY[g].slice(3)).replace(/(\d)/g, '<span class="num">$1</span>')}</span></span><button data-del="${i}" title="Borrar línea">✕</button></div>`).join('')}
              <div class="pyline caret-line"><span class="caret"></span></div>
            </div>
            <div class="pychips">${c.gates.map(g => `<button class="chip q" data-g="${g}" title="${GATE_TIP[g]}">${GATE_PY[g]}</button>`).join('')}
              <button class="chip" data-undo="1" title="Borrar la última línea">⌫</button></div>
            <p class="chal-rule">${[c.mustUse && `Debes usar ${c.mustUse.map(g => `<code>${GATE_PY[g]}</code>`).join(', ')}.`, c.forbid && `Prohibido usar ${c.forbid.map(g => `<code>${GATE_PY[g]}</code>`).join(', ')}.`, `Lo ideal: ${c.best} ${c.best === 1 ? 'línea' : 'líneas'} para 3 ⭐.`].filter(Boolean).join(' ')}
              <button class="chal-hint" data-hint="1">💡 Pista</button></p>
          </div>
          <div class="chal-states">
            <div><h4>🎯 Objetivo</h4>${bars(c.target, n, 'target')}</div>
            <div><h4>🐱 Tu resultado</h4>${bars(s.a, n)}</div>
          </div>
        </div>`;
      this.body.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { if (code.length < 8) { sfx.tap(); code.push(b.dataset.g); this.clearFeedback(); render(); } });
      this.body.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { sfx.tap(); code.splice(+b.dataset.del, 1); this.clearFeedback(); render(); });
      this.body.querySelector('[data-undo]').onclick = () => { code.pop(); this.clearFeedback(); render(); };
      this.body.querySelector('[data-hint]').onclick = () => this.feedback(false, '💡 Pista', esc(c.hint));
    };
    render();
    this.btn.onclick = () => {
      if (!code.length) return this.feedback(false, 'Escribe tu código primero', 'Toca las compuertas de abajo para agregar líneas.');
      const s = run();
      if (c.forbid?.some(g => code.includes(g))) return (sfx.fail(), this.feedback(false, 'Usaste una compuerta prohibida', `No se vale ${c.forbid.map(g => GATE_PY[g]).join(', ')} en este desafío.`));
      if (c.mustUse?.some(g => !code.includes(g))) return (sfx.fail(), this.feedback(false, 'Falta una compuerta', `Tienes que usar ${c.mustUse.map(g => GATE_PY[g]).join(', ')}.`));
      if (s.fidelity(c.target) < 0.999) return (sfx.fail(), this.feedback(false, 'Todavía no llegas al objetivo', 'Compara las barras y los números. ¡Ojo con los signos menos!'));
      const stars = code.length <= c.best ? 3 : code.length <= c.best + 2 ? 2 : 1;
      this.win(stars, stars < 3 ? `Se puede con ${c.best} ${c.best === 1 ? 'línea' : 'líneas'}. ¡Inténtalo para 3 ⭐!` : '¡Código perfecto!');
    };
  }

  // ---------- ❓ Quiz ----------
  quiz(c) {
    let first = true;
    const render = () => {
      const opts = shuffle(c.options.map((t, i) => ({ t: tr(t), ok: i === c.answer })));
      let picked = null, checked = false;
      this.clearFeedback();
      this.btn.disabled = true;
      this.body.innerHTML = `
        <p class="onb-q">${esc(tr(c.q)).replace(/\n/g, '<br>')}</p>
        <div class="onb-opts">${opts.map((o, i) => `<button class="onb-opt" data-i="${i}"><span class="onb-key">${i + 1}</span><span class="onb-ot">${esc(o.t)}</span></button>`).join('')}</div>`;
      const all = this.body.querySelectorAll('.onb-opt');
      all.forEach(b => b.onclick = () => {
        if (checked) return;
        sfx.tap();
        all.forEach(x => x.classList.toggle('sel', x === b));
        picked = opts[+b.dataset.i];
        this.btn.disabled = false;
      });
      this.btn.onclick = () => {
        if (!picked || checked) return;
        checked = true;
        all.forEach((b, i) => { if (opts[i].ok) b.classList.add('ok'); else if (opts[i] === picked) b.classList.add('bad'); });
        if (picked.ok) return this.win(first ? 3 : 1, esc(c.explain));
        first = false;
        sfx.fail();
        this.feedback(false, 'Casi…', esc(c.explain), 'Intentar otra vez');
        this.btn.onclick = () => { sfx.tap(); render(); };
      };
    };
    render();
  }

  // ---------- 🧩 Bloques ----------
  blocks(c) {
    const pool = shuffle(c.blocks.map((b, i) => ({ b, id: i })));
    let prog = [];
    const grid = !!c.map;
    const render = (state) => {
      const avail = pool.filter(x => !prog.includes(x));
      this.body.innerHTML = `
        <p class="chal-goal">${esc(c.goal)}</p>
        <div class="chal-split">
          <div>
            <h4 class="blk-h">Tu programa</h4>
            <div class="blk-prog">${prog.length ? prog.map((x, i) => this.block(x.b, `data-rm="${i}"`, state?.step === i)).join('') : '<p class="blk-empty">Toca los bloques de abajo para armar tu programa ⬇️</p>'}</div>
            <h4 class="blk-h">Bloques <small>(algunos sobran)</small></h4>
            <div class="blk-pool">${avail.map(x => this.block(x.b, `data-add="${x.id}"`)).join('')}</div>
          </div>
          <div class="chal-states">${grid ? this.grid(c, state) : `<div><h4>🎯 Objetivo</h4>${bars(c.target, c.qubits, 'target')}</div><div><h4>🐱 Tu resultado</h4>${bars(state?.amps || [1, 0, 0, 0], c.qubits)}</div>`}</div>
        </div>`;
      this.body.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { if (this.running) return; sfx.tap(); prog.push(pool.find(x => x.id === +b.dataset.add)); this.clearFeedback('Probar'); render(); });
      this.body.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { if (this.running) return; sfx.tap(); prog.splice(+b.dataset.rm, 1); this.clearFeedback('Probar'); render(); });
    };
    render();
    this.clearFeedback('Probar');
    this.btn.onclick = async () => {
      if (this.running) return;
      if (!prog.length) return this.feedback(false, 'Arma tu programa primero', 'Toca los bloques para ponerlos en orden.', 'Probar');
      this.running = true; this.busy = false;
      const res = grid ? await this.runGrid(c, prog.map(x => x.b), s => render(s)) : this.runQuantum(c, prog.map(x => x.b), s => render(s));
      this.running = false;
      if (this.busy) return; // el niño cerró el desafío
      if (res.ok) {
        const extra = c.blocks.length - prog.length;
        this.win(3, extra > 0 ? `Sobraron ${extra} ${extra === 1 ? 'bloque' : 'bloques'}: ¡bien hecho al no usarlos!` : '');
      } else {
        sfx.fail();
        this.feedback(false, 'Todavía no', res.msg, 'Probar otra vez');
      }
    };
  }

  block(name, attr, active) {
    const b = BLOCK[name];
    return `<button class="blk ${b.k} ${active ? 'active' : ''}" ${attr}><span>${b.i}</span>${b.t}<code>${esc(tr(name + '()'))}</code></button>`;
  }

  runQuantum(c, prog, render) {
    const s = new Sim();
    for (const b of prog) {
      if (b === 'medir') { s.measure(); render({ amps: s.a }); return { ok: false, msg: 'Mediste al gato y se acabó la superposición. Ese bloque sobraba.' }; }
      s.apply(BLOCK_GATE[b]);
    }
    render({ amps: s.a });
    return s.fidelity(c.target) > 0.999 ? { ok: true } : { ok: false, msg: 'El resultado no coincide con el objetivo. Revisa el orden de los bloques.' };
  }

  // mini mapa: S inicio · . camino · # árbol · F pez · A puerta del sol · D puerta de la luna · Q muro cuántico
  grid(c, st) {
    const cat = st?.cat || this.start(c);
    const ghost = cat.p1 > 0.01 && cat.p1 < 0.99;
    const face = ghost ? '👻' : cat.p1 > 0.5 ? '😺' : '😴';
    const arrow = ['→', '↓', '←', '↑'][cat.dir];
    return `<div><h4>🗺️ Mapa</h4><div class="mini-map" style="--cols:${Math.max(...c.map.map(r => r.length))}">${c.map.map((row, r) => [...row].map((ch, col) => {
      const here = cat.c === col && cat.r === r;
      const taken = st?.taken?.has(`${col},${r}`);
      const icon = { F: taken ? '' : '🐟', A: '☀️', D: '🌙', Q: '🟣', '#': '🌳' }[ch] || '';
      return `<div class="mm ${ch === ' ' ? 'void' : ch === '#' ? 'tree' : 'path'}">${here ? `<span class="mm-cat ${cat.fall ? 'fall' : ''}">${face}<i>${arrow}</i></span>` : icon}</div>`;
    }).join('')).join('')}</div>
      <p class="mm-state">${face} ${ghost ? 'en superposición' : cat.p1 > 0.5 ? 'despierto' : 'dormido'} · 🐟 ${st?.taken?.size || 0}/${c.map.join('').split('F').length - 1}</p></div>`;
  }
  start(c) {
    const r = c.map.findIndex(row => row.includes('S'));
    return { c: c.map[r].indexOf('S'), r, dir: c.dir, p1: 0 };
  }
  async runGrid(c, prog, render) {
    const at = (x, y) => (c.map[y] && c.map[y][x]) || ' ';
    const cat = this.start(c);
    const q = new Sim();
    const taken = new Set();
    const total = c.map.join('').split('F').length - 1;
    const step = async i => { cat.p1 = q.p1(); render({ cat: { ...cat }, taken, step: i }); await sleep(380); return !this.busy; };
    await step(-1);
    for (let i = 0; i < prog.length; i++) {
      const b = prog[i];
      if (b === 'avanzar') {
        const [dx, dy] = [[1, 0], [0, 1], [-1, 0], [0, -1]][cat.dir];
        const ch = at(cat.c + dx, cat.r + dy);
        if (ch === ' ') { cat.c += dx; cat.r += dy; cat.fall = true; sfx.fall(); await step(i); return { ok: false, msg: '😿 ¡Schrödi se cayó del mapa! Revisa hacia dónde mira.' }; }
        if (ch === '#') { sfx.bump(); return { ok: false, msg: '🌳 Hay un árbol en el camino.' }; }
        const p = q.p1();
        if (ch === 'Q' && !(p > 0.01 && p < 0.99)) { sfx.bump(); return { ok: false, msg: '🟣 El muro solo deja pasar gatos en superposición.' }; }
        if (ch === 'A' && p < 0.99) { sfx.bump(); return { ok: false, msg: '☀️ La puerta del sol solo se abre para gatos 😺 al 100%.' }; }
        if (ch === 'D' && p > 0.01) { sfx.bump(); return { ok: false, msg: '🌙 La puerta de la luna solo se abre para gatos 😴 al 100%.' }; }
        cat.c += dx; cat.r += dy; sfx.step();
      } else if (b === 'girarIzquierda' || b === 'girarDerecha') {
        cat.dir = (cat.dir + (b === 'girarDerecha' ? 1 : 3)) % 4; sfx.turn();
      } else if (b === 'recogerPez') {
        const k = `${cat.c},${cat.r}`;
        if (at(cat.c, cat.r) !== 'F' || taken.has(k)) { sfx.bump(); return { ok: false, msg: '🐟 Aquí no hay pez para recoger.' }; }
        taken.add(k); sfx.fish();
      } else if (b === 'medir') {
        q.measure(); sfx.measure();
      } else {
        q.apply(BLOCK_GATE[b]); b === 'aplicarH' ? sfx.h() : sfx.x();
      }
      if (!(await step(i))) return { ok: false };
    }
    return taken.size === total ? { ok: true } : { ok: false, msg: `Te ${total - taken.size === 1 ? 'falta 1 pez' : `faltan ${total - taken.size} peces`}.` };
  }
}
