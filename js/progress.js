// Progreso y gamificación: desbloqueo, estrellas, XP y racha diaria
import { LEVELS } from './levels.js';

const XP_PER_STAR = 5, XP_BASE = 10, XP_QUIZ = 5, XP_PRACTICE = 3;

const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };

export class Progress {
  constructor(save, persist) {
    this.s = save;
    this.persist = persist;
    save.done ||= {};
    save.stars ||= {};
    save.quiz ||= {};
    save.onb ||= {};
    save.xp ||= 0;
    save.streak ||= { count: 0, last: null };
    // progreso de versiones anteriores: los niveles ya terminados valen 1 estrella
    for (const id in save.done) if (save.done[id] && !save.stars[id]) save.stars[id] = 1;
  }

  isDone(i) { return !!this.s.done[LEVELS[i]?.id]; }
  isUnlocked(i) { return i === 0 || this.isDone(i - 1); }
  stars(i) { return this.s.stars[LEVELS[i].id] || 0; }
  totalStars() { return LEVELS.reduce((n, _, i) => n + this.stars(i), 0); }
  allDone() { return LEVELS.every((_, i) => this.isDone(i)); }
  // primer nivel sin terminar (o el último si ya acabó todo)
  current() { const i = LEVELS.findIndex((_, k) => !this.isDone(k)); return i < 0 ? LEVELS.length - 1 : i; }

  get xp() { return this.s.xp; }
  // la racha se pierde si pasó más de un día sin jugar
  get streak() {
    const { count, last } = this.s.streak;
    return last === dayKey() || last === yesterdayKey() ? count : 0;
  }
  playedToday() { return this.s.streak.last === dayKey(); }

  // 3 ⭐ a la primera y sin pista · 2 ⭐ con pocos intentos · 1 ⭐ al terminar
  static starsFor({ fails, hint }) {
    if (fails === 0 && !hint) return 3;
    if (fails <= 2) return 2;
    return 1;
  }

  recordWin(i, run) {
    const id = LEVELS[i].id;
    const stars = Progress.starsFor(run);
    const prev = this.s.stars[id] || 0;
    const first = !this.s.done[id];
    let xp;
    if (first) xp = XP_BASE + stars * XP_PER_STAR;
    else if (stars > prev) xp = (stars - prev) * XP_PER_STAR;
    else xp = XP_PRACTICE;

    this.s.done[id] = true;
    this.s.stars[id] = Math.max(prev, stars);
    this.s.xp += xp;

    const st = this.s.streak, today = dayKey();
    const streakUp = st.last !== today;
    if (st.last === yesterdayKey()) st.count += 1;
    else if (st.last !== today) st.count = 1;
    st.last = today;

    this.persist();
    return { stars, best: this.s.stars[id], xp, first, streak: st.count, streakUp, unlockedNext: first && i + 1 < LEVELS.length };
  }

  recordQuiz(i, correct) {
    const id = LEVELS[i].id;
    let xp = 0;
    if (correct && !this.s.quiz[id]) { xp = XP_QUIZ; this.s.xp += xp; }
    if (correct) this.s.quiz[id] = true;
    this.s.onb[id] = true;
    this.persist();
    return xp;
  }

  seenOnboarding(i) { return !!this.s.onb[LEVELS[i].id]; }
  markOnboarding(i) { this.s.onb[LEVELS[i].id] = true; this.persist(); }

  xpPreview(i) {
    return this.isDone(i) ? `+${XP_PRACTICE}` : `+${XP_BASE + 3 * XP_PER_STAR}`;
  }
}
