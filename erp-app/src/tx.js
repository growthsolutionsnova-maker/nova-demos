// Traducción de las herramientas internas (Admin, Dashboard, Lab).
// El texto en español es la clave; DICT trae inglés y portugués.
import { DICT } from './txDict.js';

export function toolLang() {
  try { const l = localStorage.getItem('erp.v1.siteLang'); if (l === 'en' || l === 'pt' || l === 'es') return l; } catch { /* */ }
  const n = (typeof navigator !== 'undefined' && navigator.language || 'es').slice(0, 2);
  return n === 'en' || n === 'pt' ? n : 'es';
}
export function tx(es, vars) {
  const l = toolLang();
  let s = l === 'es' ? es : (DICT[es]?.[l === 'en' ? 0 : 1] ?? es);
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split('{' + k + '}').join(v);
  return s;
}
export const locale = () => ({ es: 'es', en: 'en-US', pt: 'pt-BR' }[toolLang()]);
export const DOWS = () => ({ es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] }[toolLang()]);
