<p align="center"><img src="assets/logo.webp" width="180" alt="QisCat Learning"></p>

# QisCat Learning

Juego web 3D para niñas y niños (8–12 años) donde aprenden **computación cuántica** programando a **Schrödi**, el gato de Schrödinger. Inspirado en *Swift Playgrounds* y derivado de [CatCode](https://github.com/CraigMLdsouza/CatCode) (MIT).

![Superposición en la caja de Schrödinger](docs/screenshots/04-superposicion.png)

Juega en línea: **https://qiscat.isaihub.pro** (landing) · **https://qiscat.isaihub.pro/jugar/** (juego)

## 🗺️ Rutas de aprendizaje (como IBM Quantum Learning)

La pantalla de inicio copia la estructura de las *learning paths* de [IBM Quantum Learning](https://quantum.cloud.ibm.com/learning): cada ruta tiene nivel, tiempo, insignia y **materiales en orden**, con meta diaria de XP, reto del día (XP doble) y racha 🔥 para volver todos los días.

| | |
|---|---|
| ![Rutas](docs/screenshots/28-rutas.png) **Rutas, meta diaria, reto del día e insignias** | ![Ruta ML](docs/screenshots/29-ruta-qml.png) **Ruta «Datos y Machine Learning cuántico»** |

| Ruta | Nivel | Basada en | Contenido |
|---|---|---|---|
| 🐱 Introducción a lo cuántico | Principiante | *Basics of quantum information* | Información clásica → información cuántica → sistemas múltiples (9 niveles 3D + tutoriales del Composer) |
| 📊 Datos y Machine Learning cuántico | Principiante | Ruta *Data science* (QML) | 6 lecciones: cada idea de estadística/ML con su equivalente cuántico y su código Qiskit |
| 🗺️ Optimización · 🔍 Algoritmos | Intermedio | *Optimization* / *Algorithm development* | Próximamente |

### Estadística / ML ⇄ cuántico (reto EdTech, Qiskit Fall Fest 2026)

| Lección | Concepto clásico | Equivalente cuántico | Actividad |
|---|---|---|---|
| 🪙 Monedas y probabilidad | Distribución de probabilidad | Regla de Born, `qc.h` | Lanzar 1000 monedas clásicas y cuánticas |
| 🎯 La moneda trucada | Bernoulli(p) | `qc.ry(θ)`, P = sin²(θ/2) | Fabricar monedas de 75%, 25% y 90% |
| 🎲 Monte Carlo cuántico | Método de Monte Carlo | Muestreo con *shots* (error ≈ 1/√N) | Estimar π con dardos y una compuerta misteriosa |
| 📉 Descenso de gradiente | Gradiente / *learning rate* | Regla de *parameter-shift* | Entrenar θ; con paso 25 el entrenamiento rebota |
| 🧠 Clasificador cuántico | Perceptrón | Clasificador variacional (VQC) | Entrenar `qc.ry(w·x + b)` hasta 8/8 aciertos |
| 🤝 Kernel cuántico | SVM y kernels | K(x, y) = \|⟨ψ(x)\|ψ(y)⟩\|² | Leer la matriz del kernel calculada por el circuito |

Cada lección termina con su código real de Qiskit (`StatevectorSampler`, `Parameter`, `Statevector`).

| | | |
|---|---|---|
| ![Gradiente](docs/screenshots/30-ml-gradiente.png) | ![Clasificador](docs/screenshots/31-ml-clasificador.png) | ![Kernel](docs/screenshots/32-ml-kernel.png) |

## Código real de Python con Qiskit

Como Swift Playgrounds enseña Swift de verdad, aquí el niño escribe **Python con Qiskit**, la herramienta de IBM para programar computadoras cuánticas. Un selector cambia entre **🐍 Python · Qiskit** y **🇪🇸 Español**.

| | |
|---|---|
| ![Editor Qiskit](docs/screenshots/17-editor-qiskit.png) **El editor escribe `qc.h(0)`, `gato.avanzar()`, `for i in range(2):`** | ![Script](docs/screenshots/18-script-qiskit.png) **📋 Script de Qiskit listo para copiar y correr** |

| Español | Python · Qiskit |
|---|---|
| `avanzar()` · `girarDerecha()` · `recogerPez()` | `gato.avanzar()` · `gato.girar_derecha()` · `gato.recoger_pez()` |
| `for i in 1 ... 3 { }` | `for i in range(3):` |
| `aplicarX()` · `aplicarH()` | `qc.x(0)` · `qc.h(0)` |
| `medir()` · `entrelazar()` | `qc.measure_all()` · `qc.cx(0, 1)` |

El juego no necesita instalar Qiskit: usa su propio simulador de 2 qubits en el navegador (`js/quantum.js`), que da los mismos resultados para estas compuertas. El botón **📋 Script de Qiskit** genera un script ejecutable (`pip install qiskit`) con el circuito del niño.

## ⚛️ Paleta Operations y circuitos (como IBM Quantum Composer)

| | |
|---|---|
| ![Paleta](docs/screenshots/25-paleta-composer.png) **Paleta Operations y el circuito dibujado mientras escribes** | ![Laboratorio](docs/screenshots/26-laboratorio.png) **🧪 Laboratorio: modo libre de 1 a 3 qubits** |

- **Las 25 operaciones del Composer**: H, X, CNOT, Toffoli, SWAP, I, T, S, Z, T†, S†, P, RZ, medir, reset, barrera, control (CZ), `if`, `for`, `while`, `box`, √X, Y, RX, RY. Toca el número de una línea para cambiar de qubit o de ángulo (π/4, π/2, π, 3π/2).
- **El circuito se dibuja en vivo** con los colores del Composer, y se exporta a **Qiskit** y **OpenQASM 3** (`if_test`, `while_loop`, `box`, `for`).
- Simulador propio con **números complejos** (`js/qsim.js`), verificado con identidades del curso: H Z H = X, S·S = Z, T·T = S, √X·√X = X, estados de Bell y GHZ, Toffoli.
- **🧪 Laboratorio**: probabilidades con 1024 disparos, vector de estado (la fase es el color) y discos de fase por qubit (pureza 1 = independiente, 0.5 = entrelazado). Ejemplos: moneda cuántica, interferencia, X = HZH, fases S y T, Bell, GHZ, sumador medio con Toffoli, rotación RY.

![Qiskit y OpenQASM](docs/screenshots/27-qiskit-openqasm.png)

## 🏅 35 desafíos extra

| | |
|---|---|
| ![Desafíos](docs/screenshots/20-desafios.png) **Se desbloquean al avanzar en la ruta** | ![Python](docs/screenshots/21-desafio-python.png) **🐍 Python: llega al estado objetivo con Qiskit** |
| ![Quiz](docs/screenshots/22-desafio-quiz.png) **❓ Quiz de física cuántica, Python y Qiskit** | ![Bloques](docs/screenshots/23-desafio-bloques.png) **🧩 Bloques tipo Scratch con mini mapa** |

- **🐍 12 de Python con Qiskit**: con `qc.x`, `qc.h`, `qc.z` y `qc.cx` hay que igualar un estado (gemelos de Bell, “X sin X” con interferencia, Bell con signo…). Las barras muestran objetivo y resultado, con las amplitudes negativas en rojo. 3 ⭐ con el mínimo de líneas.
- **❓ 12 quizzes**: bits y qubits, `range()`, Schrödinger, Einstein, `QuantumCircuit`, Qiskit.
- **🧩 11 de bloques**: ordenar bloques (siempre sobran algunos) para guiar al gato por puertas ☀️🌙 y muros 🟣, o para preparar un estado cuántico.

![Bloques superado](docs/screenshots/24-desafio-bloques-superado.png)

## Ruta de aprendizaje y gamificación

| | |
|---|---|
| ![Ruta](docs/screenshots/13-ruta.png) **Ruta tipo Duolingo con niveles bloqueados** | ![Quiz](docs/screenshots/14-onboarding-quiz.png) **Introducción con mini quiz en cada nivel** |
| ![Intro Qiskit](docs/screenshots/19-intro-qiskit.png) **El Profe Qubit presenta Qiskit** | |
| ![Victoria](docs/screenshots/15-victoria-estrellas.png) **Estrellas, XP y racha** | ![Desbloqueo](docs/screenshots/16-nivel-desbloqueado.png) **El siguiente nivel se desbloquea al ganar** |

- **Ruta**: 3 unidades con los niveles en zigzag; cada nivel se desbloquea al terminar el anterior. Al final, el trofeo 🏆 *Ingeniero cuántico*.
- **Introducción por nivel**: el Profe Qubit explica el concepto, presenta los comandos nuevos y hace una pregunta (+5 XP).
- **Estrellas**: 3 ⭐ a la primera y sin pista · 2 ⭐ con hasta 2 errores · 1 ⭐ al terminar.
- **XP y racha 🔥** de días seguidos. Todo se guarda en el navegador.

## Capturas

| | |
|---|---|
| ![Bienvenida](docs/screenshots/01-bienvenida.png) **Bienvenida** | ![Comandos](docs/screenshots/02-nivel-1-comandos.png) **Página 1: comandos** |
| ![Bucle for](docs/screenshots/03-bucle-for.png) **Bucles `for`** | ![Muro cuántico](docs/screenshots/05-muro-cuantico.png) **Muro cuántico (superposición)** |
| ![Entrelazamiento](docs/screenshots/06-entrelazamiento.png) **Gatos entrelazados** | ![Victoria](docs/screenshots/07-victoria-interferencia.png) **¡Lo lograste! (interferencia)** |
| ![Error amable](docs/screenshots/08-error-con-pista.png) **Errores con pistas** | ![Profe Qubit](docs/screenshots/09-profe-qubit.png) **Profe Qubit (tutor con IA)** |
| ![Glosario](docs/screenshots/10-glosario.png) **Glosario para niños** | ![Páginas](docs/screenshots/11-paginas.png) **Lista de páginas** |

<p align="center"><img src="docs/screenshots/12-movil.png" width="300" alt="Versión móvil"><br><b>También funciona en celular y tablet</b></p>

## Cómo jugarlo

```bash
git clone https://github.com/isai-cyber/qiscat-learning.git
cd qiscat-learning
cp .env.example .env      # pon tu clave de IA en .env
node server.js            # Node 18 o más nuevo, sin npm install
```

Abre http://localhost:8080

> Sin clave el juego funciona completo; solo el tutor **Profe Qubit** queda "dormido".

## Qué aprenden

| Página | Concepto |
|---|---|
| 1. Crea comandos | Secuencias de comandos |
| 2. Dobla la esquina | Orientación y orden |
| 3. Repite con for | Bucles |
| 4. La compuerta X | Qubit, 0/1, compuerta X (NOT) |
| 5. La caja de Schrödinger | Superposición (H) y medición al azar |
| 6. El muro cuántico | Superposición ≈ efecto túnel |
| 7. Doble H | Interferencia (H·H = identidad) |
| 8. Gatos entrelazados | Entrelazamiento (CNOT, estado de Bell) |
| 9. Gran desafío | Todo junto |

- 😴 dormido = |0⟩ · 😺 despierto = |1⟩
- El medidor de arriba muestra las probabilidades y el estado `|ψ⟩` real (simulador de 2 qubits en `js/quantum.js`).
- Las palabras azules abren un glosario para niños.

## Profe Qubit 🦉 (tutor con IA)

`server.js` hace de proxy a una API de IA compatible con `/chat/completions`, así la clave **nunca** llega al navegador. Al tutor se le envía el nivel, el objetivo, el código del niño, el estado cuántico del gato y el último error, para que dé pistas guiadas sin regalar la solución. Tiene límite de 20 preguntas/minuto por IP.

Variables (`.env`): `AI_API_KEY` (obligatoria para el tutor), `AI_MODEL`, `AI_BASE_URL`, `PORT`.

## Estructura

```
index.html, style.css     Interfaz estilo Swift Playgrounds
server.js                 Servidor estático + proxy del tutor
js/main.js                Lógica del juego y ejecución del código
js/world.js               Isla 3D (Three.js), puertas, muros, caja, peces
js/cat.js                 Gato de bloques (basado en CatCode) con 2 estados superpuestos
js/editor.js              Editor de código por toques (for, deshacer, ⌫, ↵)
js/quantum.js             Simulador de 2 qubits (X, H, CNOT, medir)
js/levels.js              Niveles, textos y glosario
js/tutor.js               Chat del Profe Qubit
js/progress.js            XP, estrellas, racha y desbloqueo de niveles
js/path.js                Ruta de aprendizaje (pantalla de inicio)
js/onboarding.js          Introducción de cada nivel con mini quiz
js/onboarding-data.js     Textos, unidades y preguntas de cada nivel
js/lang.js                Python · Qiskit / Español: traducción y script de Qiskit
js/challenges.js          Desafíos: lista, Python, quiz, bloques y simulador
js/challenges-data.js     Los 35 desafíos
js/qsim.js                Simulador de 1 a 3 qubits con amplitudes complejas
js/ops.js                 Las 25 operaciones del Composer (Qiskit, español, OpenQASM)
js/palette.js             Paleta Operations
js/circuit.js             Dibujo del circuito (SVG)
js/codegen.js             Exportar a Qiskit y OpenQASM 3
js/lab.js                 🧪 Laboratorio (modo libre)
js/routes.js              Rutas de aprendizaje (inicio), meta diaria, reto del día, insignias
js/ml.js                  Lecciones de datos y Machine Learning cuántico
landing/                  Landing page (usa el motor 3D del juego)
```

### Landing page

`landing/index.html` es la página de presentación. En producción vive en la raíz del dominio y el juego en `/jugar/`, por eso sus botones apuntan a `/jugar/`. En local ábrela en `http://localhost:8080/landing/index.html`.

### Producción

`server.js` acepta `HOST=127.0.0.1` para quedar detrás de nginx, y toma la IP real de `X-Forwarded-For` para limitar las preguntas al tutor por usuario.

Para crear un nivel nuevo, agrega un objeto en `LEVELS` (`js/levels.js`); el mapa usa caracteres (`S`, `.`, `F`, `B`, `Q`, `A`, `D`, `w`, `T`, `#`).

Licencia: MIT. Partes derivadas de CatCode © 2025 Craig Michael Lawrence Dsouza (ver `LICENSE-CatCode`).
