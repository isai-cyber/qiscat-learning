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

// ---------- Guía "Conoce tus botones" ----------
// cat: grupo de colores · kid: explicación para niñas y niños · demo: estado inicial del ejemplo
// unlock: nivel donde se puede usar (lab = solo en el Laboratorio)
export const OP_CATS = [
  { id: 'sup', name: 'Superposición', color: 'red', desc: 'Convierte al gato en fantasma: dormido y despierto a la vez.' },
  { id: 'flip', name: 'Voltear y conectar', color: 'blue', desc: 'Cambian 😴 por 😺 o conectan a dos gatos.' },
  { id: 'phase', name: 'Fase', color: 'light', desc: 'Giran la “fase” (el color invisible) del gato. Solo se nota si después usas H.' },
  { id: 'rot', name: 'Rotaciones', color: 'pink', desc: 'Giran al gato poco a poco: puede quedar 85% 😴 y 15% 😺.' },
  { id: 'ctrl', name: 'Medir y control', color: 'gray', desc: 'Abren la caja, reinician al gato o controlan el orden del programa.' },
];
export const OP_GUIDE = {
  h: { cat: 'sup', kid: 'Pone al gato en superposición: 50% 😴 y 50% 😺. Si la usas dos veces, ¡el gato regresa!', demo: '0', unlock: 'x' },
  x: { cat: 'flip', kid: 'Voltea al gato como una moneda: si duerme lo despierta, si está despierto lo duerme.', demo: '0', unlock: 'x' },
  cx: { cat: 'flip', kid: 'CNOT: el punto ● es el control y el ⊕ el objetivo. Si Schrödi está 😺, voltea a Qubita. Con H antes, ¡los entrelaza!', demo: '10', unlock: 'entrelazados' },
  ccx: { cat: 'flip', kid: 'Toffoli: dos controles ●●. Solo si los dos gatos están 😺, voltea al tercero. Necesita 3 qubits.', demo: '110', unlock: 'lab' },
  swap: { cat: 'flip', kid: 'Intercambia a los dos gatos: lo que tenía Schrödi lo tiene Qubita y al revés.', demo: '10', unlock: 'entrelazados' },
  i: { cat: 'flip', kid: 'Identidad: no hace nada. Es como decir “espera un turno”.', demo: '0', unlock: 'x' },
  t: { cat: 'phase', kid: 'Gira la fase de 😺 un poquito (45°). Dos T = una S.', demo: '+', unlock: 'x' },
  s: { cat: 'phase', kid: 'Gira la fase de 😺 90°. Dos S = una Z.', demo: '+', unlock: 'x' },
  z: { cat: 'phase', kid: 'Le pone un signo menos a 😺. Parece que no hace nada… ¡pero H Z H es igual a X!', demo: '+', unlock: 'x' },
  tdg: { cat: 'phase', kid: 'T al revés: gira la fase −45°. T y T† juntas se cancelan.', demo: '+', unlock: 'x' },
  sdg: { cat: 'phase', kid: 'S al revés: gira la fase −90°. S y S† juntas se cancelan.', demo: '+', unlock: 'x' },
  p: { cat: 'phase', kid: 'Fase con el ángulo que tú elijas (toca el ángulo en el código para cambiarlo).', demo: '+', unlock: 'x' },
  rz: { cat: 'phase', kid: 'Gira al gato alrededor del eje Z de la esfera de Bloch, el ángulo que tú elijas.', demo: '+', unlock: 'x' },
  measure: { cat: 'ctrl', kid: 'Abre la caja y mira al gato: deja de ser fantasma y elige 😴 o 😺 al azar.', demo: '+', unlock: 'x' },
  reset: { cat: 'ctrl', kid: 'Reinicia al gato: pase lo que pase, vuelve a 😴 (|0⟩).', demo: '1', unlock: 'x' },
  barrier: { cat: 'ctrl', kid: 'Barrera: una línea para separar partes del circuito. No cambia al gato.', demo: '0', unlock: 'x' },
  cz: { cat: 'ctrl', kid: 'Control-Z: si los dos gatos están 😺, cambia el signo. Es una conexión “invisible”.', demo: '++', unlock: 'entrelazados' },
  if: { cat: 'ctrl', kid: 'Si la última medición dio 😺, hace lo que está adentro. Si dio 😴, se lo salta.', unlock: 'x' },
  for: { cat: 'ctrl', kid: 'Repite los comandos de adentro las veces que elijas.', unlock: 'bucle' },
  while: { cat: 'ctrl', kid: 'Repite lo de adentro mientras la última medición dé 😺. ¡Mide adentro para que termine!', unlock: 'x' },
  box: { cat: 'ctrl', kid: 'Una caja para agrupar compuertas y ordenar tu circuito.', unlock: 'x' },
  sx: { cat: 'rot', kid: 'Media X: dos √X seguidas son una X completa.', demo: '0', unlock: 'x' },
  y: { cat: 'rot', kid: 'Voltea al gato como X, pero además le cambia la fase.', demo: '0', unlock: 'x' },
  rx: { cat: 'rot', kid: 'Gira al gato alrededor del eje X. Con π/2 queda mitad y mitad; con π, se voltea.', demo: '0', unlock: 'x' },
  ry: { cat: 'rot', kid: 'Gira al gato alrededor del eje Y. ¡Con ella fabricas monedas trucadas!', demo: '0', unlock: 'x' },
};
// Preguntas del quiz "¿Cuál es cuál?"
export const OP_QUIZ = [
  { q: '¿Qué botón pone al gato en superposición?', a: 'h' },
  { q: '¿Qué botón voltea al gato de 😴 a 😺?', a: 'x' },
  { q: '¿Qué botón abre la caja para medir al gato?', a: 'measure' },
  { q: '¿Qué botón entrelaza a dos gatos (si antes usas H)?', a: 'cx' },
  { q: '¿Qué botón intercambia a los dos gatos?', a: 'swap' },
  { q: '¿Qué botón repite comandos varias veces?', a: 'for' },
  { q: '¿Qué botón le pone un signo menos a 😺?', a: 'z' },
  { q: '¿Qué botón regresa al gato a 😴 pase lo que pase?', a: 'reset' },
  { q: '¿Qué botón no hace nada (espera un turno)?', a: 'i' },
  { q: '¿Qué botón hace algo solo si la medición dio 😺?', a: 'if' },
  { q: '¿Qué botón necesita 3 gatos?', a: 'ccx' },
  { q: '¿Con qué botón fabricas una moneda trucada?', a: 'ry' },
];
