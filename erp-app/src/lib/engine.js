import { tx } from '../tx.js';
// Motor genérico: navega el grafo de pantallas, evalúa reglas y detecta crisis.
// No sabe nada de "emociones": todo viene de la configuración (datos).

export function nextStep(config, screenId, code) {
  const s = config.screens[screenId];
  if (!s) return '@result';
  const opt = (s.options || []).find((o) => o.code === code);
  return (opt && opt.next) || s.next || '@result';
}

export function evaluate(config, answers, recentVerseIds = []) {
  let best = null;
  for (const r of config.rules) {
    const ok = Object.entries(r.when).every(([k, codes]) => codes.includes(answers[k]));
    if (ok && (!best || r.weight > best.weight)) best = r;
  }
  const factor = best ? best.factor : 'ninguno';
  const emotion = answers.emocion || null;
  const actionId = config.actionByEmotion[emotion] || 'respirar';
  const verse = pickVerse(config, emotion, recentVerseIds);
  return { factor, ruleId: best ? best.id : null, emotion, actionId, verseId: verse ? verse.id : null };
}

export function pickVerse(config, emotion, recent = []) {
  const pool = config.verses.filter((v) => v.emotions.includes(emotion));
  const all = pool.length ? pool : config.verses;
  const fresh = all.filter((v) => !recent.includes(v.id));
  const list = fresh.length ? fresh : all;
  return list[Math.floor(Math.random() * list.length)];
}

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function detectCrisis(config, text) {
  const n = norm(text);
  if (!n.trim()) return false;
  return config.crisisKeywords.some((k) => n.includes(norm(k)));
}

// Hojas: 1 por check-in completado, máximo 2 por día (mañana / tarde-noche).
// Premia la constancia, no la velocidad, y nunca se pierden.
export function leavesFrom(sessions) {
  const slots = new Set();
  for (const s of sessions) if (s.completed) slots.add(s.localDate + (s.hour < 15 ? 'am' : 'pm'));
  return slots.size;
}

export function stageFor(config, leaves) {
  let idx = 0;
  config.stages.forEach((st, i) => { if (leaves >= st.min) idx = i; });
  const cur = config.stages[idx];
  const nxt = config.stages[idx + 1];
  const progress = nxt ? (leaves - cur.min) / (nxt.min - cur.min) : 1;
  return { index: idx, stage: cur, next: nxt, progress, leaves };
}

// Días cuidándote en los últimos 7 (racha compasiva: no se "rompe").
export function careDays(sessions, today = new Date()) {
  const days = new Set(sessions.filter((s) => s.completed).map((s) => s.localDate));
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (days.has(localDate(d))) n++;
  }
  return n;
}

export function localDate(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// Validación del grafo para el Admin.
export function validateConfig(config) {
  const issues = [];
  const ids = new Set(Object.keys(config.screens));
  const langs = ['es', 'en', 'pt', 'ko'];
  for (const [id, s] of Object.entries(config.screens)) {
    if (!s.options || s.options.length < 1) issues.push({ level: 'error', where: id, msg: tx('La pantalla no tiene opciones.') });
    if (s.options && s.options.length > 4) issues.push({ level: 'error', where: id, msg: tx('Máximo 4 opciones por pantalla.') });
    for (const l of langs) if (!s.prompt?.[l]?.trim()) issues.push({ level: 'warn', where: id, msg: tx('Falta la pregunta en {l}.', { l: l.toUpperCase() }) });
    const codes = new Set();
    for (const o of s.options || []) {
      if (codes.has(o.code)) issues.push({ level: 'error', where: id, msg: tx('Código repetido: {c}', { c: o.code }) });
      codes.add(o.code);
      for (const l of langs) if (!o.label?.[l]?.trim()) issues.push({ level: 'warn', where: id, msg: tx('Opción "{c}" sin texto en {l}.', { c: o.code, l: l.toUpperCase() }) });
      if (o.next && !o.next.startsWith('@') && !ids.has(o.next)) issues.push({ level: 'error', where: id, msg: tx('La opción "{c}" lleva a una pantalla que no existe ({n}).', { c: o.code, n: o.next }) });
    }
    if (s.next && !s.next.startsWith('@') && !ids.has(s.next)) issues.push({ level: 'error', where: id, msg: tx('Siguiente pantalla inexistente: {n}', { n: s.next }) });
  }
  return issues;
}

// ---------- Código de colores ----------
export function colorOf(config, emotion) {
  if (!emotion) return null;
  for (const s of Object.values(config.screens)) if (s.key === 'emocion') {
    const o = s.options.find((x) => x.code === emotion);
    if (o && o.color) return o.color;
  }
  return null;
}
export function emotionOption(config, emotion) {
  for (const s of Object.values(config.screens)) if (s.key === 'emocion') {
    const o = s.options.find((x) => x.code === emotion);
    if (o) return o;
  }
  return null;
}

// ---------- Antes y después ----------
export const MOOD_RANK = { muy_mal: 0, mal: 1, regular: 2, bien: 3 };
export function change(before, after) {
  if (!(before in MOOD_RANK) || !(after in MOOD_RANK)) return null;
  const d = MOOD_RANK[after] - MOOD_RANK[before];
  return d > 0 ? 'mejor' : d < 0 ? 'peor' : 'igual';
}

// ---------- 3 sugerencias ----------
export function suggestFor(config, answers) {
  const out = [];
  for (const r of config.suggestionRules || []) {
    const ok = Object.entries(r.when).every(([k, codes]) => codes.includes(answers[k]));
    if (ok && !out.includes(r.id) && config.suggestions[r.id]) out.push(r.id);
  }
  for (const d of config.suggestionDefaults || []) if (out.length < 3 && !out.includes(d)) out.push(d);
  return out.slice(0, 3);
}
