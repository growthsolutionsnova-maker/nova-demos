// Capa de datos. Modo demo: guarda en este navegador (localStorage).
// Misma forma que el esquema de Supabase (supabase/schema.sql) para pasar a modo real en la fase 2.
//   identities  → email (separado; nunca junto a las emociones)
//   profiles    → perfil seudónimo (pid aleatorio)
//   sessions    → cada check-in (hora local, día del mes, versión del flujo…)
//   answers     → cada respuesta como evento (pantalla, código, tiempo)
//   events      → eventos de producto (aperturas, SOS…), separados de lo emocional
import { defaultConfig, localDateStr } from './util.js';
import { simulate } from './sim.js';

const KEY = 'erp.v1.';
const mem = {};
function read(k, fallback) {
  try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : fallback; }
  catch { return k in mem ? mem[k] : fallback; }
}
function write(k, v) {
  mem[k] = v;
  try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch { /* sin almacenamiento: queda en memoria */ }
}

const listeners = new Set();
let version = 0;
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function getVersion() { return version; }
function emit() { version++; listeners.forEach((f) => f()); }

const rid = (p) => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

// ---------- Configuración (contenido editable) ----------
export function getConfig() { return read('config', null) || defaultConfig(); }
export function getDraft() { return read('draft', null) || getConfig(); }
export function saveDraft(cfg) { write('draft', cfg); emit(); }
export function discardDraft() { write('draft', null); emit(); }
export function publishDraft(note) {
  const cur = getConfig();
  const draft = getDraft();
  const next = { ...draft, version: cur.version + 1, publishedAt: new Date().toISOString(), note: note || 'Cambios desde Admin' };
  const hist = read('history', []);
  hist.unshift({ version: cur.version, publishedAt: cur.publishedAt, note: cur.note });
  write('history', hist.slice(0, 30));
  write('config', next);
  write('draft', null);
  emit();
  return next;
}
export function resetConfig() { write('config', null); write('draft', null); write('history', []); emit(); }
export function getHistory() { return read('history', []); }

// ---------- Persona de este dispositivo ----------
export function getMe() { return read('me', null); }
export function createProfile(p) {
  const profile = { pid: rid('p_'), createdAt: new Date().toISOString(), sim: false, ...p };
  write('profiles', [...read('profiles', []), profile]);
  write('me', profile.pid);
  emit();
  return profile;
}
export function updateProfile(pid, patch) {
  write('profiles', read('profiles', []).map((p) => (p.pid === pid ? { ...p, ...patch } : p)));
  emit();
}
export function getProfile(pid) { return read('profiles', []).find((p) => p.pid === pid) || null; }
export function saveIdentity(pid, email) {
  // Tabla aparte: el email nunca se guarda junto a los datos emocionales.
  const ids = read('identities', {}); ids[pid] = { email, at: new Date().toISOString() };
  write('identities', ids); emit();
}
export function getIdentity(pid) { return read('identities', {})[pid] || null; }
export function deleteMyData() {
  const pid = getMe();
  if (!pid) return;
  write('profiles', read('profiles', []).filter((p) => p.pid !== pid));
  write('sessions', read('sessions', []).filter((s) => s.pid !== pid));
  write('answers', read('answers', []).filter((a) => a.pid !== pid));
  write('events', read('events', []).filter((e) => e.pid !== pid));
  const ids = read('identities', {}); delete ids[pid]; write('identities', ids);
  write('me', null);
  emit();
}

// ---------- Check-ins ----------
export function startSession(pid, configVersion) {
  const now = new Date();
  const s = {
    sid: rid('s_'), pid, sim: false, startedAt: now.toISOString(), localDate: localDateStr(now),
    hour: now.getHours(), dow: now.getDay(), dom: now.getDate(), tzOffset: -now.getTimezoneOffset(),
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone, configVersion,
    answers: {}, path: [], completed: false, lastScreen: null, crisis: false,
  };
  write('sessions', [...read('sessions', []), s]); // sin emit: se llama durante el render del check-in
  return s;
}
export function updateSession(sid, patch) {
  write('sessions', read('sessions', []).map((s) => (s.sid === sid ? { ...s, ...patch } : s)));
  emit();
}
export function recordAnswer(sess, screen, key, code, ms, configVersion) {
  const a = { sid: sess.sid, pid: sess.pid, screen, key, code, ms, at: new Date().toISOString(), v: configVersion };
  write('answers', [...read('answers', []), a]);
  const cur = read('sessions', []).find((s) => s.sid === sess.sid) || sess;
  updateSession(sess.sid, { answers: { ...cur.answers, [key]: code }, path: [...(cur.path || []), screen], lastScreen: screen });
}
export function logEvent(pid, type, data = {}) {
  write('events', [...read('events', []), { pid, type, at: new Date().toISOString(), ...data }]);
}

export function mySessions() {
  const pid = getMe();
  return read('sessions', []).filter((s) => s.pid === pid);
}

// ---------- Para Dashboard y Lab ----------
let simCache = null;
export function allData({ includeSim = true } = {}) {
  const real = { profiles: read('profiles', []), sessions: read('sessions', []), answers: read('answers', []) };
  if (!includeSim) return real;
  if (!simCache) simCache = simulate(getConfig());
  return {
    profiles: [...simCache.profiles, ...real.profiles],
    sessions: [...simCache.sessions, ...real.sessions],
    answers: real.answers,
  };
}

// ---------- Accesos (demo) ----------
// En la fase 2 esto lo hace Supabase Auth con roles en la tabla staff_roles.
export const demoAccounts = {
  admin: { email: 'admin@erp.demo', role: 'admin', who: 'Emilia y Queren' },
  dashboard: { email: 'equipo@erp.demo', role: 'team', who: 'Equipo' },
  lab: { email: 'investigacion@erp.demo', role: 'research', who: 'Dra. Emilia' },
};
export function getSessionRole() { return read('role', null); }
export function setSessionRole(r) { write('role', r); emit(); }
