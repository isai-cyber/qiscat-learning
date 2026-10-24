// Progreso y gamificación: desbloqueo, estrellas, XP y racha diaria
import { LEVELS } from './levels.js';
import { CHALLENGES } from './challenges-data.js';

export const DAILY_GOAL = 30; // XP por día

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
    save.chal ||= {};
    save.ml ||= {};       // lecciones de Machine Learning cuántico terminadas
    save.tut ||= {};      // tutoriales del laboratorio vistos
    save.daily ||= { day: null, xp: 0, bonus: null };
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
    this.gain(xp);

    const { count: streak, up: streakUp } = this.touchStreak();
    this.persist();
    return { stars, best: this.s.stars[id], xp, first, streak, streakUp, unlockedNext: first && i + 1 < LEVELS.length };
  }

  // Suma XP total y del día (para la meta diaria)
  gain(xp) {
    this.s.xp += xp;
    const d = this.s.daily, today = dayKey();
    if (d.day !== today) { d.day = today; d.xp = 0; d.bonus = null; }
    d.xp += xp;
  }
  get todayXp() { return this.s.daily.day === dayKey() ? this.s.daily.xp : 0; }

  // Reto del día: un desafío desbloqueado distinto cada día (XP doble una vez)
  dailyChallenge(unlockedIds) {
    const pool = CHALLENGES.filter(c => unlockedIds.includes(c.id));
    if (!pool.length) return null;
    const k = [...dayKey()].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
    return pool[k % pool.length];
  }
  dailyClaimed() { return this.s.daily.day === dayKey() && this.s.daily.bonus; }

  // Lecciones de ML y tutoriales
  mlDone(id) { return this.s.ml[id]; }
  recordMl(id, stars) {
    const prev = this.s.ml[id];
    const xp = prev ? (stars > prev.stars ? 5 : 3) : 15 + stars * 5;
    this.s.ml[id] = { stars: Math.max(prev?.stars || 0, stars) };
    this.gain(xp);
    this.touchStreak();
    this.persist();
    return { xp, first: !prev };
  }
  tutSeen(id) { return !!this.s.tut[id]; }
  markTut(id) { if (!this.s.tut[id]) { this.s.tut[id] = true; this.gain(5); this.touchStreak(); this.persist(); } }

  // Jugar hoy suma a la racha (una vez por día)
  touchStreak() {
    const st = this.s.streak, today = dayKey();
    const up = st.last !== today;
    if (st.last === yesterdayKey()) st.count += 1;
    else if (st.last !== today) st.count = 1;
    st.last = today;
    return { count: st.count, up };
  }

  // ---------- desafíos ----------
  chal(id) { return this.s.chal[id]; }
  // stars: en Python según las líneas usadas; en quiz 3 = a la primera, 1 = después de fallar
  recordChallenge(c, stars) {
    const prev = this.s.chal[c.id];
    const base = { python: 10, quiz: 5, blocks: 10 }[c.type];
    let xp;
    if (!prev) xp = c.type === 'quiz' ? (stars === 3 ? 5 : 2) : base + (stars === 3 ? 5 : 0);
    else xp = stars > prev.stars ? 5 : 0;
    this.s.chal[c.id] = { stars: Math.max(prev?.stars || 0, stars) };
    // XP doble si es el reto del día (una vez por día)
    let bonus = 0;
    if (c.id === this.dailyId && !this.dailyClaimed()) { bonus = Math.max(xp, 10); }
    this.gain(xp + bonus);
    if (bonus) this.s.daily.bonus = c.id;
    xp += bonus;
    this.touchStreak();
    this.persist();
    return { xp, first: !prev, bonus };
  }

  recordQuiz(i, correct) {
    const id = LEVELS[i].id;
    let xp = 0;
    if (correct && !this.s.quiz[id]) { xp = XP_QUIZ; this.gain(xp); }
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
