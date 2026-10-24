// Efectos de sonido sintetizados (sin archivos)
let ctx = null;
export const sound = { on: true };

function tone(freq, dur = 0.12, type = 'sine', vol = 0.15, when = 0, slide = 0) {
  if (!sound.on) return;
  ctx ||= new (window.AudioContext || window.webkitAudioContext)();
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

export const sfx = {
  step: () => tone(520, 0.06, 'triangle', 0.06),
  turn: () => tone(380, 0.08, 'triangle', 0.06, 0, 1.3),
  fish: () => { tone(880, 0.1, 'sine', 0.15); tone(1320, 0.18, 'sine', 0.12, 0.08); },
  x: () => tone(300, 0.25, 'square', 0.05, 0, 3),
  h: () => { [0, 0.05, 0.1, 0.15].forEach((d, i) => tone(600 + i * 150, 0.2, 'sine', 0.06, d)); },
  measure: () => { tone(200, 0.4, 'sawtooth', 0.04, 0, 0.5); tone(1000, 0.3, 'sine', 0.12, 0.45); },
  link: () => { tone(440, 0.4, 'sine', 0.08, 0, 2); tone(660, 0.4, 'sine', 0.06, 0.05, 2); },
  door: () => tone(250, 0.3, 'triangle', 0.08, 0, 0.6),
  bump: () => tone(140, 0.2, 'square', 0.08, 0, 0.7),
  fall: () => tone(600, 0.8, 'sine', 0.1, 0, 0.2),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, i * 0.12)),
  fail: () => { tone(330, 0.2, 'triangle', 0.1); tone(262, 0.3, 'triangle', 0.1, 0.18); },
  tap: () => tone(700, 0.04, 'sine', 0.05),
};
