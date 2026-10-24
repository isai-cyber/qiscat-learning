// Simulador cuántico de 2 qubits (amplitudes reales).
// Qubit A = el gato principal, qubit B = el gato gemelo.
// Índice del estado = a*2 + b  →  |00⟩, |01⟩, |10⟩, |11⟩
// 0 = 😴 dormido, 1 = 😺 despierto

const S = Math.SQRT1_2;

export class QState {
  constructor() { this.reset(); }

  reset() { this.amp = [1, 0, 0, 0]; }

  // Compuerta X sobre el gato: dormido ⇄ despierto
  x() {
    const a = this.amp;
    this.amp = [a[2], a[3], a[0], a[1]];
  }

  // Compuerta H (Hadamard) sobre el gato: crea / deshace superposición
  h() {
    const a = this.amp;
    this.amp = [
      S * (a[0] + a[2]), S * (a[1] + a[3]),
      S * (a[0] - a[2]), S * (a[1] - a[3]),
    ];
  }

  // CNOT: si el gato está despierto, voltea al gemelo
  cnot() {
    const a = this.amp;
    this.amp = [a[0], a[1], a[3], a[2]];
  }

  probs() { return this.amp.map(v => v * v); }

  // Probabilidad de que el gato principal esté despierto
  pA1() { const p = this.probs(); return p[2] + p[3]; }
  pB1() { const p = this.probs(); return p[1] + p[3]; }

  isSuperposedA() { const p = this.pA1(); return p > 0.01 && p < 0.99; }
  isCertainA(bit) { return bit ? this.pA1() > 0.99 : this.pA1() < 0.01; }

  // Entrelazado = el estado no se puede separar (det ≠ 0)
  isEntangled() {
    const a = this.amp;
    return Math.abs(a[0] * a[3] - a[1] * a[2]) > 0.05;
  }

  // Medir ambos gatos: el estado colapsa
  measure() {
    const p = this.probs();
    let r = Math.random(), idx = 3;
    for (let i = 0; i < 4; i++) { if (r < p[i]) { idx = i; break; } r -= p[i]; }
    this.amp = [0, 0, 0, 0];
    this.amp[idx] = 1;
    return { a: idx >> 1, b: idx & 1 };
  }

  // Texto tipo "0.71|😴⟩ + 0.71|😺⟩"
  ket(withTwin) {
    const em = ['😴', '😺'];
    if (withTwin) {
      const terms = [];
      this.amp.forEach((v, i) => {
        if (Math.abs(v) > 0.005) terms.push({ v, label: em[i >> 1] + em[i & 1] });
      });
      return fmt(terms);
    }
    // Sin gemelo, B siempre vale 0: basta con amp[0] y amp[2]
    const out = [];
    if (Math.abs(this.amp[0]) > 0.005) out.push({ v: this.amp[0], label: '😴' });
    if (Math.abs(this.amp[2]) > 0.005) out.push({ v: this.amp[2], label: '😺' });
    return fmt(out);
  }
}

function fmt(terms) {
  return terms.map((t, i) => {
    const mag = Math.abs(t.v);
    const num = mag > 0.995 ? '' : mag.toFixed(2);
    const sign = t.v < 0 ? (i === 0 ? '−' : ' − ') : (i === 0 ? '' : ' + ');
    return `${sign}${num}|${t.label}⟩`;
  }).join('');
}
