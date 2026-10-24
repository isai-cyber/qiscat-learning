// Servidor del QisCat Learning (sin dependencias, Node 18+)
// - Sirve los archivos del juego
// - POST /api/tutor → "Profe Qubit", tutor con IA (la API key nunca llega al navegador)
//
// Uso:  AI_API_KEY=sk-... node server.js     (o pon la clave en un archivo .env)

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

// Cargar .env simple (KEY=valor)
const envFile = join(ROOT, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const PORT = +process.env.PORT || 8080;
// Cualquier API compatible con /chat/completions
const API_KEY = process.env.AI_API_KEY;
const MODEL = process.env.AI_MODEL || 'deepseek-chat';
const BASE = process.env.AI_BASE_URL || 'https://api.deepseek.com';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8',
};

const SYSTEM_PROMPT = `Eres "Profe Qubit" 🦉, un búho tutor experto en computación cuántica que enseña a niñas y niños de 8 a 12 años dentro del juego "QisCat Learning" (un juego de programación estilo Swift Playgrounds con el gato de Schrödinger, llamado Schrödi).

CÓMO FUNCIONA EL JUEGO (úsalo en tus explicaciones):
- El gato es un qubit: 😴 dormido = |0⟩, 😺 despierto = |1⟩.
- Comandos: avanzar(), girarIzquierda(), girarDerecha(), recogerPez(), for i in 1 ... n { } (bucle),
  aplicarX() (compuerta X: voltea 😴⇄😺), aplicarH() (compuerta Hadamard: superposición, el gato se ve como dos fantasmas),
  medir() (abre la caja: el gato colapsa al azar a 😴 o 😺), entrelazar() (compuerta CNOT con la gemela Qubita).
- Muro cuántico morado ⚛️: solo lo cruzan gatos en superposición (como el efecto túnel).
- Puerta del sol ☀️: solo gatos 😺 al 100%. Puerta de la luna 🌙: solo gatos 😴 al 100%.
- H dos veces regresa al estado original (interferencia).
- La caja 📦 es donde se mide al gato.

TU ESTILO:
- Responde SIEMPRE en español, con frases cortas y palabras sencillas (máximo 5-6 frases o una lista corta).
- Usa analogías de la vida diaria (monedas girando, olas, linternas, gemelos) y algunos emojis.
- Sé cálido, paciente y entusiasta. Celebra los intentos y los errores: equivocarse es parte de aprender.
- Si piden ayuda con el nivel, NO des la solución completa de inmediato: primero haz una pregunta guía o da una pista pequeña. Solo si el niño lo pide de nuevo o lleva varios intentos, muestra el código paso a paso.
- Cuando muestres código, usa exactamente los comandos del juego, en un bloque de código.
- Si el niño pregunta algo de ciencia cuántica real (Schrödinger, Einstein, computadoras cuánticas, qubits reales), explícalo de forma correcta pero simple, sin fórmulas complicadas.
- Mantente en temas de programación, ciencia y el juego. Si preguntan algo no apropiado para niños o fuera de tema, redirige amablemente al juego.
- Nunca pidas datos personales (nombre completo, dirección, escuela, teléfono, fotos).`;

// Límite sencillo: 20 preguntas por minuto por IP
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 20;
}

function readBody(req, max = 32_000) {
  return new Promise((resolve, reject) => {
    let size = 0, data = '';
    req.on('data', c => { size += c.length; if (size > max) { reject(new Error('too big')); req.destroy(); } else data += c; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function contextBlock(ctx = {}) {
  const s = v => String(v ?? '').slice(0, 1500);
  return `CONTEXTO ACTUAL DEL JUEGO (no lo repitas literal, úsalo para ayudar):
- Nivel ${s(ctx.levelNumber)}: "${s(ctx.levelTitle)}"
- Objetivo: ${s(ctx.objective)}
- Pasos sugeridos: ${s(ctx.steps)}
- Comandos disponibles: ${s(ctx.commands)}
- Código actual del niño:
\`\`\`
${s(ctx.code) || '(vacío)'}
\`\`\`
- Estado del gato: ${s(ctx.catState)}
- Peces: ${s(ctx.fish)}
- Último resultado / error: ${s(ctx.lastResult) || 'ninguno'}
- Solución de referencia (NO la muestres salvo que la pidan con insistencia): ${s(ctx.solution)}`;
}

async function tutor(req, res) {
  const ip = req.socket.remoteAddress || '?';
  if (!API_KEY) { res.writeHead(503, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'no_key' })); }
  if (limited(ip)) { res.writeHead(429, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'rate' })); }

  let body;
  try { body = JSON.parse(await readBody(req)); } catch { res.writeHead(400); return res.end(); }

  const history = (Array.isArray(body.messages) ? body.messages : [])
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map(m => ({ role: m.role, content: m.content.slice(0, 800) }));
  if (!history.length || history.at(-1).role !== 'user') { res.writeHead(400); return res.end(); }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: contextBlock(body.context) },
    ...history,
  ];

  let upstream;
  try {
    upstream = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({ model: MODEL, messages, stream: true, temperature: 0.7, max_tokens: 600 }),
    });
  } catch (e) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'upstream' }));
  }
  if (!upstream.ok) {
    console.error('Error de la IA', upstream.status, await upstream.text().catch(() => ''));
    res.writeHead(502, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'upstream', status: upstream.status }));
  }

  // Reenviar solo el texto (stream de texto plano)
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
  const decoder = new TextDecoder();
  let buf = '';
  for await (const chunk of upstream.body) {
    buf += decoder.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content;
        if (delta) res.write(delta);
      } catch { /* línea incompleta */ }
    }
  }
  res.end();
}

async function serveStatic(req, res) {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path === '/') path = '/index.html';
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT) || /\/\.(env|git)/.test(file) || file.endsWith('server.js')) { res.writeHead(403); return res.end(); }
  try {
    if (!(await stat(file)).isFile()) throw 0;
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404); res.end('No encontrado');
  }
}

http.createServer((req, res) => {
  if (req.url.startsWith('/api/tutor')) {
    if (req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ready: !!API_KEY })); }
    if (req.method === 'POST') return tutor(req, res).catch(e => { console.error(e); try { res.end(); } catch {} });
  }
  serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`🐱 QisCat Learning en http://localhost:${PORT}`);
  console.log(API_KEY ? `🦉 Profe Qubit listo (${MODEL})` : '⚠️  Falta AI_API_KEY: el tutor estará dormido.');
});
