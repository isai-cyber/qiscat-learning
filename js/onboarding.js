// Introducción de nivel estilo Duolingo: diapositivas + mini quiz
import { sfx } from './audio.js';

const $ = id => document.getElementById(id);
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// level: objeto de LEVELS · data: ONBOARDING[id] · unit: UNITS[chapter] · rich: formateador de texto
// onQuiz(correct) → XP ganados. Devuelve una promesa que se resuelve al terminar o cerrar.
export function showOnboarding({ level, index, data, unit, rich, onQuiz }) {
  return new Promise(resolve => {
    const root = $('onb');
    root.style.setProperty('--unit', unit.color);
    root.style.setProperty('--unit-dark', unit.dark);
    const slides = [
      ...data.slides,
      { quiz: data.quiz },
      { final: true },
    ];
    let k = 0, picked = null, checked = false;

    root.innerHTML = `
      <div class="onb-top">
        <button class="onb-x" title="Saltar introducción">✕</button>
        <div class="onb-bar"><i></i></div>
        <span class="onb-lvl">Nivel ${index + 1}</span>
      </div>
      <div class="onb-body"></div>
      <div class="onb-foot"><div class="onb-fb"></div><button class="onb-btn">Continuar</button></div>`;
    const body = root.querySelector('.onb-body');
    const btn = root.querySelector('.onb-btn');
    const fb = root.querySelector('.onb-fb');
    const foot = root.querySelector('.onb-foot');
    root.classList.remove('hidden');

    const close = result => {
      root.classList.add('hidden');
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };
    root.querySelector('.onb-x').onclick = () => close({ skipped: true });

    function render() {
      const s = slides[k];
      root.querySelector('.onb-bar i').style.width = `${(k / (slides.length - 1)) * 100}%`;
      foot.className = 'onb-foot';
      fb.innerHTML = '';
      btn.disabled = false;
      btn.textContent = 'Continuar';
      picked = null; checked = false;

      if (s.talk) {
        body.innerHTML = `
          <div class="onb-talk">
            <div class="onb-owl">🦉</div>
            <div class="onb-bubble">${rich(s.talk)}</div>
          </div>
          <div class="onb-art">${s.art || ''}</div>`;
      } else if (s.cmds) {
        body.innerHTML = `
          <h2 class="onb-h">✨ ¡Comando nuevo!</h2>
          <div class="onb-cmds">${s.cmds.map(c => `<span class="onb-cmd">${esc(c)}</span>`).join('')}</div>
          <p class="onb-p">${rich(s.text)}</p>`;
      } else if (s.quiz) {
        const q = s.quiz;
        const opts = shuffle(q.options.map((t, i) => ({ t, ok: i === q.answer })));
        body.innerHTML = `
          <h2 class="onb-h">Pregunta rápida</h2>
          <p class="onb-q">${esc(q.q).replace(/\n/g, '<br>')}</p>
          <div class="onb-opts">${opts.map((o, i) => `<button class="onb-opt" data-i="${i}"><span class="onb-key">${i + 1}</span><span class="onb-ot">${esc(o.t).replace(/\n/g, '<br>')}</span></button>`).join('')}</div>`;
        btn.textContent = 'Comprobar';
        btn.disabled = true;
        body.querySelectorAll('.onb-opt').forEach(b => b.onclick = () => {
          if (checked) return;
          sfx.tap();
          body.querySelectorAll('.onb-opt').forEach(x => x.classList.toggle('sel', x === b));
          picked = opts[+b.dataset.i];
          btn.disabled = false;
        });
        s._opts = opts;
      } else if (s.final) {
        body.innerHTML = `
          <div class="onb-final">
            <div class="onb-icon">${data.icon}</div>
            <h2 class="onb-h">¡Ahora te toca a ti!</h2>
            <p class="onb-p"><b>Objetivo:</b> ${rich(level.objective)}</p>
          </div>`;
        btn.textContent = '¡A programar!';
      }
    }

    function next() {
      const s = slides[k];
      if (s.quiz && !checked) {
        if (!picked) return;
        checked = true;
        const xp = onQuiz(picked.ok);
        body.querySelectorAll('.onb-opt').forEach((b, i) => {
          if (s._opts[i].ok) b.classList.add('ok');
          else if (s._opts[i] === picked) b.classList.add('bad');
        });
        if (picked.ok) {
          sfx.fish();
          foot.className = 'onb-foot good';
          fb.innerHTML = `<b>¡Excelente!${xp ? ` +${xp} XP` : ''}</b><span>${esc(s.quiz.explain)}</span>`;
        } else {
          sfx.fail();
          foot.className = 'onb-foot bad';
          const right = s._opts.find(o => o.ok).t.replace(/\n/g, ' ');
          fb.innerHTML = `<b>Respuesta correcta: ${esc(right)}</b><span>${esc(s.quiz.explain)}</span>`;
        }
        btn.textContent = 'Continuar';
        return;
      }
      sfx.tap();
      if (k === slides.length - 1) return close({ skipped: false });
      k++;
      render();
    }
    btn.onclick = next;

    function onKey(e) {
      if (e.key === 'Enter') { e.preventDefault(); if (!btn.disabled) next(); }
      else if (e.key === 'Escape') close({ skipped: true });
      else if (/^[1-4]$/.test(e.key)) body.querySelector(`.onb-opt[data-i="${+e.key - 1}"]`)?.click();
    }
    document.addEventListener('keydown', onKey);
    render();
  });
}
