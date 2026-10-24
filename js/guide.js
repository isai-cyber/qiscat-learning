// Guía "Conoce tus botones": qué hace cada botón de la paleta Operations + quiz "¿Cuál es cuál?"
import { OPS, OP, OP_CATS, OP_GUIDE, OP_QUIZ, newGate, gatePy, gateEs, toOp, blockHead } from './ops.js';
import { tile } from './palette.js';
import { QSim, normalizePhase, fmtAmp } from './qsim.js';
import { LEVELS } from './levels.js';
import { getLang } from './lang.js';
import { sfx } from './audio.js';

const $ = id => document.getElementById(id);
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const PREP = { 0: [1, []], 1: [1, ['x']], '+': [1, ['h']], 10: [2, ['x']], 110: [3, ['x', 'x1']], '++': [2, ['h', 'h1']] };

// Texto del estado: 0.71|😴⟩ + 0.71|😺⟩
function ket(sim) {
  const amps = normalizePhase(sim.amps());
  return amps.map((a, i) => ({ a, k: i.toString(2).padStart(sim.n, '0').replace(/0/g, '😴').replace(/1/g, '😺') }))
    .filter(t => Math.hypot(...t.a) > 5e-3)
    .map((t, j) => { let s = fmtAmp(t.a, true); const neg = s.startsWith('−'); if (neg) s = s.slice(1); return `${j ? (neg ? ' − ' : ' + ') : (neg ? '−' : '')}${s}|${t.k}⟩`; }).join('');
}

// Ejemplo en vivo: estado antes → después de la compuerta
function demo(id) {
  const g = OP_GUIDE[id];
  if (!g.demo) return null;
  const [n, prep] = PREP[g.demo];
  const sim = new QSim(n);
  prep.forEach(p => sim.op(p === 'x1' ? { g: 'x', q: 1 } : p === 'h1' ? { g: 'h', q: 1 } : { g: p, q: 0 }));
  const before = ket(sim);
  if (id === 'measure') return { before, after: '😴 o 😺 (al azar, 50% cada uno)' };
  if (id === 'barrier') return { before, after: before + '  (no cambia)' };
  const ln = newGate(id);
  sim.op(toOp(ln));
  return { before, after: ket(sim) };
}

function codeOf(id) {
  const o = OP[id], py = getLang() === 'py';
  if (o.kind === 'block') {
    const ln = id === 'for' ? { t: 'for', n: 3 } : { t: id };
    return blockHead(ln, py ? 'py' : 'es');
  }
  if (id === 'measure') return py ? 'qc.measure_all()' : 'medir()';
  const ln = newGate(id);
  return py ? gatePy(ln) : gateEs(ln);
}

export class OpsGuide {
  constructor({ save, persist, progress, onClose }) {
    Object.assign(this, { save, persist, progress, onClose });
    save.opsGuide ||= { seen: [], quiz: false, shown: false };
    this.root = $('guide');
  }
  get g() { return this.save.opsGuide; }
  get firstTime() { return !this.g.shown; }

  status(id) {
    const u = OP_GUIDE[id].unlock;
    if (u === 'lab') return { ok: false, text: '🧪 Solo en el Laboratorio (necesita 3 qubits)' };
    const i = LEVELS.findIndex(l => l.id === u);
    return this.progress.isUnlocked(i)
      ? { ok: true, text: `✓ Ya puedes usarlo (desde «${LEVELS[i].title}»)` }
      : { ok: false, text: `🔒 Se desbloquea en «${LEVELS[i].title}»` };
  }

  open() {
    this.g.shown = true; this.persist();
    this.sel = null;
    this.root.innerHTML = `
      <div class="onb-top guide-top">
        <button class="onb-x" title="Cerrar">✕</button>
        <div class="seg gtabs"><button data-tab="cat" class="on">📖 Conoce tus botones</button><button data-tab="quiz">❓ ¿Cuál es cuál?</button></div>
        <span class="onb-lvl" id="g-count"></span>
      </div>
      <div class="guide-body" id="g-body"></div>
      <div class="onb-foot"><div class="onb-fb"></div><button class="onb-btn" id="g-btn">Hacer el quiz</button></div>`;
    this.root.classList.remove('hidden');
    this.root.querySelector('.onb-x').onclick = () => this.close();
    this.root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => this.tab(b.dataset.tab));
    this.tab('cat');
  }
  close() { this.root.classList.add('hidden'); this.onClose?.(); }

  tab(t) {
    this.root.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    t === 'cat' ? this.catalog() : this.quiz();
  }

  // ---------- catálogo ----------
  catalog() {
    const seen = new Set(this.g.seen);
    $('g-count').textContent = `Explorados ${seen.size}/${OPS.length}`;
    const foot = this.root.querySelector('.onb-foot');
    foot.className = 'onb-foot';
    this.root.querySelector('.onb-fb').innerHTML = '<span class="g-hint">💡 Toca cada botón para descubrir qué hace. En el juego, mantén presionado un botón para ver su explicación.</span>';
    $('g-btn').textContent = 'Hacer el quiz ›';
    $('g-btn').disabled = false;
    $('g-btn').onclick = () => this.tab('quiz');
    $('g-body').innerHTML = `
      <div class="guide-cats">${OP_CATS.map(c => `
        <section class="gcat"><h4><i class="dot op-${c.color}"></i>${c.name}<small>${c.desc}</small></h4>
          <div class="gtiles">${OPS.filter(o => OP_GUIDE[o.id].cat === c.id).map(o => `<div class="gt">${tile(o, (this.sel === o.id ? 'sel ' : '') + (seen.has(o.id) ? 'seen' : ''), `data-g="${o.id}"`)}<small>${o.name}</small></div>`).join('')}</div>
        </section>`).join('')}</div>
      <div class="guide-card" id="g-card">${this.card(this.sel)}</div>`;
    $('g-body').querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
      sfx.tap();
      this.sel = b.dataset.g;
      if (!this.g.seen.includes(this.sel)) { this.g.seen.push(this.sel); this.persist(); }
      this.catalog();
    });
  }
  card(id) {
    if (!id) return `<div class="gcard-empty"><div class="onb-owl">🦉</div>
      <p><b>¡Estos son tus botones de IBM Quantum Composer!</b></p>
      <p>Cada color es una familia. Toca un botón y te digo qué le hace al gato, qué código escribe y cuándo lo puedes usar.</p></div>`;
    const o = OP[id], g = OP_GUIDE[id], d = demo(id), st = this.status(id);
    return `<div class="gcard-head">${tile(o, 'big')}<div><small>${OP_CATS.find(c => c.id === g.cat).name}</small><h3>${o.name}</h3></div></div>
      <p class="gcard-kid">${g.kid}</p>
      ${d ? `<div class="gdemo"><div><small>Antes</small><b>${d.before}</b></div><span>➜</span><div><small>Después</small><b>${d.after}</b></div></div>` : ''}
      <div class="gcode"><small>Escribe en tu código</small><code>${codeOf(id)}</code></div>
      <p class="gstatus ${st.ok ? 'ok' : ''}">${st.text}</p>`;
  }

  // ---------- quiz ----------
  quiz() {
    const qs = shuffle(OP_QUIZ).slice(0, 5);
    let k = 0, right = 0, picked = null, checked = false;
    const foot = this.root.querySelector('.onb-foot'), fb = this.root.querySelector('.onb-fb'), btn = $('g-btn');
    const render = () => {
      const q = qs[k];
      const opts = shuffle([q.a, ...shuffle(OPS.map(o => o.id).filter(id => id !== q.a)).slice(0, 3)]);
      picked = null; checked = false;
      $('g-count').textContent = `Pregunta ${k + 1} de ${qs.length}`;
      foot.className = 'onb-foot'; fb.innerHTML = '';
      btn.textContent = 'Comprobar'; btn.disabled = true;
      $('g-body').innerHTML = `<div class="gquiz"><h2 class="onb-h">${q.q}</h2>
        <div class="gq-opts">${opts.map(id => `<div class="gq">${tile(OP[id], 'big', `data-q="${id}"`)}</div>`).join('')}</div></div>`;
      $('g-body').querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
        if (checked) return;
        sfx.tap(); picked = b.dataset.q;
        $('g-body').querySelectorAll('[data-q]').forEach(x => x.classList.toggle('sel', x === b));
        btn.disabled = false;
      });
      btn.onclick = () => {
        if (!picked) return;
        if (!checked) {
          checked = true;
          const ok = picked === q.a;
          if (ok) right++;
          $('g-body').querySelectorAll('[data-q]').forEach(x => { if (x.dataset.q === q.a) x.classList.add('right'); else if (x.dataset.q === picked) x.classList.add('wrong'); });
          // mostrar los nombres
          $('g-body').querySelectorAll('.gq').forEach(gq => { const id = gq.querySelector('[data-q]').dataset.q; gq.insertAdjacentHTML('beforeend', `<small>${OP[id].name}</small>`); });
          ok ? sfx.fish() : sfx.fail();
          foot.className = `onb-foot ${ok ? 'good' : 'bad'}`;
          fb.innerHTML = `<b>${ok ? '¡Correcto!' : `Era: ${OP[q.a].name}`}</b><span>${OP_GUIDE[q.a].kid}</span>`;
          btn.textContent = 'Continuar';
          return;
        }
        k++;
        if (k < qs.length) return render();
        // resultado
        let xp = 0;
        if (right >= 4 && !this.g.quiz) { xp = 10; this.g.quiz = true; this.progress.gain(xp); this.progress.touchStreak(); this.progress.persist(); }
        this.persist();
        sfx.win();
        foot.className = 'onb-foot good';
        fb.innerHTML = `<b>${right}/${qs.length} correctas${xp ? ` · +${xp} XP` : ''}</b><span>${right >= 4 ? '¡Ya conoces tus botones! Mantén presionado cualquiera en el juego si se te olvida.' : 'Repasa el catálogo y vuelve a intentarlo.'}</span>`;
        $('g-body').innerHTML = `<div class="gquiz"><div class="onb-icon">${right >= 4 ? '🏅' : '📖'}</div><h2 class="onb-h">${right >= 4 ? '¡Experto en botones!' : '¡Casi!'}</h2></div>`;
        btn.textContent = right >= 4 ? '¡A jugar!' : 'Repasar el catálogo';
        btn.onclick = () => right >= 4 ? this.close() : this.tab('cat');
      };
    };
    render();
  }
}
