import React, { useEffect, useMemo, useState } from 'react';
import * as store from '../lib/store.js';
import { useStore } from '../app/App.jsx';
import { kpis, dailySeries, funnel, distribution, hourMatrix } from '../lib/analytics.js';
import ToolShell from '../ToolShell.jsx';
import { Bars, HBars, heatBg } from '../charts.jsx';
import { tx, toolLang, DOWS } from '../tx.js';

const pct = (v) => `${Math.round(v * 100)}%`;
const STEP_LABEL = () => ({ mood: tx('Ánimo'), emocion: tx('Emoción'), sleep: tx('Sueño'), food: tx('Comida'), body: tx('Cuerpo'), mind: tx('Tema'), reflect: tx('Reflexión'), '@result': tx('Resultado') });

export default function Dashboard() {
  useStore();
  const config = store.getConfig();
  const lang = toolLang();
  const [days, setDays] = useState(30);
  const [sim, setSim] = useState(!store.live || store.isDemoView());
  useEffect(() => { store.refreshTeamData(); }, []);
  const st = store.teamStatus();
  const [sec, setSec] = useState('resumen');
  const data = useMemo(() => store.allData({ includeSim: sim }), [sim, store.getVersion()]); // eslint-disable-line
  const k = kpis(data, days);
  const series = dailySeries(data, days);
  const fun = funnel(data, days);
  const emoOpt = (code) => { for (const s of Object.values(config.screens)) if (s.key === 'emocion') { const o = s.options.find((x) => x.code === code); if (o) return o; } return null; };
  const emoLabel = (code) => { const o = emoOpt(code); return o ? (o.label[lang] || o.label.es) : code; };
  const emoColor = (code) => config.colors?.[emoOpt(code)?.color]?.hex;
  const cols = distribution(data, 'color', days);
  const totalCol = cols.reduce((a, b) => a + b[1], 0) || 1;
  const emos = distribution(data, 'emocion', days);
  const totalEmo = emos.reduce((a, b) => a + b[1], 0) || 1;
  const hm = hourMatrix(data, days);
  const hmMax = Math.max(1, ...hm.flat());
  const since = new Date(); since.setDate(since.getDate() - days);
  const S = data.sessions.filter((s) => new Date(s.startedAt) >= since);
  const pmap = new Map(data.profiles.map((p) => [p.pid, p]));
  const countBy = (fn) => { const c = new Map(); const seen = new Set(); S.forEach((s) => { if (seen.has(s.pid)) return; seen.add(s.pid); const v = fn(pmap.get(s.pid)); if (v) c.set(v, (c.get(v) || 0) + 1); }); return [...c.entries()].sort((a, b) => b[1] - a[1]); };
  const byCountry = countBy((p) => p?.country);
  const byAge = countBy((p) => p?.age);
  const byLang = countBy((p) => p?.lang);
  const helpedBy = (() => {
    const c = new Map();
    S.filter((s) => s.completed && s.actionId && s.answers.ayudo).forEach((s) => { const x = c.get(s.actionId) || { n: 0, y: 0 }; x.n++; if (s.answers.ayudo === 'si') x.y++; c.set(s.actionId, x); });
    return [...c.entries()].map(([a, x]) => ({ label: `${config.actions[a]?.title[lang] || config.actions[a]?.title.es || a}`, value: x.y / x.n, n: x.n })).sort((a, b) => b.value - a.value);
  })();
  const realCount = data.sessions.filter((s) => !s.sim).length;
  const crisisReasons = distribution({ sessions: S.filter((s) => s.crisis).map((s) => ({ ...s, answers: { r: s.crisisReason } })) }, 'r', days);
  const go = (id) => { setSec(id); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  return (
    <ToolShell area="dashboard" section={sec} onSection={go} sections={[['resumen', '⭐', tx('Resumen')], ['retencion', '🔁', tx('Uso y embudo')], ['emociones', '💜', tx('Emociones')], ['audiencia', '🌎', tx('Audiencia')], ['seguridad', '🛟', tx('Seguridad')]]}>
      <div className="head">
        <div><h1>Dashboard</h1><p>{tx('¿La gente vuelve y se siente mejor? Todo agregado y sin emails.')}</p></div>
        <div className="ctrl">
          <div className="segm" role="group" aria-label={tx('Periodo')}>{[7, 30, 60].map((d) => <button key={d} className={days === d ? 'on' : ''} onClick={() => setDays(d)}>{tx('{n} días', { n: d })}</button>)}</div>
          <label className="toggle"><input type="checkbox" id="dash-sim" checked={sim} onChange={(e) => setSim(e.target.checked)} /> {tx('Incluir datos simulados')}</label>
        </div>
      </div>
      <LiveBar st={st} realCount={realCount} />
      {sim ? <div className="note warn">{tx('Estás viendo datos simulados para mostrar cómo se verá el dashboard, sumados a los {n} check-ins reales. Desmarca la casilla para ver solo los reales.', { n: realCount })}</div>
        : !store.live && <div className="note">{tx('Solo datos de este navegador ({n} check-ins).', { n: realCount })}</div>}

      <section id="resumen" className="kpis">
        <div className="kpi star"><span className="v">{k.northStar.toFixed(1)}</span><span className="l">{tx('Check-ins con reflexión por persona activa / semana')} <b>(North Star)</b></span></div>
        <div className="kpi"><span className="v">{k.people}</span><span className="l">{tx('Personas activas')}</span></div>
        <div className="kpi"><span className="v">{k.sessions}</span><span className="l">{tx('Check-ins iniciados')}</span></div>
        <div className="kpi"><span className="v">{pct(k.completion)}</span><span className="l">{tx('Completan el check-in')}</span></div>
        <div className="kpi"><span className="v">{pct(k.improved)}</span><span className="l">{tx('Se sienten mejor al final (antes → después)')}</span></div>
        <div className="kpi"><span className="v">{pct(k.helped)}</span><span className="l">{tx('Dicen que les ayudó (sí o un poco)')}</span></div>
        <div className="kpi"><span className="v">{pct(k.d1)}</span><span className="l">{tx('Vuelven al día siguiente (D1, n={n})', { n: k.cohort1 })}</span></div>
        <div className="kpi"><span className="v">{pct(k.d7)}</span><span className="l">{tx('Siguen a la semana (D7, n={n})', { n: k.cohort7 })}</span></div>
      </section>

      <section id="retencion" className="grid2">
        <div className="panel">
          <h2>{tx('Check-ins por día')}</h2>
          <div className="sub">{tx('Barras: check-ins · línea: personas distintas')}</div>
          <Bars data={series.map((d) => ({ label: d.d.getDate(), value: d.sessions, people: d.people }))} line="people" labelEvery={days > 30 ? 7 : days > 7 ? 3 : 1} ariaLabel={tx('Check-ins por día')} />
        </div>
        <div className="panel">
          <h2>{tx('¿Dónde abandonan?')}</h2>
          <div className="sub">{tx('% de check-ins (días difíciles) que llegan a cada pantalla')}</div>
          <Bars data={fun.map((f, i) => ({ label: STEP_LABEL()[f.step], value: Math.round(f.rate * 100), color: i && fun[i - 1].rate - f.rate > 0.025 ? 'var(--coral)' : 'var(--leaf)' }))} fmt={(v) => v + '%'} ariaLabel={tx('¿Dónde abandonan?')} />
          <div className="sub">{tx('En coral: pasos donde se pierde más de 2,5 puntos. Ahí revisamos la pregunta.')}</div>
        </div>
      </section>

      <section id="emociones" className="grid2">
        <div className="panel">
          <h2>{tx('Emociones registradas')}</h2>
          <HBars items={emos.slice(0, 16).map(([c, n]) => ({ label: emoLabel(c), value: n / totalEmo, color: emoColor(c) }))} fmt={pct} />
        </div>
        <div className="panel">
          <h2>{tx('Código de colores')}</h2>
          <div className="sub">{tx('Cada color acompaña a una emoción. Sirve para ver patrones, no diagnostica.')}</div>
          <HBars items={cols.map(([c, n]) => ({ label: (config.colors[c]?.name[lang] || c), value: n / totalCol, color: config.colors[c]?.hex }))} fmt={pct} />
        </div>
        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <h2>{tx('¿Qué acción ayuda más?')}</h2>
          <div className="sub">{tx('% que responde "sí, me ayudó" después de cada acción')}</div>
          <HBars items={helpedBy.map((h) => ({ label: h.label, value: h.value }))} fmt={pct} color="var(--leaf)" />
        </div>
        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <h2>{tx('¿A qué hora entran?')}</h2>
          <div className="sub">{tx('Check-ins por día de la semana y hora local. Ayuda a elegir la hora de las notificaciones.')}</div>
          <div className="tbl-wrap">
            <table className="tbl heat" style={{ fontSize: '0.72rem' }}>
              <thead><tr><th></th>{Array.from({ length: 24 }, (_, h) => <th key={h} className="r" style={{ padding: '4px 2px', textAlign: 'center' }}>{h}</th>)}</tr></thead>
              <tbody>{[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <tr key={d}><th>{DOWS()[d]}</th>{hm[d].map((v, h) => <td key={h} title={`${v} check-ins`} style={{ ...heatBg(v / hmMax), padding: 0, height: 22, minWidth: 22, borderBottom: '2px solid var(--paper)', borderRight: '2px solid var(--paper)' }} />)}</tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="audiencia" className="grid3">
        <div className="panel"><h2>{tx('País')}</h2><HBars items={byCountry.map(([c, n]) => ({ label: c, value: n }))} /></div>
        <div className="panel"><h2>{tx('Edad')}</h2><HBars items={byAge.map(([c, n]) => ({ label: c.replace('_mas', '+').replace('_', '–'), value: n }))} /></div>
        <div className="panel"><h2>{tx('Idioma')}</h2><HBars items={byLang.map(([c, n]) => ({ label: { es: 'Español', en: 'English', pt: 'Português', ko: '한국어' }[c], value: n }))} /></div>
      </section>

      <section id="seguridad" className="panel">
        <h2>{tx('Protocolo de crisis')}</h2>
        <div className="kpis">
          <div className="kpi"><span className="v">{k.crisis}</span><span className="l">{tx('Veces que se mostró ayuda de crisis ({n} días)', { n: days })}</span></div>
          {crisisReasons.map(([r, n]) => <div className="kpi" key={r}><span className="v">{n}</span><span className="l">{{ no_seguro: tx('No sabe si está a salvo'), hacerme_dano: tx('Piensa en hacerse daño'), me_hacen_dano: tx('Alguien le hace daño'), texto: tx('Palabras de alerta en texto') }[r] || r}</span></div>)}
        </div>
        <div className="note">{tx('Aquí solo se ven cantidades. Quién vio la pantalla de crisis no aparece en el dashboard. Para el piloto, definir con el clínico revisor si alguien del equipo hace seguimiento y con qué consentimiento.')}</div>
      </section>
    </ToolShell>
  );
}

export function LiveBar({ st, realCount }) {
  if (!store.live) return null;
  if (store.isDemoView()) return (
    <div className="note warn ctrl" style={{ justifyContent: 'space-between' }}>
      <span>{tx('Modo demostración: solo datos simulados. Los datos reales del piloto se ven entrando con una cuenta del equipo.')}</span>
      <a className="btn small ghost" href="#" onClick={() => store.staffSignOut()}>{tx('Entrar con mi cuenta')}</a>
    </div>
  );
  return (
    <div className="note ctrl" style={{ justifyContent: 'space-between', background: st.error ? 'var(--coral-soft)' : 'var(--leaf-soft)' }}>
      <span>{st.loading ? tx('Cargando datos de la base…') : st.error ? tx('No se pudieron cargar los datos: {e}', { e: st.error }) : <>🟢 {tx('Base de datos real · {n} check-ins de personas reales', { n: realCount })}</>}</span>
      <button className="btn small ghost" onClick={() => store.refreshTeamData()} disabled={st.loading}>{tx('Actualizar')}</button>
    </div>
  );
}
