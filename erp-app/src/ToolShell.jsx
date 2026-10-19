import React from 'react';
import * as store from './lib/store.js';
import { tx, toolLang } from './tx.js';
import { Icon } from './app/icons.jsx';

// Íconos dibujados en vez de emojis.
const EMO = { '⭐': 'star', '🔁': 'repeat', '💜': 'heart', '🌎': 'globe', '🛟': 'lifebuoy', '🔀': 'flow', '📅': 'calendar', '🧑‍🤝‍🧑': 'people', '⬇️': 'download', '📖': 'book', '🧩': 'flow', '💡': 'sparkle', '⚡': 'bolt', '🕓': 'history', '🛠️': 'pencil', '📊': 'chart', '🔬': 'flask', '🐛': 'leaf' };
const Ic = ({ e }) => <Icon name={EMO[e] || 'dots'} size={20} />;

const AREAS = () => [
  ['admin', '🛠️', 'Admin', tx('Contenido y flujos')],
  ['dashboard', '📊', 'Dashboard', tx('Producto y negocio')],
  ['lab', '🔬', 'Lab', tx('Investigación')],
];

export default function ToolShell({ area, sections, section, onSection, children }) {
  return (
    <div className="tool">
      <aside>
        <div className="brand">
          <svg viewBox="0 0 48 40" width="40" height="34" aria-hidden>
            <path d="M23 20 C14 4 1 4 3 14 C4 22 14 23 23 21Z" style={{ fill: 'var(--wing)' }} />
            <path d="M25 20 C34 4 47 4 45 14 C44 22 34 23 25 21Z" style={{ fill: 'var(--wing)' }} />
            <path d="M23 22 C15 24 9 31 13 36 C17 39 22 31 23 24Z" style={{ fill: 'var(--coral)' }} />
            <path d="M25 22 C33 24 39 31 35 36 C31 39 26 31 25 24Z" style={{ fill: 'var(--coral)' }} />
            <rect x="22" y="12" width="4" height="22" rx="2" style={{ fill: 'var(--ink)' }} />
          </svg>
          <div><b>Emotional Reconstruction</b><small>{store.live ? tx('Piloto') : tx('Demo fase 1')} · {AREAS().find((a) => a[0] === area)?.[2]}</small></div>
        </div>
        <div className="segm" role="group" aria-label="Idioma / Language" style={{ alignSelf: 'flex-start', marginBottom: 10 }}>{[['es', 'ES', 'Español'], ['en', 'EN', 'English'], ['pt', 'PT', 'Português']].map(([c, l, full]) => <button key={c} title={full} aria-label={full} className={toolLang() === c ? 'on' : ''} onClick={() => store.setSiteLang(c)} aria-pressed={toolLang() === c}>{l}</button>)}</div>
        {sections.map(([k, e, label, cnt]) => (
          <button key={k} className={'navi' + (section === k ? ' on' : '')} onClick={() => onSection(k)} aria-current={section === k}>
            <Ic e={e} />{label}{cnt != null && <span className="cnt">{cnt}</span>}
          </button>
        ))}
        <div className="sep" />
        {AREAS().filter((a) => a[0] !== area).map(([k, e, label, sub]) => (
          <a key={k} className="navi" href={'#' + k} style={{ textDecoration: 'none' }}><Ic e={e} /><span>{label}<br /><small style={{ fontWeight: 400 }}>{sub}</small></span></a>
        ))}
        <a className="navi" href="#app" style={{ textDecoration: 'none' }}><Ic e="🐛" />{tx('Ver la app')}</a>
        <div style={{ flex: 1 }} />
        <div className="aside-foot" style={{ fontSize: '0.78rem', color: 'var(--ink-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>{tx('Sesión')}: {store.live ? store.getStaffEmail() : store.demoAccounts[area]?.email}</span>
          <a href="#" onClick={() => store.staffSignOut()} style={{ color: 'inherit' }}>{tx('Cerrar sesión')}</a>
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
}
