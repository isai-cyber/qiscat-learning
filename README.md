<p align="center"><img src="assets/logo.webp" width="180" alt="QisCat Learning"></p>

# QisCat Learning

Juego web 3D para niñas y niños (8–12 años) donde aprenden **computación cuántica** programando a **Schrödi**, el gato de Schrödinger. Inspirado en *Swift Playgrounds* y derivado de [CatCode](https://github.com/CraigMLdsouza/CatCode) (MIT).

![Superposición en la caja de Schrödinger](docs/screenshots/04-superposicion.png)

Juega en línea: **https://qiscat.isaihub.pro** (landing) · **https://qiscat.isaihub.pro/jugar/** (juego)

## Ruta de aprendizaje y gamificación

| | |
|---|---|
| ![Ruta](docs/screenshots/13-ruta.png) **Ruta tipo Duolingo con niveles bloqueados** | ![Quiz](docs/screenshots/14-onboarding-quiz.png) **Introducción con mini quiz en cada nivel** |
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
landing/                  Landing page (usa el motor 3D del juego)
```

### Landing page

`landing/index.html` es la página de presentación. En producción vive en la raíz del dominio y el juego en `/jugar/`, por eso sus botones apuntan a `/jugar/`. En local ábrela en `http://localhost:8080/landing/index.html`.

### Producción

`server.js` acepta `HOST=127.0.0.1` para quedar detrás de nginx, y toma la IP real de `X-Forwarded-For` para limitar las preguntas al tutor por usuario.

Para crear un nivel nuevo, agrega un objeto en `LEVELS` (`js/levels.js`); el mapa usa caracteres (`S`, `.`, `F`, `B`, `Q`, `A`, `D`, `w`, `T`, `#`).

Licencia: MIT. Partes derivadas de CatCode © 2025 Craig Michael Lawrence Dsouza (ver `LICENSE-CatCode`).
