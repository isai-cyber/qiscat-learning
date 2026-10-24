// Editor de código estilo Swift Playgrounds: se escribe tocando comandos.
// El programa es una lista de líneas: {t:'cmd', name} | {t:'for', n} | {t:'end'}
import { COMMANDS } from './levels.js';

const QUANTUM = new Set(['aplicarX', 'aplicarH', 'medir', 'entrelazar']);
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

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
    el.addEventListener('click', e => this.onClick(e));
    el.tabIndex = 0;
    el.addEventListener('keydown', e => this.onKey(e));
  }

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

  insert(name) {
    if (this.locked) return;
    this.snapshot();
    if (name === 'for') {
      this.lines.splice(this.cursor, 0, { t: 'for', n: 2 }, { t: 'end' });
      this.cursor += 1;
    } else {
      this.lines.splice(this.cursor, 0, { t: 'cmd', name });
      this.cursor += 1;
    }
    this.changed();
  }

  matchOf(i) {
    // índice de la llave que corresponde a la línea i (for ↔ end)
    const L = this.lines;
    if (L[i].t === 'for') {
      let d = 0;
      for (let j = i; j < L.length; j++) { if (L[j].t === 'for') d++; if (L[j].t === 'end' && --d === 0) return j; }
    } else if (L[i].t === 'end') {
      let d = 0;
      for (let j = i; j >= 0; j--) { if (L[j].t === 'end') d++; if (L[j].t === 'for' && --d === 0) return j; }
    }
    return -1;
  }

  backspace() {
    if (this.locked || this.cursor === 0) return;
    this.snapshot();
    const i = this.cursor - 1;
    const line = this.lines[i];
    if (line.t === 'cmd') {
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

  // ↵ : salir del bloque { } actual
  exitBlock() {
    if (this.locked) return;
    let d = 0;
    for (let j = this.cursor; j < this.lines.length; j++) {
      if (this.lines[j].t === 'for') d++;
      if (this.lines[j].t === 'end') { if (d === 0) { this.cursor = j + 1; this.render(); return; } d--; }
    }
  }

  clear() { if (this.locked || !this.lines.length) return; this.snapshot(); this.lines = []; this.cursor = 0; this.changed(); }

  onClick(e) {
    if (this.locked) return;
    const num = e.target.closest('[data-num]');
    if (num) {
      const i = +num.dataset.num;
      this.snapshot();
      this.lines[i].n = this.lines[i].n % 9 + 1;
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

  render() {
    const caret = '<div class="caret"></div>';
    if (!this.lines.length) {
      this.el.innerHTML = caret + '<div class="placeholder">Toca un comando de abajo para escribir tu código ⬇️</div>';
      return;
    }
    let depth = 0, html = '';
    this.lines.forEach((ln, i) => {
      if (this.cursor === i) html += caret.replace('caret', `caret" style="margin-left:${depth * 22}px`);
      if (ln.t === 'end') depth--;
      const pad = `style="padding-left:${depth * 22 + 4}px"`;
      const run = this.running === i ? ' running' : '';
      let code;
      if (ln.t === 'for') code = `<span class="kw">for</span> i <span class="kw">in</span> <span class="num">1</span> ... <span class="num tap" data-num="${i}" title="Toca para cambiar cuántas veces">${ln.n}</span> {`;
      else if (ln.t === 'end') code = '}';
      else code = `<span class="${QUANTUM.has(ln.name) ? 'qfn' : 'fn'}">${esc(COMMANDS[ln.name].code)}</span>`;
      html += `<div class="line${run}" data-i="${i}" ${pad}>${code}</div>`;
      if (ln.t === 'for') depth++;
    });
    if (this.cursor === this.lines.length) html += caret;
    this.el.innerHTML = html;
  }

  setRunning(i) {
    this.running = i;
    this.el.querySelectorAll('.line.running').forEach(n => n.classList.remove('running'));
    if (i >= 0) this.el.querySelector(`[data-i="${i}"]`)?.classList.add('running');
  }

  // Convierte el programa en una lista de pasos (los bucles se desenrollan)
  compile() {
    const steps = [];
    const L = this.lines;
    const walk = (from, to) => {
      for (let i = from; i < to; i++) {
        const ln = L[i];
        if (ln.t === 'cmd') steps.push({ name: ln.name, line: i });
        else if (ln.t === 'for') {
          const j = this.matchOf(i);
          for (let k = 0; k < ln.n; k++) {
            steps.push({ name: '__loop', line: i });
            walk(i + 1, j);
            if (steps.length > 500) return;
          }
          i = j;
        }
      }
    };
    walk(0, L.length);
    return steps;
  }

  toText() {
    let d = 0;
    return this.lines.map(ln => {
      if (ln.t === 'end') d--;
      const s = '    '.repeat(Math.max(d, 0)) + (ln.t === 'for' ? `for i in 1 ... ${ln.n} {` : ln.t === 'end' ? '}' : COMMANDS[ln.name].code);
      if (ln.t === 'for') d++;
      return s;
    }).join('\n');
  }
}
