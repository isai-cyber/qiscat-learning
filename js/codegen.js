// Genera código Qiskit (Python) y OpenQASM 3 a partir del árbol del programa (editor.tree()).
// Los movimientos del gato no son cuánticos: quedan como comentarios.
import { cmd } from './lang.js';
import { OP, gatePy, gateQasm } from './ops.js';

const QUANTUM_CMD = { aplicarX: { g: 'x', q: 0 }, aplicarH: { g: 'h', q: 0 }, entrelazar: { g: 'cx', q: 0, q2: 1 } };
const asGate = ln => ln.t === 'gate' ? ln : ln.t === 'cmd' && QUANTUM_CMD[ln.name] ? { t: 'gate', ...QUANTUM_CMD[ln.name] } : null;
const usesAngles = tree => JSON.stringify(tree).match(/"g":"(p|rz|rx|ry)"/);

export function toQiskit(tree, { n, title }) {
  const out = [
    `# QisCat Learning · «${title}»`,
    '# Tu circuito listo para Qiskit.  Instálalo con:  pip install qiskit',
    'from qiskit import QuantumCircuit',
    'from qiskit.quantum_info import Statevector',
  ];
  if (usesAngles(tree)) out.push('from numpy import pi');
  out.push('', `qc = QuantumCircuit(${n}, ${n})  # qubit 0 = Schrödi${n > 1 ? ', qubit 1 = Qubita' : ''}`);
  let measured = false, firstMeasure = true;
  const walk = (nodes, ind) => {
    const pad = '    '.repeat(ind);
    let wrote = false;
    for (const { ln, body } of nodes) {
      if (body) {
        if (ln.t === 'for') out.push(`${pad}for i in range(${ln.n}):`);
        else if (ln.t === 'if') out.push(`${pad}with qc.if_test((qc.clbits[0], 1)):  # si salió 😺`);
        else if (ln.t === 'while') out.push(`${pad}with qc.while_loop((qc.clbits[0], 1)):  # mientras salga 😺`);
        else out.push(`${pad}with qc.box():`);
        if (!walk(body, ind + 1)) out.push(`${pad}    pass`);
        wrote = true;
        continue;
      }
      const g = asGate(ln);
      if (g) { out.push(pad + gatePy(g)); wrote = true; continue; }
      if (ln.name === 'medir') {
        if (firstMeasure && ind === 0) out.push('', 'print(Statevector(qc))  # el estado antes de medir', '');
        firstMeasure = false;
        out.push(`${pad}qc.measure(range(${n}), range(${n}))  # abrir la caja`);
        measured = true; wrote = true;
        continue;
      }
      out.push(`${pad}# ${cmd(ln.name, 'py')}  (movimiento del gato)`);
    }
    return wrote;
  };
  walk(tree, 0);
  if (!measured) out.push('', 'print(Statevector(qc))  # el estado del gato');
  out.push('', 'print(qc.draw())  # dibujo del circuito');
  return out.join('\n');
}

export function toQasm(tree, { n }) {
  const out = ['OPENQASM 3.0;', 'include "stdgates.inc";', `qubit[${n}] q;`, `bit[${n}] c;`, ''];
  const walk = (nodes, ind) => {
    const pad = '  '.repeat(ind);
    for (const { ln, body } of nodes) {
      if (body) {
        out.push(pad + ({ for: `for int i in [0:${ln.n - 1}] {`, if: 'if (c[0] == 1) {', while: 'while (c[0] == 1) {', box: 'box {' }[ln.t]));
        walk(body, ind + 1);
        out.push(pad + '}');
        continue;
      }
      const g = asGate(ln);
      if (g) out.push(pad + gateQasm(g));
      else if (ln.name === 'medir') out.push(pad + 'c = measure q;');
      else out.push(`${pad}// ${cmd(ln.name, 'py')}`);
    }
  };
  walk(tree, 0);
  return out.join('\n');
}

// Lista plana para dibujar el circuito: compuertas, mediciones y bloques (abrir/cerrar)
export function circuitItems(tree) {
  const items = [];
  const walk = nodes => {
    for (const { ln, body } of nodes) {
      if (body) {
        items.push({ open: ln.t === 'for' ? `for ×${ln.n}` : ln.t === 'if' ? 'if c[0]=1' : ln.t === 'while' ? 'while c[0]=1' : 'box' });
        walk(body);
        items.push({ close: true });
        continue;
      }
      const g = asGate(ln);
      if (g) items.push({ gate: g });
      else if (ln.name === 'medir') items.push({ measure: true });
    }
  };
  walk(tree);
  return items;
}
export { OP };
