// Paleta "Operations" al estilo de IBM Quantum Composer
import { OPS } from './ops.js';

const ICONS = {
  cnot: '<svg viewBox="0 0 24 24" width="22" height="22"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="5" r="2.6" fill="currentColor"/><circle cx="12" cy="16" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 16h10" stroke="currentColor" stroke-width="1.6"/></svg>',
  toffoli: '<svg viewBox="0 0 24 24" width="22" height="22"><line x1="12" y1="3" x2="12" y2="20" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="3.5" r="2.3" fill="currentColor"/><circle cx="12" cy="9.5" r="2.3" fill="currentColor"/><circle cx="12" cy="17" r="4.3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7.7 17h8.6" stroke="currentColor" stroke-width="1.6"/></svg>',
  swap: '<svg viewBox="0 0 24 24" width="22" height="22"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 2.5l7 5M15.5 2.5l-7 5M8.5 16.5l7 5M15.5 16.5l-7 5" stroke="currentColor" stroke-width="1.8"/></svg>',
  measure: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 17a8 8 0 0 1 16 0" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 17l5 -8" stroke="currentColor" stroke-width="1.7"/><text x="17" y="7" font-size="7" fill="currentColor">z</text></svg>',
  control: '<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="4.5" fill="currentColor"/></svg>',
};

// disabled: { id: 'motivo' } · compact: tamaño reducido para la barra del juego
export function renderPalette(el, { onPick, disabled = {}, compact = false, title = true }) {
  el.classList.add('ops-palette');
  el.classList.toggle('compact', compact);
  el.innerHTML = `${title ? '<div class="ops-head"><span>Operations</span><span class="ops-ico">⌕ ☰</span></div>' : ''}
    <div class="ops-grid">${OPS.map(o => {
      const off = disabled[o.id];
      return `<button class="op op-${o.color}${off ? ' off' : ''}${!o.icon && o.label.length > 3 ? ' long' : ''}" data-op="${o.id}" title="${o.name}: ${off || o.tip}" aria-label="${o.name}">${o.icon ? ICONS[o.icon] : `<span>${o.label}</span>`}</button>`;
    }).join('')}</div>`;
  el.onclick = e => {
    const b = e.target.closest('[data-op]');
    if (!b) return;
    if (b.classList.contains('off')) { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); onPick?.(b.dataset.op, disabled[b.dataset.op]); return; }
    onPick?.(b.dataset.op);
  };
}
