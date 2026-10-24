// 35 desafíos extra: 12 de Python con Qiskit, 12 quizzes y 11 de bloques.
// requires: id del nivel de la ruta que hay que terminar para desbloquearlo.
//
// Python  · gates: compuertas permitidas · target: amplitudes [|😴😴⟩,|😴😺⟩,|😺😴⟩,|😺😺⟩]
//           (1er emoji = qubit 0 = Schrödi, 2º = qubit 1 = Qubita) · best: mínimo de compuertas
//           mustUse / forbid: compuertas obligatorias o prohibidas
// Quiz    · q, options, answer (índice), explain
// Bloques · map + dir (mini mapa, hay que recoger todos los peces) o target (estado cuántico)
//           blocks: los bloques que se ofrecen (incluye algunos que sobran)

const S = Math.SQRT1_2;

export const CHALLENGE_TYPES = {
  python: { label: 'Python', icon: '🐍', color: '#3776ab', dark: '#285a85' },
  quiz: { label: 'Quiz', icon: '❓', color: '#ff9600', dark: '#d97f00' },
  blocks: { label: 'Bloques', icon: '🧩', color: '#ce82ff', dark: '#a568cc' },
};

export const CHALLENGES = [
  // ---------------- 🐍 Python con Qiskit ----------------
  { id: 'py1', type: 'python', requires: 'x', title: 'Despierta al gato', qubits: 1,
    goal: 'Escribe el código para que Schrödi quede 😺 despierto al 100%.', gates: ['x0', 'h0'], target: [0, 0, 1, 0], best: 1,
    hint: 'La compuerta X voltea el qubit: 0 → 1.' },
  { id: 'py2', type: 'python', requires: 'caja', title: 'Moneda cuántica', qubits: 1,
    goal: 'Pon a Schrödi en superposición: 50% 😴 y 50% 😺.', gates: ['x0', 'h0'], target: [S, 0, S, 0], best: 1,
    hint: 'La compuerta H crea la superposición.' },
  { id: 'py3', type: 'python', requires: 'interferencia', title: 'Ida y vuelta', qubits: 1,
    goal: 'Usa la compuerta H y logra que el gato termine 😴 al 100%.', gates: ['x0', 'h0'], target: [1, 0, 0, 0], best: 2, mustUse: ['h0'],
    hint: '¿Qué pasa si usas H dos veces?' },
  { id: 'py4', type: 'python', requires: 'caja', title: 'Superposición al revés', qubits: 1,
    goal: 'Prepara el estado 0.71|😴⟩ − 0.71|😺⟩ (¡con un signo menos!).', gates: ['x0', 'h0'], target: [S, 0, -S, 0], best: 2,
    hint: 'Si el gato empieza despierto, H le pone un signo menos a la parte 😺.' },
  { id: 'py5', type: 'python', requires: 'interferencia', title: 'El signo secreto', qubits: 1,
    goal: 'Prepara 0.71|😴⟩ − 0.71|😺⟩ sin usar qc.x(0).', gates: ['x0', 'h0', 'z0'], target: [S, 0, -S, 0], best: 2, forbid: ['x0'],
    hint: 'La compuerta Z cambia el signo de la parte 😺.' },
  { id: 'py6', type: 'python', requires: 'interferencia', title: 'X sin X', qubits: 1,
    goal: 'Despierta a Schrödi al 100% sin usar qc.x(0). ¡Usa interferencia!', gates: ['x0', 'h0', 'z0'], target: [0, 0, 1, 0], best: 3, forbid: ['x0'],
    hint: 'Prueba H, luego Z, luego H otra vez.' },
  { id: 'py7', type: 'python', requires: 'entrelazados', title: 'Dos gatos despiertos', qubits: 2,
    goal: 'Despierta a Schrödi y a Qubita: |😺😺⟩.', gates: ['x0', 'x1', 'h0', 'h1'], target: [0, 0, 0, 1], best: 2,
    hint: 'Una X para cada gato.' },
  { id: 'py8', type: 'python', requires: 'entrelazados', title: 'Gemelos de Bell', qubits: 2,
    goal: 'Entrelaza a los gatos: 0.71|😴😴⟩ + 0.71|😺😺⟩.', gates: ['x0', 'h0', 'cx', 'x1'], target: [S, 0, 0, S], best: 2,
    hint: 'Superposición en Schrödi y luego CNOT.' },
  { id: 'py9', type: 'python', requires: 'entrelazados', title: 'Gemelos opuestos', qubits: 2,
    goal: 'Entrelázalos para que siempre salgan distintos: 0.71|😴😺⟩ + 0.71|😺😴⟩.', gates: ['x0', 'x1', 'h0', 'cx'], target: [0, S, S, 0], best: 3,
    hint: 'Como los gemelos de Bell, pero voltea a Qubita con qc.x(1).' },
  { id: 'py10', type: 'python', requires: 'entrelazados', title: 'Copia con CNOT', qubits: 2,
    goal: 'Deja a los dos gatos 😺 sin usar qc.x(1). CNOT copia a Schrödi en Qubita.', gates: ['x0', 'x1', 'h0', 'cx'], target: [0, 0, 0, 1], best: 2, forbid: ['x1'], mustUse: ['cx'],
    hint: 'Despierta a Schrödi y luego usa qc.cx(0, 1).' },
  { id: 'py11', type: 'python', requires: 'reto', title: 'Todos los mundos', qubits: 2,
    goal: 'Haz que los 4 estados tengan la misma probabilidad (25% cada uno).', gates: ['h0', 'h1', 'x0', 'cx'], target: [0.5, 0.5, 0.5, 0.5], best: 2,
    hint: 'Una H para cada qubit.' },
  { id: 'py12', type: 'python', requires: 'reto', title: 'Bell con signo', qubits: 2,
    goal: 'Prepara 0.71|😴😴⟩ − 0.71|😺😺⟩.', gates: ['x0', 'h0', 'z0', 'cx'], target: [S, 0, 0, -S], best: 3,
    hint: 'Gemelos de Bell, pero con el signo menos que da Z (o empezando despierto).' },

  // ---------------- ❓ Quiz ----------------
  { id: 'q1', type: 'quiz', requires: 'hola', title: '¿Qué es un bit?', q: 'Un bit de una computadora normal puede valer…', options: ['0 o 1', 'Cualquier número', 'Solo 1'], answer: 0, explain: 'Un bit es como un foco: apagado (0) o encendido (1).' },
  { id: 'q2', type: 'quiz', requires: 'bucle', title: 'Python y range', q: '¿Cuántas veces se repite?\nfor i in range(4):\n    gato.avanzar()', options: ['4 veces', '3 veces', '5 veces'], answer: 0, explain: 'range(4) da 0, 1, 2 y 3: cuatro vueltas.' },
  { id: 'q3', type: 'quiz', requires: 'bucle', title: 'El primer número', q: 'En Python, ¿cuál es el primer valor de i en for i in range(3)?', options: ['0', '1', '3'], answer: 0, explain: 'Python empieza a contar desde 0.' },
  { id: 'q4', type: 'quiz', requires: 'x', title: '¿Qué es un qubit?', q: 'Un qubit es…', options: ['Un bit cuántico que puede estar en superposición', 'Un bit muy rápido', 'Un tipo de cable'], answer: 0, explain: 'Puede ser 0, 1 o una mezcla de los dos mientras nadie lo mide.' },
  { id: 'q5', type: 'quiz', requires: 'x', title: 'La compuerta X', q: '¿Qué hace qc.x(0)?', options: ['Voltea el qubit 0: 😴 ⇄ 😺', 'Mide el qubit 0', 'Borra el qubit 0'], answer: 0, explain: 'X es el “NO” cuántico.' },
  { id: 'q6', type: 'quiz', requires: 'caja', title: 'El científico del gato', q: '¿Quién imaginó al gato dormido y despierto a la vez en una caja?', options: ['Erwin Schrödinger', 'Albert Einstein', 'Isaac Newton'], answer: 0, explain: 'Erwin Schrödinger, en 1935, para explicar lo rara que es la física cuántica.' },
  { id: 'q7', type: 'quiz', requires: 'caja', title: 'Abrir la caja', q: '¿Qué pasa cuando mides un qubit en superposición?', options: ['Elige 0 o 1 al azar y deja de estar en superposición', 'Se queda en superposición', 'Siempre sale 1'], answer: 0, explain: 'Medir “colapsa” el estado.' },
  { id: 'q8', type: 'quiz', requires: 'caja', title: 'Probabilidades', q: 'Si un gato está 50% 😴 y 50% 😺 y lo mides 100 veces, ¿cuántas veces saldrá 😺 más o menos?', options: ['Unas 50', 'Unas 100', 'Ninguna'], answer: 0, explain: 'La mitad, aproximadamente. ¡Es como lanzar una moneda 100 veces!' },
  { id: 'q9', type: 'quiz', requires: 'interferencia', title: 'Olas cuánticas', q: '¿Qué pasa si aplicas qc.h(0) dos veces seguidas a un gato 😴?', options: ['Vuelve a 😴 al 100%', 'Queda 😺 al 100%', 'Queda 50% y 50%'], answer: 0, explain: 'Las partes 😺 se cancelan: eso es interferencia.' },
  { id: 'q10', type: 'quiz', requires: 'entrelazados', title: 'Acción fantasmal', q: '¿Quién llamó al entrelazamiento “acción fantasmal a distancia”?', options: ['Albert Einstein', 'Erwin Schrödinger', 'Marie Curie'], answer: 0, explain: 'A Einstein le parecía tan raro que dudaba que fuera real… ¡pero lo es!' },
  { id: 'q11', type: 'quiz', requires: 'entrelazados', title: 'QuantumCircuit', q: 'qc = QuantumCircuit(2)\n¿Cuántos qubits tiene este circuito?', options: ['2', '1', '4'], answer: 0, explain: 'El número dice cuántos qubits (gatos) tiene el circuito.' },
  { id: 'q12', type: 'quiz', requires: 'reto', title: '¿Qué es Qiskit?', q: 'Qiskit es…', options: ['Una herramienta de Python para programar computadoras cuánticas', 'Un videojuego', 'Un tipo de gato'], answer: 0, explain: 'La creó IBM y la usan científicos de todo el mundo. ¡Y tú ya la usaste!' },

  // ---------------- 🧩 Bloques ----------------
  { id: 'b1', type: 'blocks', requires: 'hola', title: 'Ruta recta', goal: 'Ordena los bloques para que Schrödi recoja el pez.',
    map: ['S..F'], dir: 0, blocks: ['avanzar', 'avanzar', 'avanzar', 'recogerPez', 'girarDerecha'] },
  { id: 'b2', type: 'blocks', requires: 'girar', title: 'Vuelta a la derecha', goal: 'Llega al pez doblando la esquina.',
    map: ['S.#', '#.#', '#F#'], dir: 0, blocks: ['avanzar', 'girarDerecha', 'avanzar', 'avanzar', 'recogerPez', 'girarIzquierda'] },
  { id: 'b3', type: 'blocks', requires: 'girar', title: 'Vuelta a la izquierda', goal: 'Ahora el pez está hacia arriba.',
    map: ['#F#', '#.#', 'S.#'], dir: 0, blocks: ['avanzar', 'girarIzquierda', 'avanzar', 'avanzar', 'recogerPez', 'girarDerecha'] },
  { id: 'b4', type: 'blocks', requires: 'girar', title: 'Zigzag', goal: 'Sigue el camino en zigzag hasta el pez.',
    map: ['S.##', '#..#', '##.F'], dir: 0,
    blocks: ['avanzar', 'girarDerecha', 'avanzar', 'girarIzquierda', 'avanzar', 'girarDerecha', 'avanzar', 'girarIzquierda', 'avanzar', 'recogerPez'] },
  { id: 'b5', type: 'blocks', requires: 'bucle', title: 'Dos peces', goal: 'Recoge los dos peces del camino.',
    map: ['S.F.F'], dir: 0, blocks: ['avanzar', 'avanzar', 'recogerPez', 'avanzar', 'avanzar', 'recogerPez', 'girarIzquierda'] },
  { id: 'b6', type: 'blocks', requires: 'x', title: 'La puerta del sol', goal: 'La puerta ☀️ solo deja pasar gatos 😺. ¡Despiértalo!',
    map: ['S.A.F'], dir: 0, blocks: ['aplicarX', 'avanzar', 'avanzar', 'avanzar', 'avanzar', 'recogerPez', 'aplicarH'] },
  { id: 'b7', type: 'blocks', requires: 'caja', title: 'Bloque fantasma', goal: 'Deja a Schrödi en superposición (50% y 50%).',
    target: [S, 0, S, 0], qubits: 1, blocks: ['aplicarH', 'aplicarX', 'medir'] },
  { id: 'b8', type: 'blocks', requires: 'muro', title: 'Cruza el muro', goal: 'El muro 🟣 solo deja pasar gatos en superposición.',
    map: ['S.Q.F'], dir: 0, blocks: ['aplicarH', 'avanzar', 'avanzar', 'avanzar', 'avanzar', 'recogerPez', 'aplicarX'] },
  { id: 'b9', type: 'blocks', requires: 'interferencia', title: 'Muro y luna', goal: 'Cruza el muro 🟣 y luego la puerta de la luna 🌙 (solo gatos 😴 al 100%).',
    map: ['S.Q.D.F'], dir: 0, blocks: ['aplicarH', 'avanzar', 'avanzar', 'avanzar', 'aplicarH', 'avanzar', 'avanzar', 'avanzar', 'recogerPez', 'medir'] },
  { id: 'b10', type: 'blocks', requires: 'entrelazados', title: 'Bloques gemelos', goal: 'Entrelaza a los dos gatos: 0.71|😴😴⟩ + 0.71|😺😺⟩.',
    target: [S, 0, 0, S], qubits: 2, blocks: ['entrelazar', 'aplicarH', 'aplicarX'] },
  { id: 'b11', type: 'blocks', requires: 'reto', title: 'Súper ruta', goal: 'Usa todo: despierta al gato, cruza el sol ☀️, ponlo en superposición y cruza el muro 🟣.',
    map: ['S.A.Q.F'], dir: 0, blocks: ['aplicarX', 'avanzar', 'avanzar', 'aplicarH', 'avanzar', 'avanzar', 'avanzar', 'avanzar', 'recogerPez', 'medir'] },
];
