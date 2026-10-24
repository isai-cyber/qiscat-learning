// 🧪 Laboratorio: modo libre como IBM Quantum Composer (1 a 3 qubits)
import { QSim, normalizePhase, fmtAmp } from './qsim.js';
import { OP, toOp } from './ops.js';
import { renderPalette } from './palette.js';
import { renderCircuit } from './circuit.js';
import { toQiskit, toQasm, circuitItems } from './codegen.js';
import { CodeEditor } from './editor.js?v=5';
import { sfx } from './audio.js';

const $ = id => document.getElementById(id);
const SHOTS = 1024;

// Ejemplos tomados de los temas del curso (Qiskit Fall Fest / IBM Quantum Learning)
const G = (g, q = 0, extra = {}) => ({ t: 'gate', g, q, ...extra });
const M = { t: 'cmd', name: 'medir' };
const EXAMPLES = [
  { name: '🪙 Moneda cuántica', n: 1, lines: [G('h'), M], tip: 'H crea superposición: al medir 1024 veces sale ~50% y ~50%.' },
  { name: '🌊 Interferencia', n: 1, lines: [G('h'), G('h'), M], tip: 'H·H = I: las amplitudes de |1⟩ se cancelan y siempre sale 0.' },
  { name: '🔄 X = H Z H', n: 1, lines: [G('h'), G('z'), G('h'), M], tip: 'Cambio de base: H Z H es igual a X.' },
  { name: '🧭 Fases S y T', n: 1, lines: [G('h'), G('t'), G('t'), G('s')], tip: 'T·T = S y S·S = Z: mira cómo gira la fase (el color).' },
  { name: '🔗 Estado de Bell', n: 2, lines: [G('h', 0), G('cx', 0, { q2: 1 }), M], tip: '(|00⟩+|11⟩)/√2: siempre salen iguales. ¡Entrelazamiento!' },
  { name: '🐱🐱🐱 GHZ', n: 3, lines: [G('h', 0), G('cx', 0, { q2: 1 }), G('cx', 1, { q2: 2 }), M], tip: 'Tres gatos entrelazados: 000 o 111.' },
  { name: '➕ Sumador medio', n: 3, lines: [G('x', 0), G('x', 1), G('ccx', 0, { q2: 1, q3: 2 }), G('cx', 0, { q2: 1 }), M], tip: '1+1 = 10 en binario: q1 = suma, q2 = acarreo (Toffoli + CNOT).' },
  { name: '🎲 Rotación RY', n: 1, lines: [G('ry', 0, { a: 0 }), M], tip: 'RY(π/4): ~85% 0 y ~15% 1. No todo es 50/50.' },
];

// Ejecuta el programa (árbol del editor) sobre un simulador
function runTree(sim, tree, onFirstMeasure) {
  let count = 0, first = true;
  const exec = nodes => {
    for (const { ln, body } of nodes) {
      if (++count > 300) return;
      if (body) {
        if (ln.t === 'for') for (let k = 0; k < ln.n; k++) exec(body);
        else if (ln.t === 'if') { if (sim.cl[0] === 1) exec(body); }
        else if (ln.t === 'while') { let k = 0; while (sim.cl[0] === 1 && k++ < 12) exec(body); }
        else exec(body);
        continue;
      }
      if (ln.t === 'gate') {
        const o = OP[ln.g];
        if ((o.kind === 'g2' && sim.n < 2) || (o.kind === 'g3' && sim.n < 3)) continue;
        sim.op(toOp(ln));
      } else if (ln.name === 'medir') {
        if (first) { onFirstMeasure?.(sim); first = false; }
        sim.measureAll();
      }
    }
  };
  exec(tree);
  return !first;
}

// Pureza del qubit k (1 = independiente, 0.5 = totalmente entrelazado) y P(|1⟩)
function qubitInfo(sim, k) {
  const m = sim.mask(k);
  let a = 0, d = 0, br = 0, bi = 0;
  for (let i = 0; i < sim.N; i++) {
    if (i & m) continue;
    const j = i | m;
    a += sim.re[i] ** 2 + sim.im[i] ** 2;
    d += sim.re[j] ** 2 + sim.im[j] ** 2;
    br += sim.re[i] * sim.re[j] + sim.im[i] * sim.im[j];
    bi += sim.im[i] * sim.re[j] - sim.re[i] * sim.im[j];
  }
  return { p1: d, purity: a * a + d * d + 2 * (br * br + bi * bi) };
}

const phaseColor = ([re, im]) => `hsl(${((Math.atan2(im, re) * 180 / Math.PI) + 360) % 360}, 75%, 55%)`;

export class Lab {
  constructor({ save, persist, onBack, showCode, onHelp }) {
    this.save = save; this.persist = persist; this.onBack = onBack; this.showCode = showCode; this.onHelp = onHelp;
    this.root = $('lab');
    save.lab ||= { n: 2, lines: [G('h', 0), G('cx', 0, { q2: 1 }), M] };
    this.active = 0;
  }

  // ex: índice de un ejemplo para abrir directo (tutoriales de las rutas)
  show(ex) {
    const s = this.save.lab;
    this.root.innerHTML = `
      <header class="lab-top">
        <button class="chal-back" data-act="back">‹ Ruta</button>
        <h1>🧪 Laboratorio cuántico <small>como IBM Quantum Composer</small></h1>
        <div class="lab-tools">
          <div class="seg" id="lab-n">${[1, 2, 3].map(k => `<button data-n="${k}" class="${s.n === k ? 'on' : ''}">${k} qubit${k > 1 ? 's' : ''}</button>`).join('')}</div>
          <button class="qk-btn" data-act="code">📋 Qiskit / QASM</button>
        </div>
      </header>
      <div class="lab-body">
        <aside class="lab-left">
          <div id="lab-ops"></div>
          <div class="lab-active"><b>Qubit activo</b><div class="seg" id="lab-q"></div></div>
          <div class="lab-examples"><b>Ejemplos</b>${EXAMPLES.map((e, i) => `<button data-ex="${i}">${e.name}</button>`).join('')}</div>
        </aside>
        <section class="lab-mid">
          <div class="circ-scroll lab-circ" id="lab-circ"></div>
          <div class="lab-codebar">
            <button class="tool" data-act="undo" title="Deshacer">↶</button>
            <button class="tool" data-act="redo" title="Rehacer">↷</button>
            <button class="tool" data-act="back1" title="Borrar línea">⌫</button>
            <button class="tool" data-act="enter" title="Salir del bloque">↵</button>
            <button class="tool" data-act="clear" title="Borrar todo">🗑</button>
            <span class="lab-tip" id="lab-tip">Toca las compuertas para armar tu circuito. Toca los números del código para cambiar de qubit o de ángulo.</span>
          </div>
          <div class="code lab-code" id="lab-code"></div>
        </section>
        <aside class="lab-right">
          <h3>Probabilidades <small>${SHOTS} disparos</small></h3>
          <div id="lab-hist" class="lab-hist"></div>
          <h3>Vector de estado <small>${'antes de medir'}</small></h3>
          <div id="lab-sv" class="lab-sv"></div>
          <p class="lab-ket" id="lab-ket"></p>
          <h3>Discos de fase <small>por qubit</small></h3>
          <div id="lab-discs" class="lab-discs"></div>
        </aside>
      </div>`;
    this.root.classList.remove('hidden');
    this.editor = new CodeEditor($('lab-code'), lines => { this.save.lab.lines = lines; this.persist(); this.refresh(); });
    this.editor.setContext({ quantum: true, n: s.n });
    this.editor.load(s.lines);
    this.root.onclick = e => this.onClick(e);
    this.renderControls();
    this.refresh();
    if (ex != null) this.root.querySelector(`[data-ex="${ex}"]`)?.click();
  }
  hide() { this.root.classList.add('hidden'); }

  renderControls() {
    const n = this.save.lab.n;
    if (this.active >= n) this.active = 0;
    const disabled = {};
    if (n < 2) ['cx', 'swap', 'cz'].forEach(id => disabled[id] = 'Necesita 2 qubits');
    if (n < 3) disabled.ccx = 'Necesita 3 qubits';
    renderPalette($('lab-ops'), {
      disabled, onHelp: this.onHelp,
      onPick: (id, why) => {
        if (why) { $('lab-tip').textContent = `🔒 ${OP[id].name}: ${why}. Cambia el número de qubits arriba.`; return; }
        sfx.tap();
        this.editor.insert(id, this.active);
        $('lab-tip').textContent = `${OP[id].name}: ${OP[id].tip}`;
      },
    });
    $('lab-q').innerHTML = Array.from({ length: n }, (_, k) => `<button data-q="${k}" class="${k === this.active ? 'on' : ''}">q[${k}]</button>`).join('');
  }

  onClick(e) {
    const t = e.target.closest('[data-act],[data-n],[data-q],[data-ex]');
    if (!t || t.closest('#lab-code')) return;
    const a = t.dataset.act;
    if (a === 'back') { this.hide(); this.onBack(); return; }
    if (a === 'code') return this.exportCode();
    if (a === 'undo') return this.editor.undo();
    if (a === 'redo') return this.editor.redo();
    if (a === 'back1') return this.editor.backspace();
    if (a === 'enter') return this.editor.exitBlock();
    if (a === 'clear') return this.editor.clear();
    if (t.dataset.n) {
      this.save.lab.n = +t.dataset.n; this.persist();
      this.root.querySelectorAll('#lab-n button').forEach(b => b.classList.toggle('on', b === t));
      this.editor.setContext({ quantum: true, n: this.save.lab.n });
      this.renderControls(); this.refresh();
      return;
    }
    if (t.dataset.q) { this.active = +t.dataset.q; this.renderControls(); return; }
    if (t.dataset.ex) {
      const ex = EXAMPLES[+t.dataset.ex];
      sfx.tap();
      this.save.lab.n = ex.n;
      this.root.querySelectorAll('#lab-n button').forEach(b => b.classList.toggle('on', +b.dataset.n === ex.n));
      this.editor.setContext({ quantum: true, n: ex.n });
      this.editor.snapshot();
      this.editor.lines = JSON.parse(JSON.stringify(ex.lines));
      this.editor.cursor = this.editor.lines.length;
      this.editor.changed();
      this.renderControls();
      $('lab-tip').textContent = ex.tip;
    }
  }

  // Simula: estado antes de medir + histograma de 1024 disparos
  refresh() {
    const n = this.save.lab.n, tree = this.editor.tree();
    $('lab-circ').innerHTML = renderCircuit(circuitItems(tree), n);
    let before = null;
    const main = new QSim(n);
    const measured = runTree(main, tree, sim => { before = new QSim(n); before.re.set(sim.re); before.im.set(sim.im); });
    const sv = before || main;
    // histograma
    let counts;
    if (!measured) counts = sv.sample(SHOTS);
    else {
      counts = {};
      for (let s = 0; s < SHOTS; s++) {
        const sim = new QSim(n);
        runTree(sim, tree);
        const key = sim.cl.join('');
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    const keys = Array.from({ length: 1 << n }, (_, i) => i.toString(2).padStart(n, '0'));
    $('lab-hist').innerHTML = keys.map(k => {
      const v = counts[k] || 0, p = v / SHOTS;
      return `<div class="hb"><b>${(p * 100).toFixed(1)}%</b><div class="hb-col"><i style="height:${p * 100}%"></i></div><span>${k}</span><small>${v}</small></div>`;
    }).join('');
    // vector de estado (la fase es el color)
    const amps = normalizePhase(sv.amps());
    $('lab-sv').innerHTML = amps.map((a, i) => {
      const mag = Math.hypot(...a);
      return `<div class="hb"><div class="hb-col"><i style="height:${mag * 100}%;background:${mag > 1e-6 ? phaseColor(a) : 'transparent'}"></i></div><span>${keys[i]}</span><small>${mag > 1e-6 ? fmtAmp(a) : '0'}</small></div>`;
    }).join('') + '<div class="phase-legend" title="La fase es el color: 0°, 90°, 180°, 270°"><i></i><span>fase</span></div>';
    $('lab-ket').innerHTML = '|ψ⟩ = ' + amps.map((a, i) => ({ a, k: keys[i] })).filter(t => Math.hypot(...t.a) > 5e-3)
      .map((t, j) => { let s = fmtAmp(t.a, true); const neg = s.startsWith('−'); if (neg) s = s.slice(1); return `${j ? (neg ? ' − ' : ' + ') : (neg ? '−' : '')}${s}|${t.k}⟩`; }).join('');
    // discos de fase
    $('lab-discs').innerHTML = Array.from({ length: n }, (_, k) => {
      const { p1, purity } = qubitInfo(sv, k);
      const ent = purity < 0.99;
      return `<div class="disc ${ent ? 'ent' : ''}" title="Pureza ${purity.toFixed(2)}: 1 = independiente, 0.5 = totalmente entrelazado">
        <div class="disc-c"><i style="height:${p1 * 100}%"></i><span>${purity.toFixed(2)}</span></div>
        <b>q[${k}]</b><small>${Math.round(p1 * 100)}% |1⟩${ent ? ' · 🔗' : ''}</small></div>`;
    }).join('');
  }

  exportCode() {
    const n = this.save.lab.n, tree = this.editor.tree();
    this.showCode({ qiskit: toQiskit(tree, { n, title: 'Laboratorio' }), qasm: toQasm(tree, { n }) }, renderCircuit(circuitItems(tree), n));
  }
}
