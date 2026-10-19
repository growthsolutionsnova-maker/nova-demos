// Cálculos para Dashboard y Lab. Todo sobre datos seudónimos (sin email).
import { localDateStr } from './util.js';
import { tx } from '../tx.js';
import { colorOf as colorOfCfg, change as chg } from './engine.js';

let LANG = 'es';
const L = (o) => (o && (o[LANG] || o.es || o)) || '';

// ---------- Diccionario de variables (codebook) ----------
export function codebook(config, lang = 'es') {
  LANG = lang;
  const fromKey = (key) => {
    const vals = []; const seen = new Set();
    for (const s of Object.values(config.screens)) if (s.key === key) for (const o of s.options) {
      if (!seen.has(o.code) && o.code !== 'otra') { seen.add(o.code); vals.push({ code: o.code, label: L(o.label) }); }
    }
    for (const a of Object.values(config.after)) if (a.key === key) for (const o of a.options) vals.push({ code: o.code, label: L(o.label) });
    return vals;
  };
  const titleOf = (key) => {
    const s = Object.values(config.screens).find((x) => x.key === key) || Object.values(config.after).find((x) => x.key === key);
    return s ? L(s.prompt) : key;
  };
  const ans = (key, label) => ({ id: key, label, question: titleOf(key), group: 'Respuestas', get: (s) => s.answers?.[key] ?? null, values: fromKey(key) });
  const dows = { es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] }[lang] || ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return [
    ans('animo', tx('Ánimo general')),
    ans('emocion', tx('Emoción')),
    ans('sueno', tx('Sueño')),
    ans('comida', tx('Alimentación')),
    ans('cuerpo', tx('Cuerpo')),
    ans('tema', tx('Tema en la mente')),
    ans('necesidad', tx('Necesidad (reflexión)')),
    ans('fuente_bien', tx('Qué ayudó (días buenos)')),
    ans('ayudo', tx('¿Te ayudó?')),
    ans('animo_final', tx('Ánimo al final')),
    ans('frecuencia', tx('Frecuencia')),
    { id: 'color', label: tx('Color emocional'), group: 'Respuestas', get: (s) => s.answers?.color ?? colorOfCfg(config, s.answers?.emocion), values: Object.entries(config.colors || {}).map(([k, c]) => ({ code: k, label: L(c.name) })) },
    { id: 'cambio', label: tx('Cambio antes → después'), group: 'Motor', get: (s) => chg(s.answers?.animo, s.answers?.animo_final), values: [{ code: 'mejor', label: tx('Mejoró') }, { code: 'igual', label: tx('Igual') }, { code: 'peor', label: tx('Empeoró') }] },
    { id: 'factor', label: tx('Factor probable (regla)'), group: 'Motor', get: (s) => s.factor, values: Object.keys(config.insights).map((k) => ({ code: k, label: k })) },
    { id: 'momento', label: tx('Momento del día'), group: 'Tiempo', get: (s) => (s.hour < 12 ? 'manana' : s.hour < 18 ? 'tarde' : 'noche'), values: [{ code: 'manana', label: tx('Mañana') }, { code: 'tarde', label: tx('Tarde') }, { code: 'noche', label: tx('Noche') }] },
    { id: 'dia_semana', label: tx('Día de la semana'), group: 'Tiempo', get: (s) => String(s.dow), values: [1, 2, 3, 4, 5, 6, 0].map((d) => ({ code: String(d), label: dows[d] })) },
    { id: 'fase_mes', label: tx('Parte del mes'), group: 'Tiempo', get: (s) => (s.dom <= 1 || s.dom >= 27 ? 'fin' : s.dom <= 10 ? 'inicio' : 'medio'), values: [{ code: 'inicio', label: tx('Días 2–10') }, { code: 'medio', label: tx('Días 11–26') }, { code: 'fin', label: tx('Días 27–1') }] },
    { id: 'pais', label: tx('País'), group: 'Perfil', profile: true, get: (s, p) => p?.country ?? null, values: ['CO', 'MX', 'US', 'BR', 'ES', 'OTHER'].map((c) => ({ code: c, label: c })) },
    { id: 'edad', label: tx('Rango de edad'), group: 'Perfil', profile: true, get: (s, p) => p?.age ?? null, values: [{ code: '13_17', label: '13–17' }, { code: '18_29', label: '18–29' }, { code: '30_49', label: '30–49' }, { code: '50_mas', label: '50+' }] },
    { id: 'idioma', label: tx('Idioma'), group: 'Perfil', profile: true, get: (s, p) => p?.lang ?? null, values: [{ code: 'es', label: 'Español' }, { code: 'en', label: 'English' }, { code: 'pt', label: 'Português' }] },
  ];
}

// ---------- Tabla cruzada + chi² ----------
export function crosstab(data, rowVar, colVar) {
  const pmap = new Map(data.profiles.map((p) => [p.pid, p]));
  const rows = rowVar.values.map((v) => v.code), cols = colVar.values.map((v) => v.code);
  const m = rows.map(() => cols.map(() => 0));
  let n = 0;
  for (const s of data.sessions) {
    const p = pmap.get(s.pid);
    const a = rowVar.get(s, p), b = colVar.get(s, p);
    const i = rows.indexOf(a), j = cols.indexOf(b);
    if (i < 0 || j < 0) continue;
    m[i][j]++; n++;
  }
  // quitar filas/columnas vacías
  const ri = rows.map((_, i) => i).filter((i) => m[i].some((x) => x));
  const cj = cols.map((_, j) => j).filter((j) => ri.some((i) => m[i][j]));
  const M = ri.map((i) => cj.map((j) => m[i][j]));
  const rowT = M.map((r) => r.reduce((a, b) => a + b, 0));
  const colT = cj.map((_, j) => M.reduce((a, r) => a + r[j], 0));
  let chi = 0, lowExp = 0;
  M.forEach((r, i) => r.forEach((o, j) => { const e = (rowT[i] * colT[j]) / (n || 1); if (e > 0) chi += ((o - e) ** 2) / e; if (e < 5) lowExp++; }));
  const df = Math.max(1, (ri.length - 1) * (cj.length - 1));
  const p = n ? 1 - gammaP(df / 2, chi / 2) : 1;
  const k = Math.min(ri.length, cj.length);
  const v = n && k > 1 ? Math.sqrt(chi / (n * (k - 1))) : 0;
  return {
    rows: ri.map((i) => rowVar.values[i]), cols: cj.map((j) => colVar.values[j]), m: M, rowT, colT, n,
    chi2: chi, df, p, cramerV: v, lowExpShare: M.length ? lowExp / (M.length * (M[0]?.length || 1)) : 0,
  };
}

function gammaP(a, x) { // gamma incompleta regularizada inferior
  if (x <= 0) return 0;
  if (x < a + 1) { let sum = 1 / a, del = sum, ap = a; for (let n = 0; n < 200; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-12) break; } return sum * Math.exp(-x + a * Math.log(x) - lgamma(a)); }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 200; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-12) break; }
  return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}
function lgamma(z) {
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61503916999185, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  z -= 1; let x = c[0]; for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

// ---------- KPIs del Dashboard ----------
export function kpis(data, days = 30) {
  const now = new Date();
  const since = new Date(now); since.setDate(since.getDate() - days);
  const S = data.sessions.filter((s) => new Date(s.startedAt) >= since);
  const done = S.filter((s) => s.completed);
  const people = new Set(S.map((s) => s.pid));
  const helpedAns = done.filter((s) => s.answers.ayudo);
  const helped = helpedAns.filter((s) => s.answers.ayudo !== 'no').length / (helpedAns.length || 1);
  // retención D1 / D7 sobre personas que empezaron hace al menos 7 días
  const firstBy = new Map();
  for (const s of data.sessions) { const f = firstBy.get(s.pid); if (!f || s.startedAt < f) firstBy.set(s.pid, s.startedAt); }
  const daysBy = new Map();
  for (const s of data.sessions) { if (!daysBy.has(s.pid)) daysBy.set(s.pid, new Set()); daysBy.get(s.pid).add(s.localDate); }
  let c1 = 0, r1 = 0, c7 = 0, r7 = 0;
  for (const [pid, f] of firstBy) {
    const fd = new Date(f); const age = (now - fd) / 86400000;
    const set = daysBy.get(pid);
    const dayN = (n) => { const d = new Date(fd); d.setDate(d.getDate() + n); return localDateStr(d); };
    if (age >= 2) { c1++; if (set.has(dayN(1))) r1++; }
    if (age >= 8) { c7++; if ([5, 6, 7, 8, 9].some((n) => set.has(dayN(n)))) r7++; }
  }
  const weeks = days / 7;
  const reflected = done.filter((s) => s.answers.necesidad).length;
  return {
    people: people.size, sessions: S.length, completed: done.length,
    completion: done.length / (S.length || 1), helped,
    d1: r1 / (c1 || 1), d7: r7 / (c7 || 1), cohort1: c1, cohort7: c7,
    northStar: reflected / (people.size || 1) / weeks,
    crisis: S.filter((s) => s.crisis).length,
    improved: (() => { const w = done.filter((s) => s.answers.animo_final && s.answers.animo !== 'bien'); return w.filter((s) => chg(s.answers.animo, s.answers.animo_final) === 'mejor').length / (w.length || 1); })(),
  };
}

export function dailySeries(data, days = 30) {
  const out = [];
  const byDay = new Map();
  for (const s of data.sessions) { const k = s.localDate; if (!byDay.has(k)) byDay.set(k, { n: 0, people: new Set(), hard: 0 }); const b = byDay.get(k); b.n++; b.people.add(s.pid); if (s.answers.animo === 'mal' || s.answers.animo === 'muy_mal') b.hard++; }
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); const k = localDateStr(d);
    const b = byDay.get(k) || { n: 0, people: new Set(), hard: 0 };
    out.push({ date: k, d, sessions: b.n, people: b.people.size, hard: b.hard });
  }
  return out;
}

export const funnelOrder = ['mood', 'emocion', 'sleep', 'food', 'body', 'mind', 'reflect', '@result'];
export function funnel(data, days = 30) {
  const since = new Date(); since.setDate(since.getDate() - days);
  const S = data.sessions.filter((s) => new Date(s.startedAt) >= since && !s.crisis && s.answers.animo !== 'bien');
  const reached = funnelOrder.map((step) => S.filter((s) => {
    if (step === '@result') return s.completed;
    if (step === 'emocion') return (s.path || []).some((p) => p.startsWith('feel_'));
    return (s.path || []).includes(step);
  }).length);
  return funnelOrder.map((step, i) => ({ step, n: reached[i], rate: reached[i] / (reached[0] || 1) }));
}

export function distribution(data, key, days = 30) {
  const since = new Date(); since.setDate(since.getDate() - days);
  const c = new Map();
  for (const s of data.sessions) { if (new Date(s.startedAt) < since) continue; const v = s.answers?.[key]; if (v) c.set(v, (c.get(v) || 0) + 1); }
  return [...c.entries()].sort((a, b) => b[1] - a[1]);
}

export function hourMatrix(data, days = 30) {
  const since = new Date(); since.setDate(since.getDate() - days);
  const m = [0, 1, 2, 3, 4, 5, 6].map(() => Array(24).fill(0));
  for (const s of data.sessions) if (new Date(s.startedAt) >= since) m[s.dow][s.hour]++;
  return m;
}

// % de check-ins con cierta emoción (o ánimo) por día del mes
export function byDayOfMonth(data, key, codes) {
  const tot = Array(32).fill(0), hit = Array(32).fill(0);
  for (const s of data.sessions) { const v = s.answers?.[key]; if (!v) continue; tot[s.dom]++; if (codes.includes(v)) hit[s.dom]++; }
  return tot.map((t, d) => ({ d, n: t, rate: t ? hit[d] / t : 0 })).slice(1);
}

// ---------- Personas (vista seudónima) ----------
export function people(data) {
  const by = new Map();
  for (const s of data.sessions) { if (!by.has(s.pid)) by.set(s.pid, []); by.get(s.pid).push(s); }
  return data.profiles.map((p) => {
    const ss = (by.get(p.pid) || []).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    return { ...p, sessions: ss, entries: ss.length, first: ss[0]?.startedAt, last: ss[ss.length - 1]?.startedAt, crisis: ss.some((s) => s.crisis) };
  }).filter((p) => p.entries > 0).sort((a, b) => (b.last || '').localeCompare(a.last || ''));
}

// ---------- Exportación ----------
export function toCSV(data, config) {
  const vars = codebook(config);
  const pmap = new Map(data.profiles.map((p) => [p.pid, p]));
  const head = ['pid', 'sid', 'origen', 'fecha', 'hora', 'dia_mes', 'version_flujo', 'completo', 'crisis', ...vars.map((v) => v.id), 'accion', 'accion_hecha', 'versiculo', 'duracion_seg'];
  const esc = (x) => { const s = x == null ? '' : String(x); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const lines = [head.join(',')];
  for (const s of data.sessions) {
    const p = pmap.get(s.pid);
    lines.push([s.pid, s.sid, s.sim ? 'simulado' : 'real', s.localDate, s.hour, s.dom, s.configVersion, s.completed ? 1 : 0, s.crisis ? 1 : 0,
      ...vars.map((v) => v.get(s, p)), s.actionId, s.actionDone == null ? '' : s.actionDone ? 1 : 0, s.verseId, s.durationMs ? Math.round(s.durationMs / 1000) : ''].map(esc).join(','));
  }
  return lines.join('\n');
}

export function codebookCSV(config, lang = 'es') {
  const lines = ['variable,etiqueta,pregunta,codigo,etiqueta_valor'];
  const esc = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
  for (const v of codebook(config, lang)) for (const val of v.values) lines.push([v.id, esc(v.label), esc(v.question || ''), val.code, esc(val.label)].join(','));
  return lines.join('\n');
}

// Sintaxis SPSS opcional: importa el CSV y aplica etiquetas (variables de texto con valores etiquetados).
export function spssSyntax(config, lang = 'es') {
  const vars = codebook(config, lang);
  const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
  let out = `* Importar check-ins exportados desde el Lab.\nGET DATA /TYPE=TXT /FILE='checkins.csv' /DELIMITERS="," /QUALIFIER='"' /FIRSTCASE=2\n /VARIABLES=pid A24 sid A24 origen A10 fecha A10 hora F2.0 dia_mes F2.0 version_flujo F3.0 completo F1.0 crisis F1.0\n`;
  out += vars.map((v) => `  ${v.id} A16`).join('\n') + '\n  accion A16 accion_hecha F1.0 versiculo A16 duracion_seg F4.0.\n\nVARIABLE LABELS\n';
  out += vars.map((v) => `  ${v.id} ${q(v.label)}`).join('\n') + '.\n\n';
  for (const v of vars) {
    out += `VALUE LABELS ${v.id}\n` + v.values.map((val) => `  ${q(val.code)} ${q(val.label)}`).join('\n') + '.\n';
  }
  return out + '\nEXECUTE.\n';
}
