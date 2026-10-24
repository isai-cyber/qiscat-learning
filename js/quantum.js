// Estado cuántico del juego: 2 qubits con amplitudes complejas (usa qsim.js).
// Qubit 0 = el gato Schrödi, qubit 1 = la gemela Qubita.
// Índice del estado = a*2 + b  →  |00⟩, |01⟩, |10⟩, |11⟩ · 0 = 😴 dormido, 1 = 😺 despierto
import { QSim, normalizePhase, fmtAmp } from './qsim.js';

export class QState {
  constructor() { this.reset(); }
  reset() { this.sim = new QSim(2); }

  // Compuertas de los comandos clásicos del juego
  x() { this.sim.op({ g: 'x', q: 0 }); }
  h() { this.sim.op({ g: 'h', q: 0 }); }
  cnot() { this.sim.op({ g: 'cx', q: 0, q2: 1 }); }
  // Cualquier compuerta de la paleta Operations: { g, q, q2, theta }
  apply(o) { return this.sim.op(o); }
  get cl() { return this.sim.cl; } // bits clásicos de la última medición

  probs() { return this.sim.probs(); }
  pA1() { return this.sim.p1(0); }
  pB1() { return this.sim.p1(1); }

  isSuperposedA() { const p = this.pA1(); return p > 0.01 && p < 0.99; }
  isCertainA(bit) { return bit ? this.pA1() > 0.99 : this.pA1() < 0.01; }

  // Entrelazado = el estado no se puede separar: |a00·a11 − a01·a10| ≠ 0
  isEntangled() {
    const [a0, a1, a2, a3] = this.sim.amps();
    const re = (a0[0] * a3[0] - a0[1] * a3[1]) - (a1[0] * a2[0] - a1[1] * a2[1]);
    const im = (a0[0] * a3[1] + a0[1] * a3[0]) - (a1[0] * a2[1] + a1[1] * a2[0]);
    return Math.hypot(re, im) > 0.05;
  }

  // Medir ambos gatos: el estado colapsa
  measure() { const [a, b] = this.sim.measureAll(); return { a, b }; }

  // Texto tipo "0.71|😴⟩ + 0.71i|😺⟩" (sin la fase global, que no se puede medir)
  ket(withTwin) {
    const em = ['😴', '😺'];
    const amps = normalizePhase(this.sim.amps());
    const terms = [];
    if (withTwin) amps.forEach((v, i) => terms.push({ v, label: em[i >> 1] + em[i & 1] }));
    else {
      // Sin gemelo, el qubit 1 siempre vale 0: basta con |00⟩ y |10⟩
      terms.push({ v: amps[0], label: '😴' }, { v: amps[2], label: '😺' });
    }
    const shown = terms.filter(t => Math.hypot(...t.v) > 0.005);
    return shown.map((t, i) => {
      let s = fmtAmp(t.v, true);
      const neg = s.startsWith('−');
      if (neg) s = s.slice(1);
      const sign = i === 0 ? (neg ? '−' : '') : (neg ? ' − ' : ' + ');
      return `${sign}${s}|${t.label}⟩`;
    }).join('');
  }
}
