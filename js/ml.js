// Ruta "Datos y Machine Learning cuántico": 6 lecciones que conectan un concepto
// de estadística / ML con su equivalente cuántico (reto EdTech, Qiskit Fall Fest 2026).
import { QSim } from './qsim.js';
import { sfx } from './audio.js';

const $ = id => document.getElementById(id);
const PI = Math.PI;
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
// P(😺) de RY(θ)|0⟩ calculada con el simulador
const pRY = t => { const s = new QSim(1); s.op({ g: 'ry', q: 0, theta: t }); return s.p1(0); };
const sampleRY = (t, shots) => { const s = new QSim(1); s.op({ g: 'ry', q: 0, theta: t }); const c = s.sample(shots); return c['1'] || 0; };
// Regla de parameter-shift: dP/dθ = [P(θ+π/2) − P(θ−π/2)] / 2  (así se calculan gradientes en hardware cuántico)
const shiftGrad = t => (pRY(t + PI / 2) - pRY(t - PI / 2)) / 2;
const deg = t => Math.round(t * 180 / PI);

const SAMPLER = (body, extra = '') => `from qiskit import QuantumCircuit
from qiskit.primitives import StatevectorSampler${extra}
${body}`;

export const ML_LESSONS = [
  {
    id: 'coins', icon: '🪙', title: 'Monedas y probabilidad', classic: 'Distribución de probabilidad', quantum: 'Regla de Born',
    steps: [
      { talk: 'En estadística, una <b>distribución de probabilidad</b> dice qué tan seguido sale cada resultado. Una moneda normal: 50% cara, 50% cruz.', art: '🪙 → 50% / 50%' },
      { talk: 'Un qubit en superposición (<code>qc.h(0)</code>) también es una moneda… pero cuántica. La <b>regla de Born</b> dice: probabilidad = amplitud². 0.71² ≈ 0.5.', art: '🐱 → |0.71|² = 50%' },
      { act: 'coins' },
      { qiskit: SAMPLER(`
qc = QuantumCircuit(1)
qc.h(0)              # moneda cuántica: 0.71|0⟩ + 0.71|1⟩
qc.measure_all()

resultado = StatevectorSampler().run([qc], shots=1000).result()
print(resultado[0].data.meas.get_counts())   # ≈ {'0': 500, '1': 500}`) },
    ],
    learned: 'Lanzar muchas veces una moneda (o medir muchas veces un qubit) se acerca a la probabilidad real: es la <b>ley de los grandes números</b>. En cuántica, la probabilidad sale de la amplitud al cuadrado (<b>regla de Born</b>).',
  },
  {
    id: 'biased', icon: '🎯', title: 'La moneda trucada', classic: 'Distribución de Bernoulli', quantum: 'Rotación RY(θ)',
    steps: [
      { talk: 'Una moneda <b>trucada</b> no sale 50/50: puede salir cara el 75% de las veces. En estadística se llama distribución de <b>Bernoulli</b> con probabilidad p.', art: '🪙 → 75% / 25%' },
      { talk: 'Con <code>qc.ry(θ, 0)</code> giras al gato poco a poco. La probabilidad de 😺 es <b>sin²(θ/2)</b>. ¡Puedes fabricar cualquier moneda trucada!', art: 'θ ↻ → P(😺) = sin²(θ/2)' },
      { act: 'biased' },
      { qiskit: SAMPLER(`
p = 0.75                                  # la moneda trucada que quieres
theta = 2 * arcsin(sqrt(p))               # θ = 2·arcsin(√p)

qc = QuantumCircuit(1)
qc.ry(theta, 0)
qc.measure_all()
cuentas = StatevectorSampler().run([qc], shots=1000).result()[0].data.meas.get_counts()
print(cuentas)                            # ≈ {'1': 750, '0': 250}`, '\nfrom numpy import arcsin, sqrt') },
    ],
    learned: 'Con un solo qubit y una rotación <b>RY(θ)</b> puedes crear cualquier distribución de dos resultados. Así se <b>cargan datos</b> en una computadora cuántica.',
  },
  {
    id: 'montecarlo', icon: '🎲', title: 'Monte Carlo cuántico', classic: 'Método de Monte Carlo', quantum: 'Muestreo con shots',
    steps: [
      { talk: 'El método de <b>Monte Carlo</b> usa el azar para calcular cosas. Si lanzas dardos a un cuadrado, la parte que cae dentro del círculo te ayuda a calcular <b>π</b>.', art: '🎯 · · · → π ≈ 3.14' },
      { act: 'darts' },
      { talk: 'Las computadoras cuánticas también se usan así: repites el circuito muchas veces (<b>shots</b>) y estimas la probabilidad. Más shots = menos error (el error baja como 1/√N).', art: '🐱 × 1000 shots' },
      { act: 'mystery' },
      { qiskit: SAMPLER(`
qc = QuantumCircuit(1)
qc.ry(1.2, 0)          # compuerta "misteriosa"
qc.measure_all()

for shots in [10, 100, 1000]:
    cuentas = StatevectorSampler().run([qc], shots=shots).result()[0].data.meas.get_counts()
    estimado = cuentas.get('1', 0) / shots
    print(shots, 'shots →', estimado, '± error ≈', round(1 / sqrt(shots), 3))`, '\nfrom numpy import sqrt') },
    ],
    learned: 'Monte Carlo estima con muestras al azar. En una computadora cuántica real <b>siempre</b> se trabaja así: se repite el circuito (shots) y con las cuentas se estima la respuesta.',
  },
  {
    id: 'gradient', icon: '📉', title: 'Descenso de gradiente', classic: 'Descenso de gradiente', quantum: 'Regla de parameter-shift',
    steps: [
      { talk: 'Las redes neuronales <b>aprenden</b> bajando una montaña: el <b>error</b>. En cada paso miran la pendiente (el <b>gradiente</b>) y dan un paso hacia abajo.', art: '⛰️ → 🎿 → 🏁' },
      { talk: 'Un circuito con <code>qc.ry(θ, 0)</code> también aprende. En cuántica la pendiente se mide con la <b>regla de parameter-shift</b>: correr el circuito con θ+π/2 y θ−π/2.', art: '∂P/∂θ = [P(θ+π/2) − P(θ−π/2)] / 2' },
      { act: 'gradient' },
      { qiskit: `from qiskit import QuantumCircuit
from qiskit.circuit import Parameter
from qiskit.quantum_info import Statevector
from numpy import pi

theta = Parameter('θ')
qc = QuantumCircuit(1)
qc.ry(theta, 0)

def P(t):  # probabilidad de medir 1 (😺)
    return Statevector(qc.assign_parameters({theta: t})).probabilities()[1]

t, lr, objetivo = 0.3, 4.0, 0.8
for paso in range(15):
    pendiente = (P(t + pi/2) - P(t - pi/2)) / 2          # parameter-shift
    gradiente = 2 * (P(t) - objetivo) * pendiente        # regla de la cadena
    t -= lr * gradiente
    print(paso, round(t, 3), round(P(t), 3))` },
    ],
    learned: 'Así se entrenan las <b>redes neuronales cuánticas (QNN)</b>: el circuito tiene parámetros, se mide el error y se ajustan con descenso de gradiente. ¡Si el paso es muy grande, rebotas!',
  },
  {
    id: 'classifier', icon: '🧠', title: 'Clasificador cuántico', classic: 'Perceptrón / regresión logística', quantum: 'Clasificador variacional (VQC)',
    steps: [
      { talk: 'Un <b>perceptrón</b> es la neurona artificial más simple: recibe un dato, lo multiplica por un <b>peso w</b>, suma un <b>sesgo b</b> y decide una clase.', art: 'x · w + b → 😴 / 😺' },
      { talk: 'En un <b>clasificador variacional (VQC)</b> el dato entra al circuito como un ángulo: <code>qc.ry(w·x + b, 0)</code>. Si al medir sale más 😺, la respuesta es “juguetón”.', art: 'x → RY(w·x+b) → 😺?' },
      { act: 'classifier' },
      { qiskit: null }, // el código está más abajo (ML.classifier)
    ],
    learned: 'Un <b>VQC</b> es la versión cuántica del perceptrón: los <b>pesos son ángulos</b> de compuertas y se entrenan con descenso de gradiente. Es una de las ideas centrales del <b>Quantum Machine Learning</b>.',
  },
  {
    id: 'kernel', icon: '🤝', title: 'Kernel cuántico', classic: 'SVM y kernels', quantum: 'Kernel cuántico',
    steps: [
      { talk: 'Una <b>SVM</b> (máquina de vectores de soporte) separa grupos usando un <b>kernel</b>: una fórmula que dice qué tan <b>parecidos</b> son dos datos.', art: '🐱 ↔ 🐱  ¿parecidos?' },
      { talk: 'Un <b>kernel cuántico</b> convierte cada dato en un estado cuántico y mide qué tanto se superponen: <b>K(x, y) = |⟨ψ(x)|ψ(y)⟩|²</b>. 1 = iguales, 0 = opuestos.', art: '|⟨ψ(x)|ψ(y)⟩|²' },
      { act: 'kernel' },
      { qiskit: `from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
from numpy import pi

def estado(x):                 # mapa de características: dato → estado cuántico
    qc = QuantumCircuit(1)
    qc.ry(pi * x, 0)
    return Statevector(qc)

gatos = {'A': 0.1, 'B': 0.2, 'C': 0.8, 'D': 0.9}
for a, xa in gatos.items():
    fila = [round(abs(estado(xa).inner(estado(xb))) ** 2, 2) for xb in gatos.values()]
    print(a, fila)             # matriz del kernel cuántico` },
    ],
    learned: 'Con un <b>kernel cuántico</b>, la computadora cuántica calcula las similitudes y una SVM normal hace el resto. IBM lo usa en su ruta de <b>Data science</b> (Quantum kernel training).',
  },
];
export const ML = Object.fromEntries(ML_LESSONS.map(l => [l.id, l]));

// Código Qiskit del clasificador variacional
ML.classifier.steps[3].qiskit = `from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
from numpy import pi

datos = [0.05, 0.15, 0.3, 0.4, 0.6, 0.7, 0.85, 0.95]   # energía de cada gato
clase = [0, 0, 0, 0, 1, 1, 1, 1]                      # 0 = dormilón, 1 = juguetón

def P(theta):                                          # P(😺) del circuito RY(θ)
    qc = QuantumCircuit(1)
    qc.ry(theta, 0)
    return Statevector(qc).probabilities()[1]

w, b, lr = 1.0, 0.0, 1.5
for paso in range(60):
    gw = gb = 0
    for x, y in zip(datos, clase):
        t = w * x + b                                  # codificar el dato como ángulo
        pendiente = (P(t + pi/2) - P(t - pi/2)) / 2    # parameter-shift
        e = 2 * (P(t) - y) * pendiente
        gw += e * x
        gb += e
    w -= lr * gw / len(datos)
    b -= lr * gb / len(datos)

aciertos = sum((P(w * x + b) > 0.5) == y for x, y in zip(datos, clase))
print('w =', round(w, 2), ' b =', round(b, 2), ' aciertos:', aciertos, '/ 8')`;

// ---------------- actividades ----------------
const bar = (p, color = '#7c4dff') => `<div class="mlb"><i style="width:${(p * 100).toFixed(1)}%;background:${color}"></i></div>`;

const ACTIVITIES = {
  coins(el, ok) {
    const st = { c: { n: 0, h: 0 }, q: { n: 0, h: 0 } };
    const render = () => {
      const card = (k, title, sub) => {
        const s = st[k], p = s.n ? s.h / s.n : 0;
        return `<div class="mlcard"><b>${title}</b><small>${sub}</small>
          <div class="ml2">${['😴 0 / cara', '😺 1 / cruz'].map((t, i) => { const v = i ? p : 1 - p; return `<div><span>${t}</span>${bar(s.n ? v : 0, i ? '#ffb347' : '#5b7cfa')}<em>${s.n ? (v * 100).toFixed(1) + '%' : '—'}</em></div>`; }).join('')}</div>
          <p class="mlsmall">Lanzamientos: <b>${s.n}</b></p>
          <div class="mlbtns">${[10, 100, 1000].map(k2 => `<button data-k="${k}" data-n="${k2}">× ${k2}</button>`).join('')}</div></div>`;
      };
      el.innerHTML = `<p class="mlgoal">Lanza las dos monedas al menos <b>1000</b> veces cada una y compara.</p>
        <div class="mlgrid">${card('c', '🪙 Moneda normal', 'Math.random() < 0.5')}${card('q', '🐱 Moneda cuántica', 'qc.h(0) + medir')}</div>`;
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
        const n = +b.dataset.n, s = st[b.dataset.k];
        sfx.tap();
        if (b.dataset.k === 'c') { for (let i = 0; i < n; i++) s.h += Math.random() < 0.5; }
        else { const sim = new QSim(1); sim.op({ g: 'h', q: 0 }); s.h += sim.sample(n)['1'] || 0; }
        s.n += n;
        render();
        if (st.c.n >= 1000 && st.q.n >= 1000) ok(3, '¡Las dos se acercan a 50%! Mientras más lanzas, más se parecen a la probabilidad real.');
      });
    };
    render();
  },

  biased(el, ok) {
    const targets = [0.75, 0.25, 0.9];
    let r = 0, t = PI / 2, fails = 0, sampled = null;
    const render = () => {
      const p = pRY(t), tgt = targets[r];
      el.innerHTML = `<p class="mlgoal">Moneda ${r + 1} de 3: fabrica un gato que salga <b>😺 el ${tgt * 100}%</b> de las veces.</p>
        <div class="mlcode">qc.ry(<b>${deg(t)}°</b>, 0)   <span># θ = ${t.toFixed(2)} rad</span></div>
        <label class="mlslider">θ = ${deg(t)}° <input type="range" min="0" max="180" step="5" value="${deg(t)}" id="ml-th"></label>
        <div class="ml2"><div><span>🎯 objetivo 😺</span>${bar(tgt, '#58cc02')}<em>${tgt * 100}%</em></div>
          <div><span>🐱 tu gato 😺</span>${bar(p, '#ffb347')}<em>${(p * 100).toFixed(1)}%</em></div>
          ${sampled != null ? `<div><span>📊 medido (200)</span>${bar(sampled, '#7c4dff')}<em>${(sampled * 100).toFixed(1)}%</em></div>` : ''}</div>
        <div class="mlbtns"><button id="ml-meas">📊 Medir 200 veces</button><button id="ml-check" class="go">Comprobar</button></div>`;
      $('ml-th').oninput = e => { t = +e.target.value * PI / 180; sampled = null; render(); };
      $('ml-meas').onclick = () => { sfx.measure(); sampled = sampleRY(t, 200) / 200; render(); };
      $('ml-check').onclick = () => {
        if (Math.abs(pRY(t) - tgt) <= 0.03) {
          sfx.fish(); r++; sampled = null;
          if (r === targets.length) return ok(fails === 0 ? 3 : fails <= 2 ? 2 : 1, '¡Fabricaste 3 monedas trucadas con una sola compuerta RY!');
          render();
        } else { fails++; sfx.fail(); el.querySelector('.mlgoal').innerHTML += ' <span class="mlbad">Todavía no: mueve θ.</span>'; }
      };
    };
    render();
  },

  darts(el, ok) {
    let n = 0, inside = 0;
    const pts = [];
    const render = () => {
      el.innerHTML = `<p class="mlgoal">Lanza al menos <b>1000</b> dardos. π ≈ 4 × (dentro ÷ total).</p>
        <div class="mlgrid"><canvas id="ml-cv" width="240" height="240" class="mlcanvas"></canvas>
        <div class="mlcard"><b>π estimado</b><div class="mlbig">${n ? (4 * inside / n).toFixed(3) : '—'}</div>
          <p class="mlsmall">Dardos: <b>${n}</b> · dentro: <b>${inside}</b><br>π real = 3.14159 · error: ${n ? Math.abs(4 * inside / n - PI).toFixed(3) : '—'}</p>
          <div class="mlbtns">${[100, 1000].map(k => `<button data-n="${k}">🎯 × ${k}</button>`).join('')}</div></div></div>`;
      const cv = $('ml-cv'), g = cv.getContext('2d');
      g.fillStyle = '#f7f7fa'; g.fillRect(0, 0, 240, 240);
      g.strokeStyle = '#7c4dff'; g.lineWidth = 2; g.beginPath(); g.arc(0, 240, 240, -PI / 2, 0); g.stroke();
      pts.slice(-3000).forEach(([x, y, i]) => { g.fillStyle = i ? '#58cc02' : '#ff4b4b'; g.fillRect(x * 240 - 1, 240 - y * 240 - 1, 2.5, 2.5); });
      el.querySelectorAll('[data-n]').forEach(b => b.onclick = () => {
        sfx.tap();
        for (let k = 0; k < +b.dataset.n; k++) { const x = Math.random(), y = Math.random(), i = x * x + y * y <= 1; inside += i; pts.push([x, y, i]); }
        n += +b.dataset.n;
        render();
        if (n >= 1000) ok(3, `¡Con ${n} dardos estimaste π ≈ ${(4 * inside / n).toFixed(3)}! Monte Carlo usa el azar para calcular.`);
      });
    };
    render();
  },

  mystery(el, ok) {
    const truth = 0.2 + Math.random() * 0.6, theta = 2 * Math.asin(Math.sqrt(truth));
    let shots = 0, ones = 0, guess = 0.5, tries = 0;
    const render = () => {
      const est = shots ? ones / shots : null;
      el.innerHTML = `<p class="mlgoal">Hay una compuerta <b>misteriosa</b> 🎁. Mide (shots) y adivina la probabilidad de 😺 con error menor a ±4%.</p>
        <div class="mlgrid"><div class="mlcard"><b>🎁 qc.ry(?, 0) + medir</b>
          <p class="mlsmall">Shots: <b>${shots}</b> · 😺: <b>${ones}</b><br>Frecuencia: <b>${est != null ? (est * 100).toFixed(1) + '%' : '—'}</b> · error típico ≈ ±${shots ? (100 / Math.sqrt(shots)).toFixed(1) : '—'}%</p>
          <div class="mlbtns">${[10, 100, 1000].map(k => `<button data-n="${k}">× ${k}</button>`).join('')}</div></div>
        <div class="mlcard"><b>Tu estimación</b><div class="mlbig">${Math.round(guess * 100)}%</div>
          <input type="range" min="0" max="100" value="${Math.round(guess * 100)}" id="ml-g" class="mlrange">
          <div class="mlbtns"><button id="ml-check" class="go">Comprobar</button></div></div></div>`;
      el.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { sfx.measure(); const k = +b.dataset.n; ones += sampleRY(theta, k); shots += k; render(); });
      $('ml-g').oninput = e => { guess = +e.target.value / 100; el.querySelector('.mlcard:last-child .mlbig').textContent = e.target.value + '%'; };
      $('ml-check').onclick = () => {
        tries++;
        if (Math.abs(guess - truth) <= 0.04) ok(tries === 1 ? 3 : 2, `¡Sí! El valor real era ${(truth * 100).toFixed(1)}%. Con ${shots} shots tu error típico era ±${(100 / Math.sqrt(Math.max(shots, 1))).toFixed(1)}%.`);
        else { sfx.fail(); el.querySelector('.mlgoal').innerHTML = 'Todavía no. 💡 Toma más shots: el error baja como 1/√N.'; }
      };
    };
    render();
  },

  gradient(el, ok) {
    const target = 0.8, LRS = [1, 4, 25]; // 25 = paso demasiado grande: rebota
    let t = 0.3, lr = 4, steps = 0, hist = [];
    const loss = th => (pRY(th) - target) ** 2;
    const render = () => {
      const L = loss(t);
      // curva del error en θ ∈ [0, π]
      const W = 300, H = 140, sx = th => 10 + th / PI * (W - 20), sy = l => H - 12 - l / 0.65 * (H - 24);
      let path = '';
      for (let k = 0; k <= 60; k++) { const th = k / 60 * PI; path += `${k ? 'L' : 'M'}${sx(th).toFixed(1)} ${sy(loss(th)).toFixed(1)}`; }
      const hpath = hist.map((l, k) => `${k ? 'L' : 'M'}${(10 + k * 12).toFixed(1)} ${(70 - Math.min(l, 0.65) / 0.65 * 60).toFixed(1)}`).join('');
      el.innerHTML = `<p class="mlgoal">Entrena el circuito para que P(😺) = <b>80%</b>. Baja el error hasta menos de 0.001.</p>
        <div class="mlgrid">
          <div class="mlcard"><b>⛰️ Montaña del error</b>
            <svg viewBox="0 0 ${W} ${H}" class="mlsvg"><path d="${path}" fill="none" stroke="#7c4dff" stroke-width="2.5"/>
              <line x1="${sx(2 * Math.asin(Math.sqrt(target)))}" y1="10" x2="${sx(2 * Math.asin(Math.sqrt(target)))}" y2="${H - 10}" stroke="#58cc02" stroke-dasharray="4 3"/>
              <circle cx="${sx(Math.min(Math.max(t, 0), PI))}" cy="${sy(L)}" r="8" fill="#ffb347" stroke="#fff" stroke-width="2"/>
              <text x="10" y="${H - 1}" font-size="10" fill="#777">θ = 0</text><text x="${W - 30}" y="${H - 1}" font-size="10" fill="#777">π</text></svg>
            <p class="mlsmall">θ = <b>${t.toFixed(3)}</b> · P(😺) = <b>${(pRY(t) * 100).toFixed(1)}%</b> · error = <b>${L.toFixed(4)}</b> · pasos: ${steps}</p></div>
          <div class="mlcard"><b>📉 Error en cada paso</b>
            <svg viewBox="0 0 ${Math.max(200, 20 + hist.length * 12)} 80" class="mlsvg small"><path d="${hpath}" fill="none" stroke="#ff4b6e" stroke-width="2"/></svg>
            <p class="mlsmall">Gradiente (parameter-shift): <code>${(2 * (pRY(t) - target) * shiftGrad(t)).toFixed(4)}</code></p>
            <div class="mlseg">Tamaño del paso: ${LRS.map(v => `<button data-lr="${v}" class="${v === lr ? 'on' : ''}">${v}</button>`).join('')}</div>
            <div class="mlbtns"><button id="ml-step" class="go">Un paso</button><button id="ml-10">10 pasos</button><button id="ml-reset">↺</button></div></div>
        </div>`;
      el.querySelectorAll('[data-lr]').forEach(b => b.onclick = () => { lr = +b.dataset.lr; render(); });
      const step = () => { const g = 2 * (pRY(t) - target) * shiftGrad(t); t -= lr * g; steps++; hist.push(loss(t)); };
      const check = () => { if (loss(t) < 1e-3) ok(steps <= 6 ? 3 : steps <= 15 ? 2 : 1, `¡Entrenado en ${steps} pasos! θ = ${t.toFixed(3)} da P(😺) = ${(pRY(t) * 100).toFixed(1)}%.`); };
      $('ml-step').onclick = () => { sfx.tap(); step(); render(); check(); };
      $('ml-10').onclick = () => { sfx.tap(); for (let k = 0; k < 10 && loss(t) >= 1e-3; k++) step(); render(); check(); };
      $('ml-reset').onclick = () => { t = 0.3; steps = 0; hist = []; render(); };
    };
    render();
  },

  classifier(el, ok) {
    const xs = [0.05, 0.15, 0.3, 0.4, 0.6, 0.7, 0.85, 0.95], ys = [0, 0, 0, 0, 1, 1, 1, 1];
    let w = 1, b = 0, steps = 0;
    const P = x => pRY(w * x + b);
    const acc = () => xs.filter((x, k) => (P(x) > 0.5) === !!ys[k]).length;
    const render = () => {
      const W = 320, H = 120, sx = x => 16 + x * (W - 32), sy = p => H - 26 - p * (H - 40);
      let curve = '';
      for (let k = 0; k <= 50; k++) { const x = k / 50; curve += `${k ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(P(x)).toFixed(1)}`; }
      el.innerHTML = `<p class="mlgoal">Clasifica a los 8 gatos: 😴 dormilones (poca energía) y 😺 juguetones (mucha). Mueve <b>w</b> y <b>b</b> o pulsa <b>Entrenar</b>.</p>
        <div class="mlcard"><b>🧠 qc.ry(w·x + b, 0)</b>
          <svg viewBox="0 0 ${W} ${H}" class="mlsvg"><line x1="16" y1="${sy(0.5)}" x2="${W - 16}" y2="${sy(0.5)}" stroke="#ccc" stroke-dasharray="4 3"/>
            <path d="${curve}" fill="none" stroke="#7c4dff" stroke-width="2.5"/>
            ${xs.map((x, k) => { const okk = (P(x) > 0.5) === !!ys[k]; return `<text x="${sx(x)}" y="${H - 6}" font-size="17" text-anchor="middle">${ys[k] ? '😺' : '😴'}</text><circle cx="${sx(x)}" cy="${sy(P(x))}" r="5" fill="${okk ? '#58cc02' : '#ff4b4b'}"/>`; }).join('')}
            <text x="${W - 16}" y="${sy(0.5) - 4}" font-size="9" fill="#999" text-anchor="end">P(😺) = 0.5</text></svg>
          <p class="mlsmall">energía → · aciertos: <b>${acc()}/8</b> · pasos de entrenamiento: ${steps}</p>
          <label class="mlslider">peso w = ${w.toFixed(1)} <input type="range" min="0" max="6" step="0.1" value="${w}" id="ml-w"></label>
          <label class="mlslider">sesgo b = ${b.toFixed(1)} <input type="range" min="-3.2" max="3.2" step="0.1" value="${b}" id="ml-b"></label>
          <div class="mlbtns"><button id="ml-train" class="go">🏋️ Entrenar 20 pasos</button><button id="ml-reset">↺</button></div></div>`;
      $('ml-w').oninput = e => { w = +e.target.value; render(); check(); };
      $('ml-b').oninput = e => { b = +e.target.value; render(); check(); };
      $('ml-train').onclick = () => {
        sfx.tap();
        for (let s = 0; s < 20; s++) {
          let gw = 0, gb = 0;
          xs.forEach((x, k) => { const th = w * x + b; const e = 2 * (pRY(th) - ys[k]) * shiftGrad(th); gw += e * x; gb += e; });
          w -= 1.5 * gw / xs.length; b -= 1.5 * gb / xs.length; steps++;
        }
        w = Math.max(0, Math.min(6, w)); b = Math.max(-3.2, Math.min(3.2, b));
        render(); check();
      };
      $('ml-reset').onclick = () => { w = 1; b = 0; steps = 0; render(); };
    };
    const check = () => { if (acc() === 8) ok(3, `¡8/8 aciertos! Tu clasificador cuántico aprendió w = ${w.toFixed(2)} y b = ${b.toFixed(2)}.`); };
    render();
  },

  kernel(el, ok) {
    const cats = { A: 0.1, B: 0.2, C: 0.8, D: 0.9 };
    const st = x => { const s = new QSim(1); s.op({ g: 'ry', q: 0, theta: PI * x }); return s; };
    const K = (a, b) => st(cats[a]).fidelity(st(cats[b]).amps());
    const names = Object.keys(cats);
    const rounds = [
      { q: '¿Qué gato se parece más a <b>A</b>?', opts: ['B', 'C', 'D'], ans: 'B' },
      { q: '¿Qué gato se parece más a <b>D</b>?', opts: ['A', 'B', 'C'], ans: 'C' },
      { q: '¿Qué pareja es la <b>MENOS</b> parecida?', opts: ['A y D', 'A y B', 'C y D'], ans: 'A y D' },
    ];
    let r = 0, fails = 0;
    const render = () => {
      const R = rounds[r];
      el.innerHTML = `<p class="mlgoal">Usa la <b>matriz del kernel cuántico</b> (1 = iguales, 0 = opuestos). Pregunta ${r + 1} de 3.</p>
        <div class="mlgrid"><div class="mlcard"><b>🔢 K(x, y) = |⟨ψ(x)|ψ(y)⟩|²</b>
          <table class="kmat"><tr><th></th>${names.map(n => `<th>${n}<small>${cats[n]}</small></th>`).join('')}</tr>
          ${names.map(a => `<tr><th>${a}</th>${names.map(b => { const k = K(a, b); return `<td style="background:rgba(124,77,255,${k.toFixed(2)});color:${k > 0.5 ? '#fff' : '#333'}">${k.toFixed(2)}</td>`; }).join('')}</tr>`).join('')}</table></div>
        <div class="mlcard"><b>${R.q}</b><div class="mlopts">${R.opts.map(o => `<button data-o="${o}">${o}</button>`).join('')}</div></div></div>`;
      el.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
        if (b.dataset.o === R.ans) {
          sfx.fish(); r++;
          if (r === rounds.length) return ok(fails === 0 ? 3 : fails <= 1 ? 2 : 1, 'Una SVM usaría esta matriz para separar 😴 de 😺. ¡La similitud la calculó el circuito cuántico!');
          render();
        } else { fails++; sfx.fail(); b.classList.add('bad'); }
      });
    };
    render();
  },
};

// ---------------- reproductor de lecciones ----------------
export class MlPlayer {
  constructor({ progress, rich, onClose }) {
    this.p = progress; this.rich = rich; this.onClose = onClose;
    this.root = $('ml');
  }
  open(id) {
    const L = ML[id];
    this.L = L; this.k = 0; this.stars = 3;
    const steps = [{ intro: true }, ...L.steps, { end: true }];
    this.steps = steps;
    this.root.innerHTML = `
      <div class="onb-top"><button class="onb-x" title="Salir">✕</button><div class="onb-bar"><i></i></div><span class="onb-lvl">${L.icon} ${L.title}</span></div>
      <div class="onb-body ml-body"></div>
      <div class="onb-foot"><div class="onb-fb"></div><button class="onb-btn">Continuar</button></div>`;
    this.root.style.setProperty('--unit', '#1cb0f6'); this.root.style.setProperty('--unit-dark', '#1899d6');
    this.root.classList.remove('hidden');
    this.body = this.root.querySelector('.ml-body');
    this.btn = this.root.querySelector('.onb-btn');
    this.fb = this.root.querySelector('.onb-fb');
    this.foot = this.root.querySelector('.onb-foot');
    this.root.querySelector('.onb-x').onclick = () => this.close();
    this.btn.onclick = () => this.next();
    this.render();
  }
  close() { this.root.classList.add('hidden'); this.onClose?.(); }
  next() {
    if (this.btn.disabled) return;
    sfx.tap();
    if (this.steps[this.k].end) return this.close();
    this.k++;
    this.render();
  }
  render() {
    const s = this.steps[this.k], L = this.L, rich = this.rich;
    this.root.querySelector('.onb-bar i').style.width = `${this.k / (this.steps.length - 1) * 100}%`;
    this.foot.className = 'onb-foot'; this.fb.innerHTML = ''; this.btn.disabled = false; this.btn.textContent = 'Continuar';
    if (s.intro) {
      this.body.innerHTML = `<div class="ml-vs"><div class="mlside"><small>Estadística / ML clásico</small><b>${L.classic}</b></div>
        <div class="mlarrow">⇄</div><div class="mlside q"><small>Equivalente cuántico</small><b>${L.quantum}</b></div></div>
        <div class="onb-final"><div class="onb-icon">${L.icon}</div><h2 class="onb-h">${L.title}</h2>
        <p class="onb-p">Vas a conectar una idea de <b>datos y Machine Learning</b> con su versión <b>cuántica</b>, y al final verás el código de <b>Qiskit</b>.</p></div>`;
    } else if (s.talk) {
      this.body.innerHTML = `<div class="onb-talk"><div class="onb-owl">🦉</div><div class="onb-bubble">${rich(s.talk)}</div></div><div class="onb-art">${s.art || ''}</div>`;
    } else if (s.act) {
      this.btn.disabled = true;
      this.body.innerHTML = '<div class="ml-act"></div>';
      ACTIVITIES[s.act](this.body.querySelector('.ml-act'), (stars, msg) => {
        if (!this.btn.disabled) return;
        this.stars = Math.min(this.stars, stars);
        sfx.win();
        this.foot.className = 'onb-foot good';
        this.fb.innerHTML = `<b>¡Lo lograste! ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</b><span>${msg}</span>`;
        this.btn.disabled = false;
      });
    } else if (s.qiskit) {
      this.body.innerHTML = `<h2 class="onb-h">🐍 Ahora en Qiskit</h2>
        <p class="onb-p">Este es el mismo experimento en código real de <b>Qiskit</b> (IBM). Puedes copiarlo y correrlo con <code>pip install qiskit</code>.</p>
        <pre class="qk-code">${esc(s.qiskit)}</pre><div class="mlbtns"><button id="ml-copy">📋 Copiar</button></div>`;
      $('ml-copy').onclick = async () => { try { await navigator.clipboard.writeText(s.qiskit); $('ml-copy').textContent = '✅ ¡Copiado!'; } catch { $('ml-copy').textContent = 'Selecciona y copia'; } };
    } else if (s.end) {
      const r = this.p.recordMl(L.id, this.stars);
      sfx.win();
      this.body.innerHTML = `<div class="win-stars">${[1, 2, 3].map(n => `<span class="${n <= this.stars ? 'on' : ''}" style="animation-delay:${n * 0.18}s">★</span>`).join('')}</div>
        <h2 class="onb-h" style="text-align:center">¡Lección completada! +${r.xp} XP</h2>
        <div class="learned"><b>🧠 Lo que aprendiste:</b><br>${rich(L.learned)}</div>`;
      this.btn.textContent = 'Terminar';
    }
  }
}
