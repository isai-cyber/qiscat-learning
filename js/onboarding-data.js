// Introducción de cada nivel (estilo Duolingo): el Profe Qubit explica,
// presenta los comandos nuevos y hace una mini pregunta.
// Slides:  {talk, art}  ·  {cmds:[...], text}  ·  quiz {q, options, answer, explain}
// En los quiz, la respuesta correcta es `answer` (índice); las opciones se barajan al mostrarse.

export const UNITS = {
  'Primeros pasos': { n: 1, color: '#58cc02', dark: '#46a302', desc: 'Comandos, giros y bucles' },
  'El gato qubit': { n: 2, color: '#a560e8', dark: '#8549ba', desc: 'Qubits, compuerta X, superposición' },
  'Magia cuántica': { n: 3, color: '#1cb0f6', dark: '#1899d6', desc: 'Interferencia y entrelazamiento' },
};

export const ONBOARDING = {
  hola: {
    icon: '🐟',
    slides: [
      { talk: '¡Hola! Soy el <b>Profe Qubit</b> 🦉. Él es <b>Schrödi</b>, el gato de Schrödinger. ¡Le encantan los peces!', art: '🐱 💭 🐟' },
      { talk: 'Las computadoras siguen <b>comandos</b>: órdenes que se hacen una por una, de arriba hacia abajo.', art: '1️⃣ ➜ 2️⃣ ➜ 3️⃣' },
      { cmds: ['avanzar()', 'recogerPez()'], text: '<code>avanzar()</code> mueve al gato una casilla. <code>recogerPez()</code> toma el pez donde está parado.' },
    ],
    quiz: { q: 'El pez está 2 casillas adelante. ¿Qué código escribes?', options: ['avanzar()\navanzar()\nrecogerPez()', 'recogerPez()\navanzar()', 'avanzar()\nrecogerPez()'], answer: 0, explain: 'Primero caminas las 2 casillas y luego recoges.' },
  },
  girar: {
    icon: '↪️',
    slides: [
      { talk: 'El camino ahora tiene una esquina. ¡Hay que girar!', art: '🐱 ➡️ ↩️' },
      { talk: 'El gato gira desde <b>su</b> punto de vista: imagina que tú eres Schrödi.', art: '⬅️ 🐱 ➡️' },
      { cmds: ['girarIzquierda()', 'girarDerecha()'], text: 'Girar no mueve al gato de casilla: solo cambia hacia dónde mira.' },
    ],
    quiz: { q: 'Schrödi mira hacia el este ➡️ y usa girarDerecha(). ¿Hacia dónde mira ahora?', options: ['⬇️ Hacia el sur', '⬆️ Hacia el norte', '⬅️ Hacia el oeste'], answer: 0, explain: 'Si miras a la derecha del mapa y giras a tu derecha, quedas mirando hacia abajo.' },
  },
  bucle: {
    icon: '🔁',
    slides: [
      { talk: '¿Escribir lo mismo muchas veces? ¡Qué aburrido! 😴 Los programadores usan un truco…', art: '📝📝📝📝📝' },
      { talk: 'Un <b>bucle</b> repite los comandos que están entre las llaves <code>{ }</code>.', art: '🔁 × 3' },
      { cmds: ['for i in 1 ... 3 { }'], text: 'Toca el número del bucle para cambiar cuántas veces se repite.' },
    ],
    quiz: { q: 'for i in 1 ... 3 { recogerPez() }\n¿Cuántas veces se recoge un pez?', options: ['3 veces', '1 vez', '4 veces'], answer: 0, explain: 'El número final del bucle dice cuántas vueltas da.' },
  },
  x: {
    icon: '🔄',
    slides: [
      { talk: '¡Sorpresa! Schrödi es un <b>qubit</b>, la pieza de las computadoras cuánticas. 🪙', art: '😴 = 0 · 😺 = 1' },
      { talk: 'La <b>compuerta X</b> lo voltea, como darle la vuelta a una moneda.', art: '😴 ➜ X ➜ 😺' },
      { cmds: ['aplicarX()'], text: 'La puerta del sol ☀️ solo se abre para gatos 😺 despiertos.' },
      { lang: 'py', talk: 'Aquí escribes como los científicos de verdad: con <b>Qiskit</b>, la herramienta de IBM para programar computadoras cuánticas. <code>qc</code> es tu circuito cuántico y el qubit <b>0</b> es Schrödi.', art: '🐍 + ⚛️ = qc.x(0)' },
    ],
    quiz: { q: 'El gato está 😺 despierto y usas aplicarX(). ¿Cómo queda?', options: ['😴 Dormido', '😺 Despierto', '👻 Fantasma'], answer: 0, explain: 'X siempre cambia 0 ⇄ 1: si estaba despierto, se duerme.' },
  },
  caja: {
    icon: '📦',
    slides: [
      { talk: 'Erwin Schrödinger imaginó un gato en una caja que estaba en dos estados <b>al mismo tiempo</b>.', art: '📦 ❓' },
      { talk: 'Eso se llama <b>superposición</b>. ¡La compuerta H convierte a Schrödi en dos gatos fantasma!', art: '😴 ➜ H ➜ 😴 + 😺' },
      { cmds: ['aplicarH()', 'medir()'], text: '<code>medir()</code> abre la caja: el gato deja de ser fantasma y elige uno, al azar.' },
    ],
    quiz: { q: 'Mides a un gato en superposición. ¿Qué sale?', options: ['😴 o 😺, al azar', 'Siempre 😺', 'Los dos a la vez'], answer: 0, explain: 'Al medir, la superposición desaparece: es como lanzar una moneda.' },
  },
  muro: {
    icon: '🟣',
    slides: [
      { talk: 'Un <b>muro cuántico</b> morado bloquea el camino. Un gato normal choca contra él…', art: '🐱 💥 🟣' },
      { talk: '…pero un gato en superposición es como un fantasma y ¡lo atraviesa! En la vida real se llama <b>efecto túnel</b>.', art: '👻 ➜ 🟣 ➜ 🐟' },
    ],
    quiz: { q: '¿Qué necesitas antes de cruzar el muro cuántico?', options: ['aplicarH()', 'aplicarX()', 'medir()'], answer: 0, explain: 'H pone al gato en superposición, y solo así cruza.' },
  },
  interferencia: {
    icon: '🌊',
    slides: [
      { talk: 'La puerta de la luna 🌙 solo deja pasar gatos 😴 dormidos <b>al 100%</b>.', art: '🌙 😴 ✅' },
      { talk: 'Truco secreto: si usas H <b>dos veces</b>, las partes 😺 se cancelan como olas 🌊 y queda 😴 seguro. ¡Se llama <b>interferencia</b>!', art: '😴 ➜ H ➜ H ➜ 😴' },
    ],
    quiz: { q: '😴 ➜ aplicarH() ➜ aplicarH() ➜ ¿?', options: ['😴 al 100%', '😺 al 100%', '50% y 50%'], answer: 0, explain: 'Dos H se cancelan y el gato vuelve a como estaba.' },
  },
  entrelazados: {
    icon: '🔗',
    slides: [
      { talk: 'Te presento a <b>Qubita</b>, la hermana gemela de Schrödi. Vive en otra isla.', art: '🐱 🏝️ 🐱' },
      { talk: '<code>entrelazar()</code> los une con un hilo mágico 🔗: al medirlos, ¡siempre salen iguales!', art: '😺 🔗 😺' },
      { cmds: ['entrelazar()'], text: 'Primero pon a Schrödi en superposición con <code>aplicarH()</code>, después entrelázalo.' },
      { lang: 'py', talk: 'En Qiskit, <code>qc.cx(0, 1)</code> se llama <b>CNOT</b>: si el qubit 0 (Schrödi) está 😺, voltea al qubit 1 (Qubita). Así nace el entrelazamiento.', art: '0 ● ─ ⊕ 1' },
    ],
    quiz: { q: 'Están entrelazados. Mides a Schrödi y sale 😺. ¿Y Qubita?', options: ['😺 también', '😴 dormida', 'No se puede saber'], answer: 0, explain: '¡Eso es el entrelazamiento! Einstein lo llamaba “acción fantasmal a distancia”.' },
  },
  reto: {
    icon: '🏆',
    slides: [
      { talk: '¡Llegaste al <b>gran desafío</b>! Aquí necesitas todo lo que aprendiste.', art: '🔁 + X + H + 📦' },
      { talk: 'Recoge los peces con un bucle, abre la puerta del sol ☀️, cruza el muro 🟣 y mide en la caja 📦.', art: '🐟🐟 ☀️ 🟣 📦' },
    ],
    quiz: { q: 'El gato duerme 😴. ¿Qué compuerta abre la puerta del sol ☀️?', options: ['aplicarX()', 'aplicarH()', 'entrelazar()'], answer: 0, explain: 'X lo despierta al 100%. H lo dejaría en superposición.' },
  },
};
