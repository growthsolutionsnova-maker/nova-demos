import React, { useMemo, useState } from 'react';
import * as store from '../lib/store.js';
import { useStore } from '../app/App.jsx';
import { kpis, dailySeries, funnel, distribution, hourMatrix } from '../lib/analytics.js';
import ToolShell from '../ToolShell.jsx';
import { Bars, HBars, heatBg } from '../charts.jsx';

const pct = (v) => `${Math.round(v * 100)}%`;
const STEP_LABEL = { mood: 'Ánimo', emocion: 'Emoción', sleep: 'Sueño', food: 'Comida', body: 'Cuerpo', mind: 'Tema', reflect: 'Reflexión', '@result': 'Resultado' };

export default function Dashboard() {
  useStore();
  const config = store.getConfig();
  const [days, setDays] = useState(30);
  const [sim, setSim] = useState(true);
  const [sec, setSec] = useState('resumen');
  const data = useMemo(() => store.allData({ includeSim: sim }), [sim, store.getVersion()]); // eslint-disable-line
  const k = kpis(data, days);
  const series = dailySeries(data, days);
  const fun = funnel(data, days);
  const emoLabel = (code) => {
    for (const s of Object.values(config.screens)) if (s.key === 'emocion') { const o = s.options.find((x) => x.code === code); if (o) return `${o.emoji} ${o.label.es}`; }
    return code;
  };
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
    return [...c.entries()].map(([a, x]) => ({ label: `${config.actions[a]?.emoji || ''} ${config.actions[a]?.title.es || a}`, value: x.y / x.n, n: x.n })).sort((a, b) => b.value - a.value);
  })();
  const realCount = data.sessions.filter((s) => !s.sim).length;
  const crisisReasons = distribution({ sessions: S.filter((s) => s.crisis).map((s) => ({ ...s, answers: { r: s.crisisReason } })) }, 'r', days);
  const go = (id) => { setSec(id); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  return (
    <ToolShell area="dashboard" section={sec} onSection={go} sections={[['resumen', '⭐', 'Resumen'], ['retencion', '🔁', 'Uso y embudo'], ['emociones', '💜', 'Emociones'], ['audiencia', '🌎', 'Audiencia'], ['seguridad', '🛟', 'Seguridad']]}>
      <div className="head">
        <div><h1>Dashboard</h1><p>¿La gente vuelve y se siente mejor? Todo agregado y sin emails.</p></div>
        <div className="ctrl">
          <div className="segm" role="group" aria-label="Periodo">{[7, 30, 60].map((d) => <button key={d} className={days === d ? 'on' : ''} onClick={() => setDays(d)}>{d} días</button>)}</div>
          <label className="toggle"><input type="checkbox" id="dash-sim" checked={sim} onChange={(e) => setSim(e.target.checked)} /> Incluir datos simulados</label>
        </div>
      </div>
      {sim ? <div className="note warn">Estás viendo <b>datos simulados</b> para mostrar cómo se verá el dashboard. Tus {realCount} check-ins reales de este navegador se suman encima. Desmarca la casilla para ver solo los reales.</div>
        : <div className="note">Solo datos reales de este navegador ({realCount} check-ins). En la fase 2 aquí aparecerán las personas del piloto.</div>}

      <section id="resumen" className="kpis">
        <div className="kpi star"><span className="v">{k.northStar.toFixed(1)}</span><span className="l">Check-ins con reflexión por persona activa / semana <b>(North Star)</b></span></div>
        <div className="kpi"><span className="v">{k.people}</span><span className="l">Personas activas</span></div>
        <div className="kpi"><span className="v">{k.sessions}</span><span className="l">Check-ins iniciados</span></div>
        <div className="kpi"><span className="v">{pct(k.completion)}</span><span className="l">Completan el check-in</span></div>
        <div className="kpi"><span className="v">{pct(k.helped)}</span><span className="l">Dicen que les ayudó (sí o un poco)</span></div>
        <div className="kpi"><span className="v">{pct(k.d1)}</span><span className="l">Vuelven al día siguiente (D1, n={k.cohort1})</span></div>
        <div className="kpi"><span className="v">{pct(k.d7)}</span><span className="l">Siguen a la semana (D7, n={k.cohort7})</span></div>
      </section>

      <section id="retencion" className="grid2">
        <div className="panel">
          <h2>Check-ins por día</h2>
          <div className="sub">Barras: check-ins · línea: personas distintas</div>
          <Bars data={series.map((d) => ({ label: d.d.getDate(), value: d.sessions, people: d.people }))} line="people" labelEvery={days > 30 ? 7 : days > 7 ? 3 : 1} ariaLabel="Check-ins por día" />
        </div>
        <div className="panel">
          <h2>¿Dónde abandonan?</h2>
          <div className="sub">% de check-ins (días difíciles) que llegan a cada pantalla</div>
          <Bars data={fun.map((f, i) => ({ label: STEP_LABEL[f.step], value: Math.round(f.rate * 100), color: i && fun[i - 1].rate - f.rate > 0.025 ? 'var(--coral)' : 'var(--leaf)' }))} fmt={(v) => v + '%'} ariaLabel="Embudo por pantalla" />
          <div className="sub">En coral: pasos donde se pierde más de 2,5 puntos. Ahí revisamos la pregunta.</div>
        </div>
      </section>

      <section id="emociones" className="grid2">
        <div className="panel">
          <h2>Emociones registradas</h2>
          <HBars items={emos.slice(0, 12).map(([c, n]) => ({ label: emoLabel(c), value: n / totalEmo }))} fmt={pct} />
        </div>
        <div className="panel">
          <h2>¿Qué acción ayuda más?</h2>
          <div className="sub">% que responde "sí, me ayudó" después de cada acción</div>
          <HBars items={helpedBy.map((h) => ({ label: h.label, value: h.value }))} fmt={pct} color="var(--leaf)" />
        </div>
        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <h2>¿A qué hora entran?</h2>
          <div className="sub">Check-ins por día de la semana y hora local. Ayuda a elegir la hora de las notificaciones.</div>
          <div className="tbl-wrap">
            <table className="tbl heat" style={{ fontSize: '0.72rem' }}>
              <thead><tr><th></th>{Array.from({ length: 24 }, (_, h) => <th key={h} className="r" style={{ padding: '4px 2px', textAlign: 'center' }}>{h}</th>)}</tr></thead>
              <tbody>{[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <tr key={d}><th>{['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d]}</th>{hm[d].map((v, h) => <td key={h} title={`${v} check-ins`} style={{ ...heatBg(v / hmMax), padding: 0, height: 22, minWidth: 22, borderBottom: '2px solid var(--paper)', borderRight: '2px solid var(--paper)' }} />)}</tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="audiencia" className="grid3">
        <div className="panel"><h2>País</h2><HBars items={byCountry.map(([c, n]) => ({ label: c, value: n }))} /></div>
        <div className="panel"><h2>Edad</h2><HBars items={byAge.map(([c, n]) => ({ label: c.replace('_mas', '+').replace('_', '–'), value: n }))} /></div>
        <div className="panel"><h2>Idioma</h2><HBars items={byLang.map(([c, n]) => ({ label: { es: 'Español', en: 'English', pt: 'Português' }[c], value: n }))} /></div>
      </section>

      <section id="seguridad" className="panel">
        <h2>Protocolo de crisis</h2>
        <div className="kpis">
          <div className="kpi"><span className="v">{k.crisis}</span><span className="l">Veces que se mostró ayuda de crisis ({days} días)</span></div>
          {crisisReasons.map(([r, n]) => <div className="kpi" key={r}><span className="v">{n}</span><span className="l">{{ no_seguro: 'No sabe si está a salvo', hacerme_dano: 'Piensa en hacerse daño', me_hacen_dano: 'Alguien le hace daño', texto: 'Palabras de alerta en texto' }[r] || r}</span></div>)}
        </div>
        <div className="note">Aquí solo se ven cantidades. Quién vio la pantalla de crisis no aparece en el dashboard. Para el piloto, definir con el clínico revisor si alguien del equipo hace seguimiento y con qué consentimiento.</div>
      </section>
    </ToolShell>
  );
}
