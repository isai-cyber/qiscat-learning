// Paleta "Operations" al estilo de IBM Quantum Composer
import { OPS, OP, OP_GUIDE } from './ops.js';

const ICONS = {
  cnot: '<svg viewBox="0 0 24 24" width="22" height="22"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="5" r="2.6" fill="currentColor"/><circle cx="12" cy="16" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 16h10" stroke="currentColor" stroke-width="1.6"/></svg>',
  toffoli: '<svg viewBox="0 0 24 24" width="22" height="22"><line x1="12" y1="3" x2="12" y2="20" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="3.5" r="2.3" fill="currentColor"/><circle cx="12" cy="9.5" r="2.3" fill="currentColor"/><circle cx="12" cy="17" r="4.3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7.7 17h8.6" stroke="currentColor" stroke-width="1.6"/></svg>',
  swap: '<svg viewBox="0 0 24 24" width="22" height="22"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 2.5l7 5M15.5 2.5l-7 5M8.5 16.5l7 5M15.5 16.5l-7 5" stroke="currentColor" stroke-width="1.8"/></svg>',
  measure: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 17a8 8 0 0 1 16 0" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 17l5 -8" stroke="currentColor" stroke-width="1.7"/><text x="17" y="7" font-size="7" fill="currentColor">z</text></svg>',
  control: '<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="4.5" fill="currentColor"/></svg>',
};

// HTML de un botón de la paleta (también lo usa la guía)
export function tile(o, extra = '', attrs = '') {
  return `<button class="op op-${o.color}${!o.icon && o.label.length > 3 ? ' long' : ''} ${extra}" ${attrs} aria-label="${o.name}">${o.icon ? ICONS[o.icon] : `<span>${o.label}</span>`}</button>`;
}

// Tooltip: al pasar el mouse o al mantener presionado (celular) muestra qué hace el botón
let tipEl = null;
function showTip(btn, off) {
  const o = OP[btn.dataset.op];
  tipEl ||= Object.assign(document.createElement('div'), { className: 'op-tip' });
  if (!tipEl.isConnected) document.body.appendChild(tipEl);
  tipEl.innerHTML = `<b>${o.name}</b><span>${OP_GUIDE[o.id]?.kid || o.tip}</span>${off ? `<em>🔒 ${off}</em>` : ''}`;
  tipEl.classList.add('on');
  const r = btn.getBoundingClientRect(), w = 260;
  tipEl.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
  tipEl.style.top = Math.max(8, r.top - 12) + 'px';
}
const hideTip = () => tipEl?.classList.remove('on');

// disabled: { id: 'motivo' } · compact: tamaño reducido para la barra del juego
export function renderPalette(el, { onPick, disabled = {}, compact = false, title = true, onHelp }) {
  el.classList.add('ops-palette');
  el.classList.toggle('compact', compact);
  el.innerHTML = `${title ? `<div class="ops-head"><span>Operations</span>${onHelp ? '<button class="ops-help-mini" data-help title="¿Qué hace cada botón?">? Guía</button>' : '<span class="ops-ico">⌕ ☰</span>'}</div>` : ''}
    <div class="ops-grid">${OPS.map(o => tile(o, disabled[o.id] ? 'off' : '', `data-op="${o.id}"`)).join('')}</div>`;
  let pressTimer = null, longPress = false;
  el.onpointerover = e => { const b = e.target.closest('[data-op]'); if (b && e.pointerType === 'mouse') showTip(b, disabled[b.dataset.op]); };
  el.onpointerout = e => { if (e.target.closest('[data-op]')) hideTip(); };
  el.onpointerdown = e => {
    const b = e.target.closest('[data-op]');
    longPress = false;
    if (!b || e.pointerType === 'mouse') return;
    pressTimer = setTimeout(() => { longPress = true; showTip(b, disabled[b.dataset.op]); }, 450);
  };
  el.onpointerup = el.onpointercancel = () => { clearTimeout(pressTimer); if (longPress) setTimeout(hideTip, 1600); };
  el.onclick = e => {
    if (e.target.closest('[data-help]')) return onHelp?.();
    const b = e.target.closest('[data-op]');
    if (!b) return;
    if (longPress) { longPress = false; return; } // mantener presionado = solo ver la explicación
    hideTip();
    if (b.classList.contains('off')) { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); onPick?.(b.dataset.op, disabled[b.dataset.op]); return; }
    onPick?.(b.dataset.op);
  };
}
