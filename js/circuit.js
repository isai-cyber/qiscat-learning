// Dibujo del circuito al estilo de IBM Quantum Composer (SVG)
import { OP, ANGLES } from './ops.js';

const COLORS = {
  red: ['#fa4d56', '#fff'], blue: ['#4589ff', '#fff'], light: ['#a6c8ff', '#161616'],
  gray: ['#a8a8a8', '#161616'], pink: ['#ff7eb6', '#161616'],
};
const COL = 48, ROW = 46, X0 = 58, Y0 = 34, BOX = 32;

// items: salida de circuitItems() · n: número de qubits
export function renderCircuit(items, n, { names } = {}) {
  const yq = q => Y0 + q * ROW;
  const yc = Y0 + n * ROW;
  const parts = [], blocks = [];
  let x = X0 + 10, depth = 0;
  const open = [];

  const box = (cx, q, label, color, sub) => {
    const [bg, fg] = COLORS[color];
    const y = yq(q);
    parts.push(`<rect x="${cx - BOX / 2}" y="${y - BOX / 2}" width="${BOX}" height="${BOX}" rx="3" fill="${bg}"/>`);
    parts.push(`<text x="${cx}" y="${y + (sub ? -1 : 5)}" fill="${fg}" font-size="${label.length > 2 ? 11 : 14}" font-weight="600" text-anchor="middle">${label}</text>`);
    if (sub) parts.push(`<text x="${cx}" y="${y + 11}" fill="${fg}" font-size="8.5" text-anchor="middle">${sub}</text>`);
  };
  const dot = (cx, q, fill = '#0f62fe') => parts.push(`<circle cx="${cx}" cy="${yq(q)}" r="5" fill="${fill}"/>`);
  const plus = (cx, q) => {
    const y = yq(q);
    parts.push(`<circle cx="${cx}" cy="${y}" r="12" fill="#0f62fe"/><path d="M${cx - 7} ${y}h14M${cx} ${y - 7}v14" stroke="#fff" stroke-width="2"/>`);
  };
  const vline = (cx, q1, q2, color = '#0f62fe') => parts.push(`<line x1="${cx}" y1="${yq(Math.min(q1, q2))}" x2="${cx}" y2="${yq(Math.max(q1, q2))}" stroke="${color}" stroke-width="2"/>`);
  const cross = (cx, q) => { const y = yq(q); parts.push(`<path d="M${cx - 6} ${y - 6}l12 12M${cx + 6} ${y - 6}l-12 12" stroke="#0f62fe" stroke-width="2.5"/>`); };
  const meter = (cx, q) => {
    const y = yq(q);
    parts.push(`<rect x="${cx - BOX / 2}" y="${y - BOX / 2}" width="${BOX}" height="${BOX}" rx="3" fill="#a8a8a8"/>
      <path d="M${cx - 9} ${y + 5}a9 9 0 0 1 18 0" fill="none" stroke="#161616" stroke-width="1.6"/>
      <path d="M${cx} ${y + 5}l6 -9" stroke="#161616" stroke-width="1.6"/>
      <text x="${cx + 9}" y="${y - 7}" font-size="7" fill="#161616">z</text>`);
  };

  for (const it of items) {
    if (it.open) { open.push({ x: x - COL / 2 + 6, label: it.open, depth: depth++ }); x += 8; continue; }
    if (it.close) {
      const b = open.pop(); depth--;
      if (b) blocks.push({ x1: b.x, x2: x - COL / 2 + 2 + 8, label: b.label, depth: b.depth });
      x += 10;
      continue;
    }
    if (it.measure) {
      for (let q = 0; q < n; q++) {
        meter(x, q);
        parts.push(`<path d="M${x - 1.5} ${yq(q) + BOX / 2}V${yc - 6}M${x + 1.5} ${yq(q) + BOX / 2}V${yc - 6}" stroke="#a8a8a8" stroke-width="1"/>`);
      }
      parts.push(`<path d="M${x - 5} ${yc - 8}l5 7 5 -7z" fill="#a8a8a8"/>`);
      x += COL; continue;
    }
    const g = it.gate, o = OP[g.g];
    if (!o) continue;
    if (g.g === 'cx') { vline(x, g.q, g.q2); dot(x, g.q); plus(x, g.q2); }
    else if (g.g === 'cz') { vline(x, g.q, g.q2, '#6f6f6f'); dot(x, g.q, '#393939'); dot(x, g.q2, '#393939'); }
    else if (g.g === 'swap') { vline(x, g.q, g.q2); cross(x, g.q); cross(x, g.q2); }
    else if (g.g === 'ccx') { vline(x, Math.min(g.q, g.q2, g.q3), Math.max(g.q, g.q2, g.q3)); dot(x, g.q); dot(x, g.q2); plus(x, g.q3); }
    else if (g.g === 'x') plus(x, g.q);
    else if (g.g === 'barrier') parts.push(`<line x1="${x}" y1="${Y0 - 18}" x2="${x}" y2="${yq(n - 1) + 18}" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="4 3"/>`);
    else if (g.g === 'reset') box(x, g.q, '|0⟩', 'gray');
    else box(x, g.q, o.label, o.color, o.kind === 'g1p' ? ANGLES[g.a ?? 1].es : '');
    x += COL;
  }

  const width = Math.max(x + 20, 320);
  const height = yc + 26;
  const wires = [];
  for (let q = 0; q < n; q++) {
    wires.push(`<text x="8" y="${yq(q) + 4}" font-size="12" fill="#525252" font-family="IBM Plex Mono, Menlo, monospace">q[${q}]</text>`);
    if (names?.[q]) wires.push(`<text x="8" y="${yq(q) + 16}" font-size="8.5" fill="#8d8d8d">${names[q]}</text>`);
    wires.push(`<line x1="${X0 - 12}" y1="${yq(q)}" x2="${width - 8}" y2="${yq(q)}" stroke="#8d8d8d" stroke-width="1.2"/>`);
  }
  wires.push(`<text x="8" y="${yc + 4}" font-size="12" fill="#525252" font-family="IBM Plex Mono, Menlo, monospace">c${n}</text>`);
  wires.push(`<path d="M${X0 - 12} ${yc - 1.5}H${width - 8}M${X0 - 12} ${yc + 1.5}H${width - 8}" stroke="#8d8d8d" stroke-width="1"/>`);
  const blk = blocks.map(b => `<rect x="${b.x1}" y="${Y0 - 24 + b.depth * 4}" width="${Math.max(b.x2 - b.x1, 30)}" height="${yq(n - 1) - Y0 + 48 - b.depth * 8}" rx="6" fill="rgba(141,141,141,.08)" stroke="#8d8d8d" stroke-dasharray="5 4"/>
    <text x="${b.x1 + 6}" y="${Y0 - 13 + b.depth * 4}" font-size="9.5" font-weight="700" fill="#525252" font-family="IBM Plex Mono, Menlo, monospace">${b.label}</text>`).join('');
  return `<svg class="circuit-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="IBM Plex Sans, Nunito, sans-serif" role="img" aria-label="Diagrama del circuito cuántico">${wires.join('')}${blk}${parts.join('')}</svg>`;
}
