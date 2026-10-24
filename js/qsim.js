// Simulador cuántico de n qubits (1 a 3) con amplitudes complejas.
// El qubit 0 es el bit más significativo del índice: |q0 q1 q2⟩ (igual que el resto del juego).
// Soporta las compuertas de la paleta de IBM Quantum Composer.

const S = Math.SQRT1_2;
// número complejo = [re, im]
const c = (re, im = 0) => [re, im];
const cis = t => [Math.cos(t), Math.sin(t)];
const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];

// Matriz 2x2 [[m00, m01], [m10, m11]] de cada compuerta de 1 qubit
export function matrix(g, theta = Math.PI / 2) {
  const ct = Math.cos(theta / 2), st = Math.sin(theta / 2);
  switch (g) {
    case 'i': return [[c(1), c(0)], [c(0), c(1)]];
    case 'x': return [[c(0), c(1)], [c(1), c(0)]];
    case 'y': return [[c(0), c(0, -1)], [c(0, 1), c(0)]];
    case 'z': return [[c(1), c(0)], [c(0), c(-1)]];
    case 'h': return [[c(S), c(S)], [c(S), c(-S)]];
    case 's': return [[c(1), c(0)], [c(0), c(0, 1)]];
    case 'sdg': return [[c(1), c(0)], [c(0), c(0, -1)]];
    case 't': return [[c(1), c(0)], [c(0), cis(Math.PI / 4)]];
    case 'tdg': return [[c(1), c(0)], [c(0), cis(-Math.PI / 4)]];
    case 'p': return [[c(1), c(0)], [c(0), cis(theta)]];
    case 'rz': return [[cis(-theta / 2), c(0)], [c(0), cis(theta / 2)]];
    case 'rx': return [[c(ct), c(0, -st)], [c(0, -st), c(ct)]];
    case 'ry': return [[c(ct), c(-st)], [c(st), c(ct)]];
    case 'sx': return [[c(0.5, 0.5), c(0.5, -0.5)], [c(0.5, -0.5), c(0.5, 0.5)]];
    case 'sxdg': return [[c(0.5, -0.5), c(0.5, 0.5)], [c(0.5, 0.5), c(0.5, -0.5)]];
  }
  throw new Error('compuerta desconocida: ' + g);
}

export class QSim {
  constructor(n = 1) {
    this.n = n;
    this.N = 1 << n;
    this.reset();
  }
  reset() {
    this.re = new Float64Array(this.N);
    this.im = new Float64Array(this.N);
    this.re[0] = 1;
    this.cl = new Array(this.n).fill(0); // bits clásicos (resultado de la última medición)
  }
  mask(q) { return 1 << (this.n - 1 - q); }

  // Aplica una matriz 2x2 al qubit q, solo donde todos los controles valen 1
  apply1(q, m, ctrls = []) {
    const b = this.mask(q);
    const cm = ctrls.reduce((s, k) => s | this.mask(k), 0);
    for (let i = 0; i < this.N; i++) {
      if (i & b || (i & cm) !== cm) continue;
      const j = i | b;
      const a0 = [this.re[i], this.im[i]], a1 = [this.re[j], this.im[j]];
      const n0 = add(mul(m[0][0], a0), mul(m[0][1], a1));
      const n1 = add(mul(m[1][0], a0), mul(m[1][1], a1));
      this.re[i] = n0[0]; this.im[i] = n0[1];
      this.re[j] = n1[0]; this.im[j] = n1[1];
    }
  }
  swap(a, b) {
    const ma = this.mask(a), mb = this.mask(b);
    for (let i = 0; i < this.N; i++) {
      if ((i & ma) && !(i & mb)) {
        const j = (i & ~ma) | mb;
        [this.re[i], this.re[j]] = [this.re[j], this.re[i]];
        [this.im[i], this.im[j]] = [this.im[j], this.im[i]];
      }
    }
  }
  p1(q) { // probabilidad de que el qubit q valga 1
    const b = this.mask(q);
    let p = 0;
    for (let i = 0; i < this.N; i++) if (i & b) p += this.re[i] ** 2 + this.im[i] ** 2;
    return p;
  }
  measure(q) {
    const b = this.mask(q);
    const out = Math.random() < this.p1(q) ? 1 : 0;
    let norm = 0;
    for (let i = 0; i < this.N; i++) {
      if (!!(i & b) !== !!out) { this.re[i] = 0; this.im[i] = 0; }
      else norm += this.re[i] ** 2 + this.im[i] ** 2;
    }
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < this.N; i++) { this.re[i] /= norm; this.im[i] /= norm; }
    this.cl[q] = out;
    return out;
  }
  measureAll() { return Array.from({ length: this.n }, (_, q) => this.measure(q)); }

  // op: { g, q, q2, q3, theta }
  op(o) {
    const { g, q = 0 } = o;
    switch (g) {
      case 'barrier': return;
      case 'measure': return this.measure(q);
      case 'reset': if (this.measure(q)) this.apply1(q, matrix('x')); return;
      case 'cx': return this.apply1(o.q2, matrix('x'), [q]);
      case 'cz': return this.apply1(o.q2, matrix('z'), [q]);
      case 'ccx': return this.apply1(o.q3, matrix('x'), [q, o.q2]);
      case 'swap': return this.swap(q, o.q2);
      default: return this.apply1(q, matrix(g, o.theta));
    }
  }

  probs() { return Array.from({ length: this.N }, (_, i) => this.re[i] ** 2 + this.im[i] ** 2); }
  amps() { return Array.from({ length: this.N }, (_, i) => [this.re[i], this.im[i]]); }
  // Fidelidad |⟨t|ψ⟩|² con un estado objetivo de amplitudes reales o complejas
  fidelity(t) {
    let re = 0, im = 0;
    t.forEach((v, i) => { const [tr, ti] = Array.isArray(v) ? v : [v, 0]; re += tr * this.re[i] + ti * this.im[i]; im += tr * this.im[i] - ti * this.re[i]; });
    return re * re + im * im;
  }
  // Muestreo: repetir el circuito "shots" veces (sin colapsar este estado)
  sample(shots = 1024) {
    const p = this.probs(), counts = {};
    for (let s = 0; s < shots; s++) {
      let r = Math.random(), k = this.N - 1;
      for (let i = 0; i < this.N; i++) { if (r < p[i]) { k = i; break; } r -= p[i]; }
      const key = k.toString(2).padStart(this.n, '0');
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }
}

// Amplitudes "bonitas": quita la fase global para que la primera amplitud sea real positiva
export function normalizePhase(amps) {
  const first = amps.find(([r, i]) => Math.hypot(r, i) > 1e-9);
  if (!first) return amps;
  const ph = Math.atan2(first[1], first[0]);
  const rot = cis(-ph);
  return amps.map(a => { const v = mul(a, rot); return [Math.abs(v[0]) < 1e-9 ? 0 : v[0], Math.abs(v[1]) < 1e-9 ? 0 : v[1]]; });
}

// "0.71", "−0.71", "0.71i", "(0.50+0.50i)"
export function fmtAmp([re, im], hideOne = false) {
  const r = Math.abs(re) < 5e-3 ? 0 : re, i = Math.abs(im) < 5e-3 ? 0 : im;
  const f = v => Math.abs(v).toFixed(2);
  if (!i) return (r < 0 ? '−' : '') + (hideOne && Math.abs(Math.abs(r) - 1) < 5e-3 ? '' : f(r));
  if (!r) return (i < 0 ? '−' : '') + (hideOne && Math.abs(Math.abs(i) - 1) < 5e-3 ? '' : f(i)) + 'i';
  return `(${r < 0 ? '−' : ''}${f(r)}${i < 0 ? '−' : '+'}${f(i)}i)`;
}
export const phaseOf = ([re, im]) => Math.atan2(im, re);
