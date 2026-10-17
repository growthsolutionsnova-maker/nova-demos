// Conexión con la base de datos real (Supabase).
// Si no hay URL/llave en el build, la app funciona en modo demo (solo navegador).
//
// La app es "offline primero": todo se guarda al instante en el teléfono y una cola
// lo envía a la base cuando hay internet (sirve en el metro, sin señal).
import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_KEY;
export const live = !!(URL && KEY);
export const sb = live ? createClient(URL, KEY, { auth: { persistSession: true, storageKey: 'erp.auth', autoRefreshToken: true } }) : null;

const QKEY = 'erp.v1.outbox';
const SKEY = 'erp.v1.secret';
const mem = {};
const get = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return k in mem ? mem[k] : d; } };
const set = (k, v) => { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* memoria */ } };

export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
export function deviceSecret() {
  let s = get(SKEY, null);
  if (!s) { s = [...crypto.getRandomValues(new Uint8Array(32))].map((x) => x.toString(16).padStart(2, '0')).join(''); set(SKEY, s); }
  return s;
}
export function forgetDevice() { set(SKEY, null); set(QKEY, []); }

// ---------- Cola de envío ----------
export function enqueue(fn, pid, args, key) {
  if (!live || !pid) return;
  const q = get(QKEY, []);
  const item = { id: uuid(), fn, pid, args, key: key || null, tries: 0 };
  const i = key ? q.findIndex((x) => x.key === key) : -1;
  if (i >= 0) q[i] = item; else q.push(item); // la última versión de un check-in reemplaza a la que estaba en cola
  set(QKEY, q);
  flushSoon();
}
let flushing = false, timer = null;
function flushSoon() { clearTimeout(timer); timer = setTimeout(flush, 400); }
export function pending() { return get(QKEY, []).length; }

export async function flush() {
  if (!live || flushing) return;
  flushing = true;
  try {
    for (;;) {
      const q = get(QKEY, []);
      if (!q.length) break;
      const it = q[0];
      const { error } = await sb.rpc(it.fn, { p_pid: it.pid, p_secret: deviceSecret(), ...it.args });
      if (error && !error.code && /fetch|network|failed/i.test(error.message || '')) break; // sin internet
      const q2 = get(QKEY, []);
      const j = q2.findIndex((x) => x.id === it.id);
      if (error) {
        console.warn('[erp] envío falló', it.fn, error.message);
        if (j >= 0) { q2[j].tries = (q2[j].tries || 0) + 1; if (q2[j].tries >= 4) q2.splice(j, 1); }
        set(QKEY, q2);
        if (j >= 0 && q2[j]?.id === it.id) break; // se reintenta más tarde
      } else {
        if (j >= 0) q2.splice(j, 1);
        set(QKEY, q2);
      }
    }
  } catch (e) { console.warn('[erp] cola', e); }
  finally { flushing = false; }
}
if (live && typeof window !== 'undefined') {
  window.addEventListener('online', flushSoon);
  setInterval(flush, 20000);
}

// ---------- Contenido publicado ----------
export async function fetchLatestConfig() {
  if (!live) return null;
  const { data, error } = await sb.from('configs').select('version, content, note, published_at').order('version', { ascending: false }).limit(1);
  if (error || !data?.length) return null;
  const r = data[0];
  return { ...r.content, version: r.version, note: r.note, publishedAt: r.published_at };
}
export async function fetchHistory() {
  if (!live) return [];
  const { data } = await sb.from('configs').select('version, note, published_at, published_by').order('version', { ascending: false }).limit(30);
  return (data || []).map((r) => ({ version: r.version, note: r.note, publishedAt: r.published_at, by: r.published_by }));
}
export async function publishConfig(cfg) {
  const { version, publishedAt, note, ...content } = cfg;
  const { error } = await sb.from('configs').insert({ version, content, note });
  if (error) throw new Error(error.message);
}

// ---------- Equipo ----------
export async function signIn(email, password) {
  const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email o clave incorrectos.' : error.message);
  return currentRole();
}
export async function currentRole() {
  const { data } = await sb.auth.getSession();
  if (!data?.session) return null;
  const { data: role } = await sb.rpc('erp_role');
  return role ? { role, email: data.session.user.email } : { role: null, email: data.session.user.email };
}
export async function signOut() { await sb.auth.signOut(); }

const mapSession = (r) => ({
  sid: r.sid, pid: r.pid, sim: false, startedAt: r.started_at, localDate: r.local_date, hour: r.local_hour, dow: r.dow, dom: r.dom,
  tzOffset: r.tz_offset, tz: r.tz, configVersion: r.config_version, answers: r.answers || {}, path: r.path || [], completed: r.completed,
  lastScreen: r.last_screen, crisis: r.crisis, crisisReason: r.crisis_reason, factor: r.factor, ruleId: r.rule_id, actionId: r.action_id,
  actionDone: r.action_done, verseId: r.verse_id, durationMs: r.duration_ms,
});
const mapProfile = (r) => ({
  pid: r.pid, sim: false, createdAt: r.created_at, lang: r.lang, country: r.country, age: r.age, motive: r.motive,
  reminder: r.reminder, consentData: r.consent_data, consentResearch: r.consent_research,
});
async function all(table, cols, order) {
  const out = []; const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await sb.from(table).select(cols).order(order).range(from, from + page - 1);
    if (error) throw new Error(error.message);
    out.push(...data); if (data.length < page) break;
  }
  return out;
}
// Lo que el rol puede ver (la base decide con RLS: el Lab solo recibe a quienes aceptaron investigación).
export async function fetchTeamData() {
  const [profiles, sessions] = await Promise.all([
    all('profiles', 'pid, created_at, lang, country, age, motive, reminder, consent_data, consent_research', 'created_at'),
    all('sessions', '*', 'started_at'),
  ]);
  return { profiles: profiles.map(mapProfile), sessions: sessions.map(mapSession), answers: [] };
}
