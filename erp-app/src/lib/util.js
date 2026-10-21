export { defaultConfig } from './content.js';
export function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const LANGS = ['es', 'en', 'pt', 'ko'];
