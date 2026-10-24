// Profe Qubit 🦉 — chat con el tutor (DeepSeek a través de /api/tutor)

const $ = id => document.getElementById(id);
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// Markdown mínimo: ```bloques```, `código`, **negritas**
function md(text) {
  const parts = text.split(/```(?:\w+)?\n?/);
  return parts.map((p, i) => i % 2
    ? `<pre><code>${esc(p.replace(/\n$/, ''))}</code></pre>`
    : esc(p).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  ).join('');
}

export class Tutor {
  constructor(getContext) {
    this.getContext = getContext;
    this.history = [];
    this.busy = false;
    this.el = $('tutor');
    this.msgs = $('tutor-msgs');
    $('tutor-close').onclick = () => this.close();
    $('tutor-form').onsubmit = e => {
      e.preventDefault();
      const v = $('tutor-input').value.trim();
      if (v) { $('tutor-input').value = ''; this.ask(v); }
    };
    this.ready = null;
    fetch('/api/tutor').then(r => r.json()).then(j => { this.ready = !!j.ready; this.status(); }).catch(() => { this.ready = false; this.status(); });
  }

  status() {
    $('tutor-status').textContent = this.ready ? 'Tutor cuántico · en línea ✨' : this.ready === false ? 'Durmiendo 😴 (falta configurar DeepSeek)' : 'Conectando…';
  }

  open(question) {
    this.el.classList.remove('hidden');
    if (!this.history.length && !this.msgs.children.length) {
      this.add('bot', '¡Hola! Soy el <b>Profe Qubit</b> 🦉. Sé muchísimo de gatos cuánticos, qubits y compuertas. ¿En qué te ayudo?', true);
    }
    this.suggest();
    if (question) this.ask(question);
    else setTimeout(() => $('tutor-input').focus(), 50);
  }
  close() { this.el.classList.add('hidden'); }
  toggle() { this.el.classList.contains('hidden') ? this.open() : this.close(); }

  suggest() {
    const ctx = this.getContext();
    const opts = ['¿Qué es un qubit?', 'Ayúdame con mi código 🧩', '¿Por qué el gato se ve como dos fantasmas?', '¿Qué es una computadora cuántica?'];
    if (ctx.lastResult && !/Lo lograste/.test(ctx.lastResult)) opts.unshift('¿Por qué falló mi código?');
    if (/entrel/i.test(ctx.objective)) opts.push('¿Qué es el entrelazamiento?');
    const box = $('tutor-suggest');
    box.innerHTML = '';
    opts.slice(0, 4).forEach(q => {
      const b = document.createElement('button');
      b.textContent = q;
      b.onclick = () => this.ask(q);
      box.appendChild(b);
    });
  }

  add(role, html, raw = false) {
    const d = document.createElement('div');
    d.className = `msg ${role}`;
    d.innerHTML = raw ? html : md(html);
    this.msgs.appendChild(d);
    this.msgs.scrollTop = this.msgs.scrollHeight;
    return d;
  }

  async ask(q) {
    if (this.busy) return;
    this.busy = true;
    this.add('me', q);
    this.history.push({ role: 'user', content: q });
    const bubble = this.add('bot', '');
    bubble.classList.add('typing');
    let text = '';
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: this.history, context: this.getContext() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.status);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        bubble.innerHTML = md(text);
        this.msgs.scrollTop = this.msgs.scrollHeight;
      }
      if (!text) throw new Error('empty');
      this.history.push({ role: 'assistant', content: text });
    } catch (e) {
      this.history.pop();
      const m = String(e.message);
      bubble.innerHTML = m === 'no_key'
        ? '😴 El Profe Qubit está dormido: la persona adulta que instaló el juego debe poner la clave <code>DEEPSEEK_API_KEY</code> en el servidor. Mientras tanto, prueba el botón <b>Pista</b> o toca las palabras azules.'
        : m === 'rate'
          ? '🦉 ¡Uf, muchas preguntas seguidas! Espera un minutito y vuelve a preguntar.'
          : '🦉 No pude conectarme. Revisa que el juego esté abierto con <code>node server.js</code> y que haya internet.';
    } finally {
      bubble.classList.remove('typing');
      this.busy = false;
      this.suggest();
    }
  }
}
