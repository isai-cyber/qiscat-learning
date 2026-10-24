// Ruta de aprendizaje estilo Duolingo: unidades, niveles en zigzag y candados
import { LEVELS } from './levels.js';
import { UNITS, ONBOARDING } from './onboarding-data.js';
import { sfx } from './audio.js';

const $ = id => document.getElementById(id);
const ZIGZAG = [0, 70, 105, 70, 0, -70, -105, -70];
const DECOR = { 1: '<img src="assets/logo.webp" alt="">', 2: '<span>📦</span>', 3: '<span>🐱🔗🐱</span>' };

export class PathScreen {
  // onStart(i) se llama al tocar EMPEZAR / REPASAR en un nivel desbloqueado
  constructor(progress, { onStart, onClose, onChallenges, onLab }) {
    this.p = progress;
    this.onStart = onStart;
    this.onClose = onClose;
    this.onChallenges = onChallenges;
    this.onLab = onLab;
    this.root = $('path');
    this.root.addEventListener('click', e => this.onClick(e));
  }

  get open() { return !this.root.classList.contains('hidden'); }

  show({ focus = this.p.current(), unlocked = -1, canClose = false } = {}) {
    this.render(focus, unlocked, canClose);
    this.root.classList.remove('hidden');
    requestAnimationFrame(() => {
      const el = this.root.querySelector(`.node-wrap[data-i="${focus}"]`);
      el?.scrollIntoView({ block: 'center', behavior: unlocked >= 0 ? 'smooth' : 'auto' });
    });
  }
  hide() { this.root.classList.add('hidden'); }

  render(focus, unlocked, canClose) {
    const p = this.p, cur = p.current();
    let html = `
      <header class="path-top">
        <div class="path-brand"><img src="assets/logo.webp" alt=""><span>QisCat Learning</span></div>
        <div class="path-stats">
          <span class="st fire ${p.playedToday() ? 'on' : ''}" title="Racha de días seguidos">🔥 ${p.streak}</span>
          <span class="st xp" title="Puntos de experiencia">⚡ ${p.xp} XP</span>
          <span class="st star" title="Estrellas">⭐ ${p.totalStars()}/${LEVELS.length * 3}</span>
        </div>
        <div class="path-actions">
          <button class="lab-open" data-act="lab">🧪 <span>Laboratorio</span></button>
          <button class="chal-open" data-act="chal">🏅 <span>Desafíos</span></button>
          ${canClose ? '<button class="path-close" data-act="close" title="Volver al nivel">✕</button>' : ''}
        </div>
      </header>
      <div class="path-scroll"><div class="path-col">`;

    let chap = null, pos = 0;
    LEVELS.forEach((L, i) => {
      const u = UNITS[L.chapter];
      if (L.chapter !== chap) {
        if (chap) html += '</div></section>';
        chap = L.chapter; pos = 0;
        html += `
          <section class="unit" style="--unit:${u.color};--unit-dark:${u.dark}">
            <div class="unit-banner">
              <div><small>Unidad ${u.n}</small><h2>${L.chapter}</h2><p>${u.desc}</p></div>
              <span class="unit-count">${LEVELS.filter((l, k) => l.chapter === chap && p.isDone(k)).length}/${LEVELS.filter(l => l.chapter === chap).length}</span>
            </div>
            <div class="unit-nodes"><div class="unit-decor ${u.n % 2 ? 'right' : 'left'}">${DECOR[u.n]}</div>`;
      }
      const state = p.isDone(i) ? 'done' : p.isUnlocked(i) ? 'current' : 'locked';
      const stars = p.stars(i);
      const icon = state === 'locked' ? '🔒' : state === 'done' ? (stars === 3 ? '👑' : '✓') : ONBOARDING[L.id].icon;
      html += `
        <div class="node-wrap ${i === unlocked ? 'unlocking' : ''}" data-i="${i}" style="--x:${ZIGZAG[pos % ZIGZAG.length]}px">
          ${state === 'current' && i === cur ? '<div class="start-bubble">EMPEZAR</div>' : ''}
          <button class="node ${state}" data-node="${i}" aria-label="Nivel ${i + 1}: ${L.title}${state === 'locked' ? ' (bloqueado)' : ''}">${icon}</button>
          ${state === 'done' ? `<div class="node-stars">${'★'.repeat(stars)}<i>${'★'.repeat(3 - stars)}</i></div>` : ''}
        </div>`;
      pos++;
    });
    html += '</div></section>';

    const all = p.allDone();
    html += `
      <button class="chal-promo" data-act="chal">
        <span class="cp-icons">🐍❓🧩</span>
        <b>35 desafíos extra</b>
        <span>Python con Qiskit, quizzes y bloques. Se desbloquean al avanzar.</span>
      </button>
      <div class="trophy ${all ? 'won' : ''}">
        <div class="trophy-icon">${all ? '🏆' : '🔒'}</div>
        <b>Ingeniero cuántico</b>
        <span>${all ? '¡Completaste toda la ruta!' : 'Termina los 9 niveles para ganarlo'}</span>
      </div>
    </div></div>`;
    this.root.innerHTML = html;
  }

  onClick(e) {
    if (e.target.closest('[data-act="close"]')) { this.hide(); this.onClose?.(); return; }
    if (e.target.closest('[data-act="chal"]')) { sfx.tap(); this.hide(); this.onChallenges?.(); return; }
    if (e.target.closest('[data-act="lab"]')) { sfx.tap(); this.hide(); this.onLab?.(); return; }
    const start = e.target.closest('[data-start]');
    if (start) { sfx.tap(); this.hide(); this.onStart(+start.dataset.start); return; }
    const node = e.target.closest('[data-node]');
    this.root.querySelectorAll('.node-pop').forEach(x => x.remove());
    if (!node) return;
    const i = +node.dataset.node, L = LEVELS[i], p = this.p;
    const wrap = node.parentElement;
    const pop = document.createElement('div');
    if (!p.isUnlocked(i)) {
      sfx.bump();
      node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake');
      pop.className = 'node-pop locked';
      pop.innerHTML = `<b>${L.title}</b><span>🔒 Completa «${LEVELS[i - 1].title}» para desbloquear este nivel.</span>`;
    } else {
      sfx.tap();
      const done = p.isDone(i), s = p.stars(i);
      pop.className = 'node-pop';
      pop.innerHTML = `
        <b>${L.title}</b>
        <span>Nivel ${i + 1} de ${LEVELS.length}${done ? ` · ${'★'.repeat(s)}${'☆'.repeat(3 - s)}` : ''}</span>
        <button data-start="${i}">${done ? 'Repasar' : 'Empezar'} <small>${p.xpPreview(i)} XP</small></button>`;
    }
    wrap.appendChild(pop);
  }
}
