// Rutas de aprendizaje al estilo de IBM Quantum Learning (quantum.cloud.ibm.com/learning):
// cada ruta tiene nivel, tiempo, insignia y materiales en orden (niveles, lecciones y tutoriales).
import { LEVELS } from './levels.js';
import { ONBOARDING } from './onboarding-data.js';
import { ML } from './ml.js';
import { DAILY_GOAL } from './progress.js?v=6';
import { CHALLENGE_TYPES } from './challenges-data.js';
import { sfx } from './audio.js';

const $ = id => document.getElementById(id);

// item: { level } (nivel 3D) · { ml } (lección de datos/ML) · { tut, ex, title } (tutorial del laboratorio, opcional)
export const ROUTES = [
  {
    id: 'intro', icon: '🐱', title: 'Introducción a lo cuántico', level: 'Principiante', color: '#58cc02', dark: '#46a302',
    desc: 'Términos clave, qubits y compuertas, programando a Schrödi. Basada en el curso «Basics of quantum information» de IBM Quantum Learning.',
    badge: { icon: '🎓', name: 'Fundamentos cuánticos' },
    units: [
      { title: 'Información clásica', desc: 'Bits, comandos, giros y bucles', color: '#58cc02', dark: '#46a302',
        items: [{ level: 'hola' }, { level: 'girar' }, { level: 'bucle' }] },
      { title: 'Información cuántica', desc: 'Qubits, compuerta X, superposición y medición', color: '#a560e8', dark: '#8549ba',
        items: [{ level: 'x' }, { level: 'caja' }, { tut: 'coin', ex: 0, title: 'Tutorial: moneda cuántica en el Composer' }, { level: 'muro' }] },
      { title: 'Sistemas múltiples', desc: 'Interferencia y entrelazamiento', color: '#1cb0f6', dark: '#1899d6',
        items: [{ level: 'interferencia' }, { level: 'entrelazados' }, { tut: 'bell', ex: 4, title: 'Tutorial: estado de Bell en el Composer' }, { level: 'reto' }] },
    ],
  },
  {
    id: 'qml', icon: '📊', title: 'Datos y Machine Learning cuántico', level: 'Principiante', color: '#ff9600', dark: '#d97f00',
    requires: 'caja',
    desc: 'Cada lección toma una idea de estadística o Machine Learning y la convierte en su versión cuántica. Inspirada en la ruta «Data science» de IBM Quantum Learning.',
    badge: { icon: '🤖', name: 'Datos cuánticos' },
    units: [
      { title: 'Probabilidad y estadística', desc: 'Distribuciones, monedas trucadas y Monte Carlo', color: '#ff9600', dark: '#d97f00',
        items: [{ ml: 'coins' }, { ml: 'biased' }, { tut: 'ry', ex: 7, title: 'Tutorial: rotación RY en el Composer' }, { ml: 'montecarlo' }] },
      { title: 'Aprendizaje automático', desc: 'Gradientes, clasificadores y kernels cuánticos', color: '#ce82ff', dark: '#a568cc',
        items: [{ ml: 'gradient' }, { ml: 'classifier' }, { ml: 'kernel' }] },
    ],
  },
  { id: 'opt', icon: '🗺️', title: 'Optimización', level: 'Intermedio', soon: true, color: '#8d8d8d', dark: '#6f6f6f',
    desc: 'Encontrar la mejor ruta entre islas con QAOA (como el reto de «Algoritmos y aplicaciones»).', badge: { icon: '🧭', name: 'Optimizador' } },
  { id: 'algo', icon: '🔍', title: 'Algoritmos cuánticos', level: 'Intermedio', soon: true, color: '#8d8d8d', dark: '#6f6f6f',
    desc: 'Deutsch, Grover y teletransportación: los algoritmos que hacen especial a la computación cuántica.', badge: { icon: '🧙', name: 'Algoritmista' } },
];
export const ROUTE = Object.fromEntries(ROUTES.map(r => [r.id, r]));

const MIN = { level: 5, ml: 8, tut: 3 };
export const kindOf = it => it.level ? 'level' : it.ml ? 'ml' : 'tut';
export const required = it => kindOf(it) !== 'tut';
export function itemInfo(it) {
  if (it.level) { const L = LEVELS.find(l => l.id === it.level); return { title: L.title, icon: ONBOARDING[L.id].icon, label: 'Nivel', min: MIN.level }; }
  if (it.ml) { const L = ML[it.ml]; return { title: L.title, icon: L.icon, label: 'Lección', min: MIN.ml, sub: `${L.classic} ⇄ ${L.quantum}` }; }
  return { title: it.title, icon: '🧪', label: 'Tutorial', min: MIN.tut };
}
export const flatItems = r => (r.units || []).flatMap(u => u.items);

export class Routes {
  constructor(progress) { this.p = progress; }
  done(it) {
    if (it.level) return this.p.isDone(LEVELS.findIndex(l => l.id === it.level));
    if (it.ml) return !!this.p.mlDone(it.ml);
    return this.p.tutSeen(it.tut);
  }
  stars(it) {
    if (it.level) return this.p.stars(LEVELS.findIndex(l => l.id === it.level));
    if (it.ml) return this.p.mlDone(it.ml)?.stars || 0;
    return 0;
  }
  routeOpen(r) { return !r.soon && (!r.requires || this.p.isDone(LEVELS.findIndex(l => l.id === r.requires))); }
  // un material se desbloquea cuando todos los obligatorios anteriores están hechos
  unlocked(r, k) {
    if (!this.routeOpen(r)) return false;
    return flatItems(r).slice(0, k).every(it => !required(it) || this.done(it));
  }
  current(r) { const items = flatItems(r); const k = items.findIndex(it => required(it) && !this.done(it)); return k < 0 ? items.length - 1 : k; }
  stats(r) {
    const items = flatItems(r), req = items.filter(required);
    return { done: req.filter(it => this.done(it)).length, total: req.length, min: items.reduce((s, it) => s + itemInfo(it).min, 0), complete: req.length > 0 && req.every(it => this.done(it)) };
  }
}

// Pantalla de inicio: "Rutas de aprendizaje"
export class RoutesScreen {
  constructor(progress, routes, { onRoute, onLab, onChallenges, onDaily, dailyPick }) {
    Object.assign(this, { p: progress, r: routes, onRoute, onLab, onChallenges, onDaily, dailyPick });
    this.root = $('routes');
    this.root.addEventListener('click', e => this.onClick(e));
  }
  hide() { this.root.classList.add('hidden'); }
  show() {
    const p = this.p, R = this.r;
    const daily = this.dailyPick();
    p.dailyId = daily?.id;
    const ring = Math.min(p.todayXp / DAILY_GOAL, 1);
    const C = 2 * Math.PI * 26;
    const badges = ROUTES.filter(r => r.badge);
    this.root.innerHTML = `
      <header class="path-top">
        <div class="path-brand"><img src="assets/logo.webp" alt=""><span>QisCat Learning</span></div>
        <div class="path-stats">
          <span class="st fire ${p.playedToday() ? 'on' : ''}" title="Racha de días seguidos">🔥 ${p.streak}</span>
          <span class="st xp" title="Puntos de experiencia">⚡ ${p.xp} XP</span>
        </div>
        <div class="path-actions">
          <button class="lab-open" data-act="lab">🧪 <span>Laboratorio</span></button>
          <button class="chal-open" data-act="chal">🏅 <span>Desafíos</span></button>
        </div>
      </header>
      <div class="path-scroll"><div class="routes-col">
        <div class="routes-hero">
          <div class="goal">
            <svg viewBox="0 0 64 64" class="goal-ring"><circle cx="32" cy="32" r="26" fill="none" stroke="#e5e5e5" stroke-width="7"/>
              <circle cx="32" cy="32" r="26" fill="none" stroke="${ring >= 1 ? '#58cc02' : '#ff9600'}" stroke-width="7" stroke-linecap="round"
                stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - ring)}" transform="rotate(-90 32 32)"/></svg>
            <div><small>Meta diaria</small><b>${p.todayXp}/${DAILY_GOAL} XP</b><span>${ring >= 1 ? '✅ ¡Meta cumplida hoy!' : 'Juega unos minutos para llenar el anillo'}</span></div>
          </div>
          ${daily ? `<button class="daily" data-act="daily" style="--c:${CHALLENGE_TYPES[daily.type].color};--d:${CHALLENGE_TYPES[daily.type].dark}">
            <span class="daily-tag">⭐ Reto del día · XP doble</span>
            <b>${CHALLENGE_TYPES[daily.type].icon} ${daily.title}</b>
            <span>${p.dailyClaimed() ? '✅ ¡Completado hoy! Vuelve mañana por otro.' : 'Un desafío nuevo cada día'}</span></button>`
            : '<div class="daily off"><span class="daily-tag">⭐ Reto del día</span><b>Termina «Crea comandos»</b><span>para desbloquear los retos diarios</span></div>'}
        </div>
        <h1 class="routes-h">Rutas de aprendizaje</h1>
        <p class="routes-sub">Secuencias de niveles, lecciones y tutoriales para aprender paso a paso, como en IBM Quantum Learning. Se recomienda seguirlas en orden.</p>
        <div class="routes-grid">${ROUTES.map(r => this.card(r)).join('')}</div>
        <h2 class="routes-h2">Mis insignias</h2>
        <div class="badges">${badges.map(r => { const won = !r.soon && R.stats(r).complete; return `<div class="badge ${won ? 'won' : ''}"><span>${won ? r.badge.icon : '🔒'}</span><b>${r.badge.name}</b><small>${won ? '¡Ganada!' : r.soon ? 'Próximamente' : `Termina «${r.title}»`}</small></div>`; }).join('')}</div>
      </div></div>`;
    this.root.classList.remove('hidden');
  }
  card(r) {
    const R = this.r;
    if (r.soon) return `<div class="rcard soon"><span class="rtag">Ruta de aprendizaje · Próximamente</span>
      <div class="rtitle"><span class="ricon">${r.icon}</span><b>${r.title}</b></div><span class="rlevel">${r.level}</span><p>${r.desc}</p></div>`;
    const st = R.stats(r), open = R.routeOpen(r), items = flatItems(r);
    const req = r.requires && LEVELS.find(l => l.id === r.requires);
    return `<div class="rcard ${open ? '' : 'locked'}" style="--c:${r.color};--d:${r.dark}">
      <span class="rtag">Ruta de aprendizaje</span>
      <div class="rtitle"><span class="ricon">${r.icon}</span><b>${r.title}</b></div>
      <span class="rlevel">${r.level}</span>
      <p>${r.desc}</p>
      <div class="rmeta"><span>⏱ ${st.min} min</span><span>${r.badge.icon} 1 insignia</span><span>📚 ${items.length} materiales</span></div>
      <div class="rprog"><i style="width:${st.total ? st.done / st.total * 100 : 0}%"></i></div>
      <small class="rprog-t">${st.done}/${st.total} completados</small>
      <details class="rmat"><summary>Materiales (complétalos en orden)</summary>
        <ol>${items.map((it, k) => { const inf = itemInfo(it), d = R.done(it); return `<li class="${d ? 'done' : ''}"><span>${inf.label} | ${inf.min} min</span><b>${d ? '✓ ' : ''}${inf.title}</b>${inf.sub ? `<small>${inf.sub}</small>` : ''}</li>`; }).join('')}</ol></details>
      ${open ? `<button class="rgo" data-route="${r.id}">${st.done ? (st.complete ? 'Repasar' : 'Continuar') : 'Empezar'} ›</button>`
             : `<button class="rgo off" data-route="${r.id}">🔒 Termina «${req.title}»</button>`}
    </div>`;
  }
  onClick(e) {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'lab') { sfx.tap(); this.hide(); return this.onLab(); }
    if (a === 'chal') { sfx.tap(); this.hide(); return this.onChallenges(); }
    if (a === 'daily') { sfx.tap(); this.hide(); return this.onDaily(); }
    const g = e.target.closest('[data-route]');
    if (!g) return;
    const r = ROUTE[g.dataset.route];
    if (!this.r.routeOpen(r)) { sfx.bump(); g.classList.remove('shake'); void g.offsetWidth; g.classList.add('shake'); return; }
    sfx.tap(); this.hide(); this.onRoute(r.id);
  }
}
