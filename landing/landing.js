// Landing page de QisCat Learning — reutiliza el motor 3D del juego
import * as THREE from 'three';
import { World } from '../js/world.js';
import { SchrodiCat } from '../js/cat.js';

const $ = id => document.getElementById(id);
const t0 = performance.now();
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.body.classList.add('loading');

// ---------- luciérnagas de la pantalla de carga ----------
const ff = document.querySelector('.fireflies');
for (let i = 0; i < 18; i++) {
  const f = document.createElement('i');
  f.style.left = Math.random() * 100 + '%';
  f.style.top = Math.random() * 100 + '%';
  f.style.animationDelay = -Math.random() * 6 + 's';
  f.style.animationDuration = 4 + Math.random() * 5 + 's';
  ff.appendChild(f);
}

// ---------- bordes rasgados ----------
function jag(n, amp, seed) {
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(((Math.sin((i + 1) * 12.9898 * seed) * 43758.5453) % 1 + 1) % 1 * amp);
  return pts;
}
function tornClip(el, { top = 0, bottom = 0, side = 0 }) {
  const n = 40, s = Math.random() * 10 + 1;
  const pts = [];
  const jt = jag(n, top, s), jb = jag(n, bottom, s + 3), jl = jag(10, side, s + 5), jr = jag(10, side, s + 7);
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${jt[i].toFixed(1)}px`);
  for (let i = 0; i <= 10; i++) pts.push(`calc(100% - ${jr[i].toFixed(1)}px) ${(i / 10) * 100}%`);
  for (let i = n; i >= 0; i--) pts.push(`${(i / n) * 100}% calc(100% - ${jb[i].toFixed(1)}px)`);
  for (let i = 10; i >= 0; i--) pts.push(`${jl[i].toFixed(1)}px ${(i / 10) * 100}%`);
  el.style.clipPath = `polygon(${pts.join(',')})`;
}
document.querySelectorAll('.torn').forEach(el => tornClip(el, { top: 34, bottom: 34 }));
document.querySelectorAll('.torn-top').forEach(el => tornClip(el, { top: 34 }));
document.querySelectorAll('.torn-bottom').forEach(el => tornClip(el, { bottom: 46 }));
document.querySelectorAll('.torn-frame').forEach(el => tornClip(el, { top: 10, bottom: 10, side: 8 }));

// ---------- hojas alrededor de la caja ----------
(function leaves() {
  const box = document.querySelector('.leaves');
  const cols = ['#1d3a2b', '#24473a', '#16301f', '#2a523f'];
  const leaf = 'M0 0 C 30 -40 90 -40 130 0 C 90 40 30 40 0 0Z';
  for (let i = 0; i < 46; i++) {
    const side = i % 4; // 0 arriba, 1 derecha, 2 abajo, 3 izquierda
    const u = Math.random() * 100;
    const size = 90 + Math.random() * 110;
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '-10 -45 150 90');
    s.style.width = size + 'px';
    const inward = [90, 180, 270, 0][side] + (Math.random() - 0.5) * 70;
    const pos = [[u + '%', '-30px'], ['calc(100% - ' + size * 0.6 + 'px)', u + '%'], [u + '%', 'calc(100% - 40px)'], ['-' + size * 0.35 + 'px', u + '%']][side];
    s.style.left = pos[0]; s.style.top = pos[1];
    s.style.transform = `rotate(${inward}deg)`;
    s.innerHTML = `<path d="${leaf}" fill="${cols[i % 4]}"/><path d="M0 0 L120 0" stroke="#0e1714" stroke-opacity=".35" stroke-width="3"/>`;
    box.appendChild(s);
  }
})();

// ---------- portada 3D (motor del juego) ----------
const hero = new World($('hero3d'));
const baseFit = hero.fitCamera.bind(hero);
hero.fitCamera = function () {
  baseFit();
  const lift = innerWidth < 700 ? 1.8 : 3.2;
  this.controls.target.y += lift;
  this.camera.position.y += lift;
};
hero.build({
  id: 'hero',
  map: [
    ' ##w### ',
    '#......#',
    '#.F##B.#',
    '#S..Q..#',
    ' ###### ',
  ],
  dir: 0,
});
hero.placeCat(1, 3, 0);
Object.assign(hero.controls, { enableZoom: false, autoRotate: !reduceMotion, autoRotateSpeed: 0.7 });
if (matchMedia('(pointer: coarse)').matches) hero.controls.enableRotate = false;

// el gato alterna: H → superposición → medir → resultado
let heroP = 0;
const stateEl = $('hero-state');
const setHero = (p, label) => {
  heroP = p;
  hero.cat.setProb(p);
  stateEl.textContent = label;
  stateEl.classList.add('pop');
  setTimeout(() => stateEl.classList.remove('pop'), 300);
};
async function heroLoop() {
  for (;;) {
    await hero.wait(2600);
    hero.gateFx(0xb388ff);
    setHero(0.5, '✨ aplicarH() → 😴 + 😺 a la vez');
    hero.popLabel('H → 😴+😺', hero.cat.group.position);
    await hero.wait(3600);
    hero.flash(hero.cat.group.position);
    const r = Math.random() < 0.5;
    setHero(r ? 1 : 0, r ? '👀 medir() → 😺 ¡despierto!' : '👀 medir() → 😴 ¡dormido!');
    hero.popLabel(r ? '😺 ¡Despierto!' : '😴 ¡Dormido!', hero.cat.group.position);
    if (r) { await hero.wait(2400); hero.gateFx(0xffc93c); setHero(0, '🔄 aplicarX() → 😴 dormido'); }
  }
}
if (!reduceMotion) heroLoop();

// pausar el 3D cuando no se ve
new IntersectionObserver(([e]) => hero.renderer.setAnimationLoop(e.isIntersecting ? () => hero.frame() : null))
  .observe($('hero3d'));

// ---------- ilustraciones generadas con el gato 3D ----------
const art = (() => {
  const S = 420;
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setSize(S, S, false);
  r.setPixelRatio(1);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x664422, 1.6));
  const d = new THREE.DirectionalLight(0xfff1d6, 2.4); d.position.set(3, 5, 4); scene.add(d);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  const holder = new THREE.Group(); scene.add(holder);

  return (build, { y = 0.42, dist = 3.1, ang = 0.5 } = {}) => {
    holder.clear();
    build(holder);
    cam.position.set(Math.sin(ang) * dist, y + dist * 0.42, Math.cos(ang) * dist);
    cam.lookAt(0, y, 0);
    r.render(scene, cam);
    return r.domElement.toDataURL('image/png');
  };
})();

function cat(p = 0, colors, rot = 0.5) {
  const c = new SchrodiCat(colors);
  c.setProb(p);
  c.update(0.6, 0);
  c.aura.visible = false; // el aura se recorta en las ilustraciones
  c.rig.rotation.y = rot;
  return c;
}
function box(open = true) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xc8955a, roughness: 0.95 });
  const s = 0.84, h = 0.5, t = 0.04;
  [[0, h / 2, s / 2, s, h, t], [0, h / 2, -s / 2, s, h, t], [s / 2, h / 2, 0, t, h, s], [-s / 2, h / 2, 0, t, h, s]].forEach(([x, yy, z, w, hh, dd]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, dd), mat); m.position.set(x, yy, z); g.add(m);
  });
  [[0, s / 2, 0], [0, -s / 2, Math.PI], [s / 2, 0, Math.PI / 2], [-s / 2, 0, -Math.PI / 2]].forEach(([x, z, ry], i) => {
    const pivot = new THREE.Group(); pivot.position.set(x, h, z); pivot.rotation.y = ry;
    const flap = new THREE.Mesh(new THREE.BoxGeometry(s, 0.03, s / 2), mat); flap.position.z = s / 4;
    const tape = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, s / 2), new THREE.MeshStandardMaterial({ color: 0xe8c48a })); tape.position.z = s / 4;
    pivot.add(flap, tape);
    pivot.rotation.x = open ? -1.1 : -(3.1 - i * 0.02);
    g.add(pivot);
  });
  if (!open) {
    const q = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 20, Math.PI * 1.4), new THREE.MeshBasicMaterial({ color: 0x7c4dff }));
    q.position.set(0, 0.28, s / 2 + 0.03); q.rotation.z = -0.6; g.add(q);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.035), q.material); dot.position.set(0, 0.1, s / 2 + 0.03); g.add(dot);
  }
  return g;
}
function ring(color, r = 0.55, y = 0.1) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 10, 60), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }));
  m.rotation.x = Math.PI / 2; m.position.y = y; return m;
}
function fish(x, y, z) {
  const f = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xff7f50, emissive: 0xff5a1f, emissiveIntensity: 0.3 });
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mat); b.scale.set(1.3, 0.75, 0.45);
  const t = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.16, 4), mat); t.rotation.z = Math.PI / 2; t.position.x = -0.26;
  f.add(b, t); f.position.set(x, y, z); f.rotation.y = 0.5; return f;
}
function beads(a, b) {
  const g = new THREE.Group();
  const curve = new THREE.QuadraticBezierCurve3(a, a.clone().add(b).multiplyScalar(0.5).setY(1.5), b);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff7ad9 });
  for (let i = 1; i < 14; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), mat); s.position.copy(curve.getPoint(i / 14)); g.add(s); }
  return g;
}
const TWIN = { body: 0xb9b2e6, stripe: 0x8a80c9, eye: 0x13c4a3 };

const ART = {
  sleep: () => art(g => g.add(cat(0).group)),
  awake: () => art(g => { g.add(cat(1).group); g.add(ring(0xffc93c)); }),
  ghost: () => art(g => g.add(cat(0.5).group)),
  boxClosed: () => art(g => g.add(box(false)), { y: 0.3, dist: 2.7 }),
  boxAwake: () => art(g => { g.add(box(true)); const c = cat(1, undefined, 0.2); c.group.position.y = 0.05; g.add(c.group); }, { y: 0.4, dist: 2.9 }),
  boxSleep: () => art(g => { g.add(box(true)); const c = cat(0, undefined, 0.2); c.group.position.y = 0.05; g.add(c.group); }, { y: 0.4, dist: 2.9 }),
  twins: () => art(g => {
    const a = cat(0.5, undefined, 0.9); a.group.position.x = -0.55; g.add(a.group);
    const b = cat(0.5, TWIN, -0.9); b.group.position.x = 0.55; g.add(b.group);
    g.add(beads(new THREE.Vector3(-0.55, 0.8, 0), new THREE.Vector3(0.55, 0.8, 0)));
  }, { y: 0.5, dist: 3.6, ang: 0.2 }),
  interference: () => art(g => { g.add(cat(0, undefined, 0.5).group); g.add(ring(0xb388ff, 0.5, 0.05), ring(0x7c4dff, 0.72, 0.05), ring(0x5b3fd0, 0.94, 0.05)); }, { dist: 3.4 }),
  tunnel: () => art(g => {
    const c = cat(0.5, undefined, 1.4); c.group.position.x = -0.15; g.add(c.group);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), new THREE.MeshBasicMaterial({ color: 0xa35bff, transparent: true, opacity: 0.45, side: THREE.DoubleSide }));
    wall.position.set(0.1, 0.65, 0); wall.rotation.y = Math.PI / 2; g.add(wall);
  }, { dist: 3.3 }),
  loop: () => art(g => { g.add(cat(1, undefined, 1.2).group); g.add(fish(0.75, 0.5, 0.2), fish(1.25, 0.6, -0.1), fish(0.95, 0.95, -0.3)); }, { dist: 3.6, ang: 0.35, y: 0.5 }),
};
const img = {};
Object.entries(ART).forEach(([k, fn]) => { img[k] = fn(); });

// ---------- la caja interactiva ----------
const tally = { s: 0, a: 0 };
$('box-img').src = img.boxClosed;
let boxBusy = false;
$('box-btn').onclick = async () => {
  if (boxBusy) return;
  boxBusy = true;
  const stage = document.querySelector('.box-stage');
  $('box-img').src = img.boxClosed;
  stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake');
  await new Promise(r => setTimeout(r, 600));
  const awake = Math.random() < 0.5;
  awake ? tally.a++ : tally.s++;
  $('box-flash').classList.remove('on'); void $('box-flash').offsetWidth; $('box-flash').classList.add('on');
  $('box-img').src = awake ? img.boxAwake : img.boxSleep;
  $('tally').textContent = `😴 ${tally.s} · 😺 ${tally.a}`;
  $('box-btn').textContent = 'Cerrar y abrir otra vez';
  boxBusy = false;
};

// ---------- carrusel de superpoderes ----------
const POWERS = [
  { glyph: 'aplicarX()', art: 'awake', desc: '<code>aplicarX()</code> voltea al gato como una moneda: 😴 ⇄ 😺. Abre la puerta del sol ☀️.' },
  { glyph: 'aplicarH()', art: 'ghost', desc: '<code>aplicarH()</code> crea la superposición: Schrödi está dormido <b>y</b> despierto al mismo tiempo.' },
  { glyph: 'medir()', art: 'boxClosed', desc: '<code>medir()</code> abre la caja. La superposición desaparece y el gato elige al azar.' },
  { glyph: 'entrelazar()', art: 'twins', desc: '<code>entrelazar()</code> conecta a dos gatos con un hilo mágico: ¡siempre salen iguales!' },
  { glyph: 'for', art: 'loop', desc: 'Los bucles <code>for</code> repiten tu código. Las computadoras cuánticas repiten experimentos miles de veces.' },
  { glyph: 'H · H', art: 'interference', desc: 'Dos compuertas H se cancelan: eso es <b>interferencia</b>, el truco secreto de los algoritmos cuánticos.' },
];
const car = $('carousel');
POWERS.forEach((p, i) => {
  const d = document.createElement('div');
  d.className = 'power';
  d.innerHTML = `<img src="${img[p.art]}" alt="${p.glyph}"><span class="glyph">${p.glyph}</span>`;
  d.onclick = () => go(i);
  car.appendChild(d);
});
let pw = 1;
function go(i) {
  const n = POWERS.length;
  pw = (i + n) % n;
  const step = innerWidth < 700 ? 150 : 250;
  [...car.children].forEach((el, k) => {
    let off = k - pw;
    if (off > n / 2) off -= n;
    if (off < -n / 2) off += n;
    const a = Math.abs(off);
    el.style.transform = `translate(calc(-50% + ${off * step}px), -50%) scale(${a === 0 ? 1.3 : 0.78})`;
    el.style.opacity = a > 2 ? 0 : a === 0 ? 1 : 0.75;
    el.style.filter = a === 0 ? 'none' : 'brightness(.65) saturate(.8)';
    el.style.zIndex = 10 - a;
  });
  $('power-desc').innerHTML = POWERS[pw].desc;
}
go(pw);
$('pw-prev').onclick = () => go(pw - 1);
$('pw-next').onclick = () => go(pw + 1);
let auto = setInterval(() => go(pw + 1), 4500);
car.onmouseenter = () => clearInterval(auto);
car.onmouseleave = () => { clearInterval(auto); auto = setInterval(() => go(pw + 1), 4500); };
addEventListener('resize', () => go(pw));

// ---------- tarjetas de conceptos ----------
const CARDS = [
  { t: 'Qubit', art: 'sleep', d: 'El gato es 0 (😴) o 1 (😺)… o los dos.', c: ['#3d6fd6', '#6f9bff', '#1d2f66'] },
  { t: 'Compuerta X', art: 'awake', d: 'Voltea el qubit como una moneda.', c: ['#d6a23d', '#ffd36a', '#5e4210'] },
  { t: 'Superposición', art: 'ghost', d: 'Dormido y despierto a la vez.', c: ['#7c4dff', '#b79bff', '#2c1766'] },
  { t: 'Medición', art: 'boxAwake', d: 'Abrir la caja hace que el gato elija.', c: ['#b06a32', '#e0a46a', '#4a2510'] },
  { t: 'Efecto túnel', art: 'tunnel', d: 'Los gatos fantasma atraviesan muros.', c: ['#c2338f', '#ff7ad9', '#4f0d38'] },
  { t: 'Interferencia', art: 'interference', d: 'H dos veces se cancela.', c: ['#2e8f8a', '#5fd6cf', '#0e3a38'] },
  { t: 'Entrelazamiento', art: 'twins', d: 'Dos gatos, un solo destino.', c: ['#3f8f4f', '#77d68a', '#123d1c'] },
  { t: 'Bucles', art: 'loop', d: 'Repite código con for.', c: ['#c4462f', '#ff8a6a', '#4f150b'] },
];
const cards = $('cards');
CARDS.forEach(k => {
  const el = document.createElement('div');
  el.className = 'card reveal';
  el.style.setProperty('--c1', k.c[0]); el.style.setProperty('--c2', k.c[1]); el.style.setProperty('--c3', k.c[2]);
  el.innerHTML = `<div class="rings"></div><i class="cn1"></i><i class="cn2"></i><img src="${img[k.art]}" alt=""><h4>${k.t}</h4><p>${k.d}</p>`;
  cards.appendChild(el);
});
const cardStep = () => cards.firstElementChild.getBoundingClientRect().width + 24;
$('cards-prev').onclick = () => cards.scrollBy({ left: -cardStep(), behavior: 'smooth' });
$('cards-next').onclick = () => cards.scrollBy({ left: cardStep(), behavior: 'smooth' });

// ---------- aparición al hacer scroll + nav + parallax ----------
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
const title = document.querySelector('.hero-title');
addEventListener('scroll', () => {
  const y = scrollY;
  $('nav').classList.toggle('solid', y > innerHeight * 0.6);
  if (!reduceMotion && y < innerHeight) {
    title.style.transform = `translateY(${y * 0.35}px)`;
    title.style.opacity = 1 - y / (innerHeight * 0.7);
  }
}, { passive: true });

// ---------- quitar pantalla de carga ----------
const wait = Math.max(0, 1400 - (performance.now() - t0));
setTimeout(() => { $('loader').classList.add('done'); document.body.classList.remove('loading'); }, wait);
