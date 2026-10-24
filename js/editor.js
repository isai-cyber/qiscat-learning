// Editor de código estilo Swift Playgrounds: se escribe tocando comandos.
// El programa es una lista de líneas:
//   {t:'cmd', name}                       comandos del gato (avanzar, recogerPez, medir…)
//   {t:'gate', g, q, q2, q3, a}           compuertas de la paleta Operations
//   {t:'for', n} | {t:'if'} | {t:'while'} | {t:'box'}  … {t:'end'}   bloques
import { getLang, cmd, QUANTUM } from './lang.js';
import { OP, BLOCK_TYPES, ANGLES, newGate, gatePy, gateEs, blockHead } from './ops.js';

const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const isHead = ln => BLOCK_TYPES.has(ln.t);

export class CodeEditor {
  constructor(el, onChange) {
    this.el = el;
    this.onChange = onChange;
    this.lines = [];
    this.cursor = 0;
    this.undoStack = [];
    this.redoStack = [];
    this.running = -1;
    this.locked = false;
    this.ctx = { quantum: false, twin: false };
    el.addEventListener('click', e => this.onClick(e));
    el.tabIndex = 0;
    el.addEventListener('keydown', e => this.onKey(e));
  }

  get qubits() { return this.ctx.n ?? (this.ctx.twin ? 2 : 1); }

  load(lines) {
    this.lines = lines ? JSON.parse(JSON.stringify(lines)) : [];
    this.cursor = this.lines.length;
    this.undoStack = []; this.redoStack = [];
    this.render();
  }

  snapshot() {
    this.undoStack.push(JSON.stringify({ l: this.lines, c: this.cursor }));
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
  }
  restore(json) { const s = JSON.parse(json); this.lines = s.l; this.cursor = s.c; this.changed(); }
  undo() { if (this.locked || !this.undoStack.length) return; this.redoStack.push(JSON.stringify({ l: this.lines, c: this.cursor })); this.restore(this.undoStack.pop()); }
  redo() { if (this.locked || !this.redoStack.length) return; this.undoStack.push(JSON.stringify({ l: this.lines, c: this.cursor })); this.restore(this.redoStack.pop()); }

  changed() { this.render(); this.onChange?.(this.lines); }

  // name: comando del gato ('avanzar', 'for', …) o id de la paleta Operations ('h', 'rx', 'if', …)
  // q: qubit donde se coloca la compuerta (en el laboratorio se elige)
  insert(name, q = 0) {
    if (this.locked) return;
    this.snapshot();
    let add;
    if (name === 'for') add = [{ t: 'for', n: 2 }, { t: 'end' }];
    else if (BLOCK_TYPES.has(name)) add = [{ t: name }, { t: 'end' }];
    else if (name === 'measure') add = [{ t: 'cmd', name: 'medir' }];
    else if (OP[name]) {
      const g = newGate(name);
      if (OP[name].kind === 'g2') { g.q = q; g.q2 = (q + 1) % this.qubits; }
      else if (OP[name].kind !== 'g3') g.q = q;
      add = [g];
    }
    else add = [{ t: 'cmd', name }];
    this.lines.splice(this.cursor, 0, ...add);
    this.cursor += 1;
    this.changed();
  }

  // índice de la línea que cierra/abre el bloque de la línea i
  matchOf(i) {
    const L = this.lines;
    if (isHead(L[i])) {
      let d = 0;
      for (let j = i; j < L.length; j++) { if (isHead(L[j])) d++; if (L[j].t === 'end' && --d === 0) return j; }
    } else if (L[i].t === 'end') {
      let d = 0;
      for (let j = i; j >= 0; j--) { if (L[j].t === 'end') d++; if (isHead(L[j]) && --d === 0) return j; }
    }
    return -1;
  }

  backspace() {
    if (this.locked || this.cursor === 0) return;
    this.snapshot();
    const i = this.cursor - 1;
    const line = this.lines[i];
    if (line.t === 'cmd' || line.t === 'gate') {
      this.lines.splice(i, 1);
      this.cursor = i;
    } else {
      const j = this.matchOf(i);
      const [a, b] = [Math.min(i, j), Math.max(i, j)];
      this.lines.splice(b, 1);
      this.lines.splice(a, 1);
      this.cursor = Math.max(0, Math.min(a, this.lines.length));
    }
    this.changed();
  }

  // ↵ : salir del bloque actual
  exitBlock() {
    if (this.locked) return;
    let d = 0;
    for (let j = this.cursor; j < this.lines.length; j++) {
      if (isHead(this.lines[j])) d++;
      if (this.lines[j].t === 'end') { if (d === 0) { this.cursor = j + 1; this.render(); return; } d--; }
    }
  }

  clear() { if (this.locked || !this.lines.length) return; this.snapshot(); this.lines = []; this.cursor = 0; this.changed(); }

  onClick(e) {
    if (this.locked) return;
    const num = e.target.closest('[data-num]');
    if (num) { // veces del for
      const i = +num.dataset.num;
      this.snapshot();
      this.lines[i].n = this.lines[i].n % 9 + 1;
      this.changed();
      return;
    }
    const qb = e.target.closest('[data-q]');
    if (qb) { // cambiar de qubit
      const ln = this.lines[+qb.dataset.q];
      this.snapshot();
      if (OP[ln.g].kind === 'g2') [ln.q, ln.q2] = [ln.q2, ln.q];
      else if (OP[ln.g].kind !== 'g3') ln.q = (ln.q + 1) % this.qubits;
      this.changed();
      return;
    }
    const ang = e.target.closest('[data-ang]');
    if (ang) { // cambiar el ángulo
      const ln = this.lines[+ang.dataset.ang];
      this.snapshot();
      ln.a = ((ln.a ?? 1) + 1) % ANGLES.length;
      this.changed();
      return;
    }
    const row = e.target.closest('[data-i]');
    this.cursor = row ? +row.dataset.i + 1 : this.lines.length;
    this.render();
    this.el.focus();
  }

  onKey(e) {
    if (this.locked) return;
    const k = e.key;
    if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); this.backspace(); }
    else if (k === 'ArrowUp') { e.preventDefault(); this.cursor = Math.max(0, this.cursor - 1); this.render(); }
    else if (k === 'ArrowDown') { e.preventDefault(); this.cursor = Math.min(this.lines.length, this.cursor + 1); this.render(); }
    else if (k === 'Enter') { e.preventDefault(); this.exitBlock(); }
    else if ((e.metaKey || e.ctrlKey) && k.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); }
  }

  // quantum: el nivel usa compuertas · twin: hay gato gemelo (2 qubits)
  setContext(ctx) { this.ctx = ctx; this.render(); }

  // En Python, el encabezado de Qiskit (no se puede editar)
  preamble() {
    if (getLang() !== 'py' || !this.ctx.quantum) return '';
    const n = this.qubits;
    const usesPi = this.lines.some(l => l.t === 'gate' && OP[l.g].kind === 'g1p');
    return `<div class="pre"><span class="kw">from</span> qiskit <span class="kw">import</span> QuantumCircuit</div>
      ${usesPi ? '<div class="pre"><span class="kw">from</span> numpy <span class="kw">import</span> pi</div>' : ''}
      <div class="pre">qc = QuantumCircuit(<span class="num">${n}</span>)  <span class="cm"># qubit 0 = Schrödi${n > 1 ? ', qubit 1 = Qubita' : ''}${n > 2 ? ', qubit 2' : ''}</span></div>
      <div class="pre gap"></div>`;
  }

  // Colorea un comando del gato según el lenguaje
  paint(name) {
    const code = esc(cmd(name));
    if (getLang() !== 'py') return `<span class="${QUANTUM.has(name) ? 'qfn' : 'fn'}">${code}</span>`;
    const [obj, rest] = code.split(/\.(.*)/s);
    const args = rest.replace(/(\d+)/g, '<span class="num">$1</span>');
    return `<span class="${QUANTUM.has(name) ? 'qobj' : 'obj'}">${obj}</span>.<span class="${QUANTUM.has(name) ? 'qfn' : 'fn'}">${args}</span>`;
  }

  // Colorea una compuerta; los qubits y ángulos se pueden tocar para cambiarlos
  paintGate(ln, i) {
    const o = OP[ln.g];
    const multi = this.qubits > 1;
    const q = (v, k) => multi
      ? `<span class="num tap" data-q="${i}" title="Toca para cambiar de qubit">${v}</span>`
      : `<span class="num">${v}</span>`;
    const ang = () => `<span class="num tap ang" data-ang="${i}" title="Toca para cambiar el ángulo">${getLang() === 'py' ? ANGLES[ln.a ?? 1].py : ANGLES[ln.a ?? 1].es}</span>`;
    if (getLang() !== 'py') {
      const txt = esc(gateEs(ln));
      return `<span class="qfn op-${o.color}">${o.kind === 'g1p' ? txt.replace(esc(ANGLES[ln.a ?? 1].es), ang()) : txt}</span>`;
    }
    let args;
    if (o.kind === 'g1p') args = `${ang()}, ${q(ln.q)}`;
    else if (o.kind === 'g2') args = `${q(ln.q)}, ${q(ln.q2)}`;
    else if (o.kind === 'g3') args = `${ln.q}, ${ln.q2}, ${ln.q3}`;
    else if (o.kind === 'barrier') args = '';
    else args = q(ln.q);
    const name = ln.g === 'i' ? 'id' : ln.g;
    return `<span class="qobj">qc</span>.<span class="qfn op-${o.color}">${name}</span>(${args})`;
  }

  render() {
    const caret = '<div class="caret"></div>';
    const pre = this.preamble();
    if (!this.lines.length) {
      this.el.innerHTML = pre + caret + '<div class="placeholder">Toca un comando de abajo para escribir tu código ⬇️</div>';
      return;
    }
    const py = getLang() === 'py';
    let depth = 0, html = pre;
    const stack = [];
    this.lines.forEach((ln, i) => {
      if (this.cursor === i) html += caret.replace('caret', `caret" style="margin-left:${depth * 22}px`);
      if (ln.t === 'end') depth--;
      const pad = `style="padding-left:${depth * 22 + 4}px"`;
      const run = this.running === i ? ' running' : '';
      let code;
      if (ln.t === 'for') {
        const tap = `<span class="num tap" data-num="${i}" title="Toca para cambiar cuántas veces">${ln.n}</span>`;
        code = py
          ? `<span class="kw">for</span> i <span class="kw">in</span> <span class="bi">range</span>(${tap}):`
          : `<span class="kw">for</span> i <span class="kw">in</span> <span class="num">1</span> ... ${tap} {`;
      } else if (isHead(ln)) {
        code = `<span class="kw">${esc(blockHead(ln, getLang()))}</span>`;
      } else if (ln.t === 'end') {
        const head = stack.pop();
        code = py ? `<span class="cm"># fin del ${head || 'bloque'}</span>` : '}';
      } else if (ln.t === 'gate') code = this.paintGate(ln, i);
      else code = this.paint(ln.name);
      if (isHead(ln)) stack.push(ln.t);
      html += `<div class="line${run}" data-i="${i}" ${pad}>${code}</div>`;
      if (isHead(ln)) depth++;
    });
    if (this.cursor === this.lines.length) html += caret;
    this.el.innerHTML = html;
  }

  setRunning(i) {
    this.running = i;
    this.el.querySelectorAll('.line.running').forEach(n => n.classList.remove('running'));
    if (i >= 0) this.el.querySelector(`[data-i="${i}"]`)?.classList.add('running');
  }

  // Árbol del programa: [{ i, ln, body? }] — se ejecuta paso a paso (if/while dependen de mediciones)
  tree() {
    const L = this.lines;
    const build = (from, to) => {
      const out = [];
      for (let i = from; i < to; i++) {
        const ln = L[i];
        if (isHead(ln)) {
          const j = this.matchOf(i);
          out.push({ i, ln, body: build(i + 1, j < 0 ? to : j) });
          i = j < 0 ? to : j;
        } else if (ln.t !== 'end') out.push({ i, ln });
      }
      return out;
    };
    return build(0, L.length);
  }

  toText() {
    let d = 0;
    const py = getLang() === 'py';
    return this.lines.map(ln => {
      if (ln.t === 'end') d--;
      let s;
      if (isHead(ln)) s = blockHead(ln, getLang());
      else if (ln.t === 'end') s = py ? '# fin' : '}';
      else if (ln.t === 'gate') s = py ? gatePy(ln) : gateEs(ln);
      else s = cmd(ln.name);
      if (isHead(ln)) d++;
      return '    '.repeat(Math.max(d - (isHead(ln) ? 1 : 0), 0)) + s;
    }).join('\n');
  }
}
