// Paleta "Operations" (como IBM Quantum Composer), en el mismo orden 5×5.
// kind: g1 (1 qubit) · g1p (1 qubit con ángulo) · g2 (2 qubits) · g3 (3 qubits)
//       meas · reset · barrier · block (if / for / while / box)
// color: clase de color del Composer: red · blue · light · gray · pink

export const OPS = [
  { id: 'h', label: 'H', kind: 'g1', color: 'red', name: 'Hadamard', tip: 'Superposición: 😴 → 😴 + 😺' },
  { id: 'x', label: '⊕', kind: 'g1', color: 'blue', name: 'NOT (X)', tip: 'Voltea el qubit: 😴 ⇄ 😺' },
  { id: 'cx', label: 'cx', icon: 'cnot', kind: 'g2', color: 'blue', name: 'CNOT', tip: 'Si el control está 😺, voltea al objetivo (entrelaza)' },
  { id: 'ccx', label: 'ccx', icon: 'toffoli', kind: 'g3', color: 'blue', name: 'Toffoli', tip: 'Si los dos controles están 😺, voltea al tercero' },
  { id: 'swap', label: 'swap', icon: 'swap', kind: 'g2', color: 'blue', name: 'SWAP', tip: 'Intercambia los dos qubits' },

  { id: 'i', label: 'I', kind: 'g1', color: 'blue', name: 'Identidad', tip: 'No hace nada (espera un paso)' },
  { id: 't', label: 'T', kind: 'g1', color: 'light', name: 'T', tip: 'Gira la fase de 😺 45° (π/4)' },
  { id: 's', label: 'S', kind: 'g1', color: 'light', name: 'S', tip: 'Gira la fase de 😺 90° (π/2)' },
  { id: 'z', label: 'Z', kind: 'g1', color: 'light', name: 'Pauli Z', tip: 'Cambia el signo de 😺' },
  { id: 'tdg', label: 'T†', kind: 'g1', color: 'light', name: 'T†', tip: 'Gira la fase de 😺 −45°' },

  { id: 'sdg', label: 'S†', kind: 'g1', color: 'light', name: 'S†', tip: 'Gira la fase de 😺 −90°' },
  { id: 'p', label: 'P', kind: 'g1p', color: 'light', name: 'Fase P(λ)', tip: 'Gira la fase de 😺 un ángulo λ' },
  { id: 'rz', label: 'RZ', kind: 'g1p', color: 'light', name: 'RZ(θ)', tip: 'Rota alrededor del eje Z de la esfera de Bloch' },
  { id: 'measure', label: 'meas', icon: 'measure', kind: 'meas', color: 'gray', name: 'Medir', tip: 'Abre la caja: el gato elige 😴 o 😺' },
  { id: 'reset', label: '|0⟩', kind: 'reset', color: 'gray', name: 'Reset', tip: 'Vuelve el qubit a 😴 |0⟩' },

  { id: 'barrier', label: '┆', kind: 'barrier', color: 'gray', name: 'Barrera', tip: 'Separa partes del circuito (no cambia nada)' },
  { id: 'cz', label: '●', icon: 'control', kind: 'g2', color: 'gray', name: 'Control (CZ)', tip: 'Z controlada: si los dos están 😺, cambia el signo' },
  { id: 'if', label: 'if', kind: 'block', color: 'gray', name: 'if', tip: 'Haz esto solo si la última medición dio 😺 (1)' },
  { id: 'for', label: 'for', kind: 'block', color: 'gray', name: 'for', tip: 'Repite los comandos varias veces' },
  { id: 'while', label: 'while', kind: 'block', color: 'gray', name: 'while', tip: 'Repite mientras la última medición dé 😺 (1)' },

  { id: 'box', label: 'box', kind: 'block', color: 'gray', name: 'box', tip: 'Agrupa compuertas en una caja' },
  { id: 'sx', label: '√X', kind: 'g1', color: 'pink', name: '√X', tip: 'Media compuerta X: dos seguidas = X' },
  { id: 'y', label: 'Y', kind: 'g1', color: 'pink', name: 'Pauli Y', tip: 'Voltea el qubit y cambia su fase' },
  { id: 'rx', label: 'RX', kind: 'g1p', color: 'pink', name: 'RX(θ)', tip: 'Rota alrededor del eje X' },
  { id: 'ry', label: 'RY', kind: 'g1p', color: 'pink', name: 'RY(θ)', tip: 'Rota alrededor del eje Y' },
];
export const OP = Object.fromEntries(OPS.map(o => [o.id, o]));
export const BLOCK_TYPES = new Set(['for', 'if', 'while', 'box']);

// Ángulos que se pueden elegir tocando el número (en código y para mostrar)
export const ANGLES = [
  { py: 'pi/4', qasm: 'pi/4', es: 'π/4', v: Math.PI / 4 },
  { py: 'pi/2', qasm: 'pi/2', es: 'π/2', v: Math.PI / 2 },
  { py: 'pi', qasm: 'pi', es: 'π', v: Math.PI },
  { py: '3*pi/2', qasm: '3*pi/2', es: '3π/2', v: 3 * Math.PI / 2 },
];

// qubits que usa una línea de compuerta { g, q, q2, q3 }
export function qubitsOf(ln) {
  const o = OP[ln.g];
  if (o.kind === 'g2') return [ln.q, ln.q2];
  if (o.kind === 'g3') return [ln.q, ln.q2, ln.q3];
  return [ln.q];
}

// Nueva línea de compuerta con valores por defecto
export function newGate(g) {
  const o = OP[g];
  const ln = { t: 'gate', g, q: 0 };
  if (o.kind === 'g1p') ln.a = 1;           // π/2
  if (o.kind === 'g2') ln.q2 = 1;
  if (o.kind === 'g3') { ln.q2 = 1; ln.q3 = 2; }
  return ln;
}

// ---------- cómo se escribe cada compuerta ----------
const ES_NAME = { h: 'H', x: 'X', y: 'Y', z: 'Z', i: 'I', s: 'S', sdg: 'S†', t: 'T', tdg: 'T†', sx: '√X', p: 'Fase', rz: 'RZ', rx: 'RX', ry: 'RY' };
const who = q => ['Schrödi', 'Qubita', 'qubit 2'][q];

export function gatePy(ln) {
  const o = OP[ln.g], a = ANGLES[ln.a ?? 1];
  switch (o.kind) {
    case 'g1p': return `qc.${ln.g}(${a.py}, ${ln.q})`;
    case 'g2': return `qc.${ln.g}(${ln.q}, ${ln.q2})`;
    case 'g3': return `qc.ccx(${ln.q}, ${ln.q2}, ${ln.q3})`;
    case 'reset': return `qc.reset(${ln.q})`;
    case 'barrier': return 'qc.barrier()';
    default: return `qc.${ln.g}(${ln.q})`;
  }
}
export function gateEs(ln) {
  const o = OP[ln.g], a = ANGLES[ln.a ?? 1];
  const tgt = ln.q ? `(${who(ln.q)})` : '()';
  switch (ln.g) {
    case 'cx': return `entrelazar(${who(ln.q)} → ${who(ln.q2)})`;
    case 'cz': return `controlZ(${who(ln.q)}, ${who(ln.q2)})`;
    case 'swap': return `intercambiar(${who(ln.q)}, ${who(ln.q2)})`;
    case 'ccx': return `toffoli(${ln.q}, ${ln.q2} → ${ln.q3})`;
    case 'reset': return `reiniciar${tgt}`;
    case 'barrier': return 'barrera()';
  }
  if (o.kind === 'g1p') return `aplicar${ES_NAME[ln.g]}(${a.es}${ln.q ? ', ' + who(ln.q) : ''})`;
  return `aplicar${ES_NAME[ln.g]}${tgt}`;
}
export function gateQasm(ln) {
  const o = OP[ln.g], a = ANGLES[ln.a ?? 1];
  switch (o.kind) {
    case 'g1p': return `${ln.g}(${a.qasm}) q[${ln.q}];`;
    case 'g2': return `${ln.g} q[${ln.q}], q[${ln.q2}];`;
    case 'g3': return `ccx q[${ln.q}], q[${ln.q2}], q[${ln.q3}];`;
    case 'reset': return `reset q[${ln.q}];`;
    case 'barrier': return 'barrier q;';
    default: return `${ln.g === 'i' ? 'id' : ln.g} q[${ln.q}];`;
  }
}
// para el simulador
export const toOp = ln => ({ g: ln.g, q: ln.q, q2: ln.q2, q3: ln.q3, theta: ANGLES[ln.a ?? 1].v });

// Encabezados de bloque
export function blockHead(ln, lang) {
  if (ln.t === 'for') return lang === 'py' ? `for i in range(${ln.n}):` : `for i in 1 ... ${ln.n} {`;
  if (lang === 'py') return {
    if: 'with qc.if_test((qc.clbits[0], 1)):',
    while: 'with qc.while_loop((qc.clbits[0], 1)):',
    box: 'with qc.box():',
  }[ln.t];
  return { if: 'si gatoDespierto() {', while: 'mientras gatoDespierto() {', box: 'caja {' }[ln.t];
}
