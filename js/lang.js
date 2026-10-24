// Lenguaje del editor: "py" = Python con Qiskit (como Swift en Swift Playgrounds),
// "es" = comandos en español. El programa guardado es el mismo; solo cambia cómo se escribe.
import { COMMANDS } from './levels.js';

export const LANGS = { py: 'Python · Qiskit', es: 'Español' };
let lang = 'py';
export const getLang = () => lang;
export const setLang = l => { if (LANGS[l]) lang = l; };

// Equivalencias con Qiskit: el qubit 0 es Schrödi y el 1 es su gemela Qubita
const PY = {
  avanzar: 'gato.avanzar()',
  girarIzquierda: 'gato.girar_izquierda()',
  girarDerecha: 'gato.girar_derecha()',
  recogerPez: 'gato.recoger_pez()',
  aplicarX: 'qc.x(0)',
  aplicarH: 'qc.h(0)',
  medir: 'qc.measure_all()',
  entrelazar: 'qc.cx(0, 1)',
};
export const QUANTUM = new Set(['aplicarX', 'aplicarH', 'medir', 'entrelazar']);

export function cmd(name, l = lang) {
  if (name === 'for') return l === 'py' ? 'for … in range()' : 'for';
  return l === 'py' ? PY[name] : COMMANDS[name].code;
}
export function loopHead(n, l = lang) {
  return l === 'py' ? `for i in range(${n}):` : `for i in 1 ... ${n} {`;
}

// Traduce los comandos que aparecen dentro de un texto (instrucciones, pistas, mensajes)
// (?<![.\w]) evita traducir dos veces: «gato.avanzar()» ya no vuelve a cambiar
const CMD_RE = /(?<![.\w])(avanzar|girarIzquierda|girarDerecha|recogerPez|aplicarX|aplicarH|medir|entrelazar)\(\)/g;
export function tr(text, l = lang) {
  if (l !== 'py' || !text) return text;
  return text
    .replace(/for i in 1 \.\.\. (\d+) \{ \}/g, 'for i in range($1):')
    .replace(/for i in 1 \.\.\. (\d+) \{([^}]*)\}/g, (_, n, body) => `for i in range(${n}): ${body.trim()}`)
    .replace(CMD_RE, (_, name) => PY[name]);
}
// Igual que tr, para un fragmento que se muestra como código
export function trCode(code, l = lang) {
  if (l === 'py' && code.trim() === '{ }') return 'sangría ⇥';
  return tr(code, l);
}

// Script de Qiskit ejecutable con las compuertas del programa (sin los movimientos del gato)
export function qiskitScript(steps, { twin, title }) {
  const ops = steps.filter(s => QUANTUM.has(s.name)).map(s => s.name);
  const n = twin ? 2 : 1;
  const out = [
    `# QisCat Learning · nivel «${title}»`,
    '# Tu circuito cuántico listo para Qiskit.  Instálalo con:  pip install qiskit',
    'from qiskit import QuantumCircuit',
    'from qiskit.quantum_info import Statevector',
    '',
    `qc = QuantumCircuit(${n})  # qubit 0 = Schrödi${twin ? ', qubit 1 = Qubita' : ''}`,
  ];
  let measured = false;
  if (!ops.length) out.push('# (tu programa todavía no usa compuertas cuánticas)');
  for (const op of ops) {
    if (op === 'medir' && !measured) {
      out.push('', 'print(Statevector(qc))  # el estado antes de medir', '');
      measured = true;
    }
    out.push(PY[op] + (op === 'medir' ? '  # abrir la caja' : ''));
  }
  if (!measured) out.push('', 'print(Statevector(qc))  # el estado del gato');
  out.push('', 'print(qc.draw())  # dibujo del circuito');
  return out.join('\n');
}
