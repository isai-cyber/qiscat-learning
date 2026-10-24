// Ruta estilo Duolingo de una ruta de aprendizaje: unidades, materiales en zigzag y candados
import { LEVELS } from './levels.js';
import { ROUTE, flatItems, itemInfo, kindOf, required } from './routes.js';
import { sfx } from './audio.js';

const $ = id => document.getElementById(id);
const ZIGZAG = [0, 70, 105, 70, 0, -70, -105, -70];
const DECOR = ['<img src="assets/logo.webp" alt="">', '<span>📦</span>', '<span>🐱🔗🐱</span>', '<span>📊</span>', '<span>🧠</span>'];

export class PathScreen {
  // onStart(item, routeId) al tocar EMPEZAR / REPASAR en un material desbloqueado
  constructor(progress, routes, { onStart, onClose, onBack, onChallenges, onLab }) {
    Object.assign(this, { p: progress, R: routes, onStart, onClose, onBack, onChallenges, onLab });
    this.root = $('path');
    this.root.addEventListener('click', e => this.onClick(e));
    this.route = 'intro';
  }

  get open() { return !this.root.classList.contains('hidden'); }

  show({ route = this.route, focus, unlocked = -1, canClose = false } = {}) {
    this.route = route;
    const r = ROUTE[route];
    if (focus == null) focus = this.R.current(r);
    this.render(r, unlocked, canClose);
    this.root.classList.remove('hidden');
    requestAnimationFrame(() => {
      this.root.querySelector(`.node-wrap[data-k="${focus}"]`)?.scrollIntoView({ block: 'center', behavior: unlocked >= 0 ? 'smooth' : 'auto' });
    });
  }
  hide() { this.root.classList.add('hidden'); }

  render(r, unlocked, canClose) {
    const p = this.p, R = this.R, items = flatItems(r), cur = R.current(r);
    const st = R.stats(r);
    let html = `
      <header class="path-top">
        <button class="chal-back" data-act="back">‹ Rutas</button>
        <div class="path-stats">
          <span class="st fire ${p.playedToday() ? 'on' : ''}" title="Racha de días seguidos">🔥 ${p.streak}</span>
          <span class="st xp" title="Puntos de experiencia">⚡ ${p.xp} XP</span>
          <span class="st star" title="Materiales completados">${r.icon} ${st.done}/${st.total}</span>
        </div>
        <div class="path-actions">
          <button class="lab-open" data-act="lab">🧪 <span>Laboratorio</span></button>
          <button class="chal-open" data-act="chal">🏅 <span>Desafíos</span></button>
          ${canClose ? '<button class="path-close" data-act="close" title="Volver al nivel">✕</button>' : ''}
        </div>
      </header>
      <div class="path-scroll"><div class="path-col">
        <div class="route-head"><span>${r.level} · ⏱ ${st.min} min · ${r.badge.icon} insignia «${r.badge.name}»</span><h1>${r.icon} ${r.title}</h1></div>`;
    let k = 0;
    r.units.forEach((u, ui) => {
      const reqs = u.items.filter(required);
      html += `
        <section class="unit" style="--unit:${u.color};--unit-dark:${u.dark}">
          <div class="unit-banner">
            <div><small>Unidad ${ui + 1}</small><h2>${u.title}</h2><p>${u.desc}</p></div>
            <span class="unit-count">${reqs.filter(it => R.done(it)).length}/${reqs.length}</span>
          </div>
          <div class="unit-nodes"><div class="unit-decor ${ui % 2 ? 'left' : 'right'}">${DECOR[(r.id === 'qml' ? 3 : 0) + ui] || ''}</div>`;
      u.items.forEach((it, pos) => {
        const kind = kindOf(it), inf = itemInfo(it);
        const done = R.done(it), open = R.unlocked(r, k);
        const state = done ? 'done' : open ? 'current' : 'locked';
        const stars = R.stars(it);
        const icon = state === 'locked' ? '🔒' : state === 'done' && kind !== 'tut' ? (stars === 3 ? '👑' : '✓') : inf.icon;
        html += `
          <div class="node-wrap ${kind === 'tut' ? 'tut' : ''} ${k === unlocked ? 'unlocking' : ''}" data-k="${k}" style="--x:${ZIGZAG[pos % ZIGZAG.length]}px">
            ${state === 'current' && k === cur ? '<div class="start-bubble">EMPEZAR</div>' : ''}
            <button class="node ${state} ${kind}" data-node="${k}" aria-label="${inf.label}: ${inf.title}${state === 'locked' ? ' (bloqueado)' : ''}">${icon}</button>
            ${state === 'done' && kind !== 'tut' ? `<div class="node-stars">${'★'.repeat(stars)}<i>${'★'.repeat(3 - stars)}</i></div>` : ''}
            ${kind === 'tut' ? `<div class="node-label">${inf.label}</div>` : ''}
          </div>`;
        k++;
      });
      html += '</div></section>';
    });
    html += `
      <button class="chal-promo" data-act="chal">
        <span class="cp-icons">🐍❓🧩</span><b>35 desafíos extra</b>
        <span>Python con Qiskit, quizzes y bloques. Se desbloquean al avanzar.</span>
      </button>
      <div class="trophy ${st.complete ? 'won' : ''}">
        <div class="trophy-icon">${st.complete ? r.badge.icon : '🔒'}</div>
        <b>Insignia: ${r.badge.name}</b>
        <span>${st.complete ? '¡Completaste toda la ruta!' : `Termina los ${st.total} materiales para ganarla`}</span>
      </div>
    </div></div>`;
    this.root.innerHTML = html;
  }

  onClick(e) {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'close') { this.hide(); this.onClose?.(); return; }
    if (act === 'back') { sfx.tap(); this.hide(); this.onBack?.(); return; }
    if (act === 'chal') { sfx.tap(); this.hide(); this.onChallenges?.(); return; }
    if (act === 'lab') { sfx.tap(); this.hide(); this.onLab?.(); return; }
    const r = ROUTE[this.route], items = flatItems(r);
    const start = e.target.closest('[data-start]');
    if (start) { sfx.tap(); this.hide(); this.onStart(items[+start.dataset.start], this.route); return; }
    const node = e.target.closest('[data-node]');
    this.root.querySelectorAll('.node-pop').forEach(x => x.remove());
    if (!node) return;
    const k = +node.dataset.node, it = items[k], inf = itemInfo(it);
    const wrap = node.parentElement;
    const pop = document.createElement('div');
    if (!this.R.unlocked(r, k)) {
      sfx.bump();
      node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake');
      const prev = items.slice(0, k).reverse().find(x => required(x) && !this.R.done(x));
      pop.className = 'node-pop locked';
      pop.innerHTML = `<b>${inf.title}</b><span>🔒 Completa «${prev ? itemInfo(prev).title : 'el material anterior'}» para desbloquearlo.</span>`;
    } else {
      sfx.tap();
      const done = this.R.done(it), s = this.R.stars(it);
      const xp = kindOf(it) === 'level' ? this.p.xpPreview(this.levelIndex(it)) : kindOf(it) === 'ml' ? (done ? '+3' : '+30') : '+5';
      pop.className = 'node-pop';
      pop.innerHTML = `
        <b>${inf.title}</b>
        <span>${inf.label} · ${inf.min} min${done && kindOf(it) !== 'tut' ? ` · ${'★'.repeat(s)}${'☆'.repeat(3 - s)}` : ''}</span>
        ${inf.sub ? `<span class="pop-sub">${inf.sub}</span>` : ''}
        <button data-start="${k}">${done ? 'Repasar' : 'Empezar'} <small>${xp} XP</small></button>`;
    }
    wrap.appendChild(pop);
  }
  levelIndex(it) { return LEVELS.findIndex(l => l.id === it.level); }
}
