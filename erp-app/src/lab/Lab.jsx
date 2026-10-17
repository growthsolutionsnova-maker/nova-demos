import React, { useMemo, useState } from 'react';
import * as store from '../lib/store.js';
import { useStore } from '../app/App.jsx';
import { codebook, crosstab, byDayOfMonth, people, toCSV, codebookCSV, spssSyntax } from '../lib/analytics.js';
import ToolShell from '../ToolShell.jsx';
import { Bars, heatBg } from '../charts.jsx';

const PRESETS = [
  ['sueno', 'animo', 'Sueño × Ánimo'],
  ['fase_mes', 'tema', 'Parte del mes × Tema'],
  ['momento', 'emocion', 'Momento del día × Emoción'],
  ['cuerpo', 'emocion', 'Cuerpo × Emoción'],
  ['emocion', 'ayudo', 'Emoción × ¿Te ayudó?'],
];
const GROUPS = {
  ansiedad: ['Nervios, preocupación y miedo', ['ansiedad', 'preocupacion', 'miedo']],
  tristeza: ['Tristeza y sin ganas', ['tristeza', 'desanimo', 'no_puedo']],
  rabia: ['Rabia', ['rabia']],
  cansancio: ['Cansancio y agotamiento', ['cansancio', 'agotamiento']],
  soledad: ['Soledad', ['soledad']],
  bien: ['Emociones agradables', ['alegria', 'paz', 'gratitud', 'energia']],
};

export default function Lab() {
  useStore();
  const config = store.getConfig();
  const [sec, setSec] = useState('cruces');
  const [sim, setSim] = useState(true);
  const [onlyConsent, setOnlyConsent] = useState(true);
  const raw = useMemo(() => store.allData({ includeSim: sim }), [sim, store.getVersion()]); // eslint-disable-line
  const data = useMemo(() => {
    if (!onlyConsent) return raw;
    const ok = new Set(raw.profiles.filter((p) => p.consentResearch).map((p) => p.pid));
    return { ...raw, profiles: raw.profiles.filter((p) => ok.has(p.pid)), sessions: raw.sessions.filter((s) => ok.has(s.pid)) };
  }, [raw, onlyConsent]);
  const vars = useMemo(() => codebook(config), [config]);

  return (
    <ToolShell area="lab" section={sec} onSection={setSec} sections={[['cruces', '🔀', 'Cruces'], ['mes', '📅', 'Patrones en el tiempo'], ['personas', '🧑‍🤝‍🧑', 'Personas', people(data).length], ['exportar', '⬇️', 'Exportar'], ['diccionario', '📖', 'Diccionario']]}>
      <div className="head">
        <div><h1>Lab de investigación</h1><p>Cruza variables, encuentra patrones y exporta para tu análisis. Personas identificadas solo por un código.</p></div>
        <div className="ctrl">
          <label className="toggle"><input type="checkbox" id="lab-consent" checked={onlyConsent} onChange={(e) => setOnlyConsent(e.target.checked)} /> Solo quienes aceptaron investigación</label>
          <label className="toggle"><input type="checkbox" id="lab-sim" checked={sim} onChange={(e) => setSim(e.target.checked)} /> Incluir simulados</label>
        </div>
      </div>
      {sim && <div className="note warn">Incluye <b>datos simulados</b> con patrones inventados (fin de mes, sueño, ciclo) para mostrar lo que el Lab puede encontrar. No son conclusiones.</div>}
      {sec === 'cruces' && <Cross data={data} vars={vars} />}
      {sec === 'mes' && <Time data={data} />}
      {sec === 'personas' && <People data={data} config={config} />}
      {sec === 'exportar' && <Export data={data} config={config} onlyConsent={onlyConsent} />}
      {sec === 'diccionario' && <Dict vars={vars} />}
    </ToolShell>
  );
}

function Cross({ data, vars }) {
  const [r, setR] = useState('sueno');
  const [c, setC] = useState('animo');
  const [mode, setMode] = useState('row');
  const rv = vars.find((v) => v.id === r), cv = vars.find((v) => v.id === c);
  const x = crosstab(data, rv, cv);
  const strength = x.cramerV >= 0.3 ? ['Relación fuerte', 'ok'] : x.cramerV >= 0.15 ? ['Relación moderada', 'warn'] : ['Relación débil o nula', ''];
  const cell = (i, j) => {
    const v = x.m[i][j];
    const t = mode === 'row' ? v / (x.rowT[i] || 1) : mode === 'col' ? v / (x.colT[j] || 1) : v / (Math.max(...x.m.flat()) || 1);
    return { text: mode === 'n' ? v : Math.round(t * 100) + '%', t: mode === 'n' ? t : t };
  };
  const sel = (val, set, id) => (
    <select id={id} value={val} onChange={(e) => set(e.target.value)}>
      {['Respuestas', 'Motor', 'Tiempo', 'Perfil'].map((g) => <optgroup key={g} label={g}>{vars.filter((v) => v.group === g).map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}</optgroup>)}
    </select>
  );
  return (
    <>
      <div className="panel">
        <div className="ctrl">
          <label htmlFor="x-row"><b>Filas</b></label>{sel(r, setR, 'x-row')}
          <button className="xbtn" style={{ padding: '0 10px' }} onClick={() => { setR(c); setC(r); }} aria-label="Intercambiar">⇄</button>
          <label htmlFor="x-col"><b>Columnas</b></label>{sel(c, setC, 'x-col')}
          <div className="segm" role="group" aria-label="Mostrar">{[['row', '% fila'], ['col', '% columna'], ['n', 'Conteo']].map(([k, l]) => <button key={k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>{l}</button>)}</div>
        </div>
        <div className="ctrl" style={{ fontSize: '0.85rem' }}>
          <span className="muted">Ejemplos:</span>{PRESETS.map(([a, b, l]) => <button key={l} className="pill" style={{ border: 0 }} onClick={() => { setR(a); setC(b); }}>{l}</button>)}
        </div>
      </div>
      <div className="panel">
        <h2>{rv.label} × {cv.label}</h2>
        <div className="tbl-wrap">
          <table className="tbl heat">
            <thead><tr><th>{rv.label}</th>{x.cols.map((cc) => <th key={cc.code} className="c" style={{ textAlign: 'center' }}>{cc.label}</th>)}<th className="r">n</th></tr></thead>
            <tbody>{x.rows.map((rr, i) => (
              <tr key={rr.code}><th>{rr.label}</th>{x.cols.map((cc, j) => { const v = cell(i, j); return <td key={cc.code} className="c num" style={{ ...heatBg(v.t), borderBottom: '2px solid var(--paper)' }}>{v.text}</td>; })}<td className="r num muted">{x.rowT[i]}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <div className="ctrl" style={{ gap: 16 }}>
          <span className={'pill ' + strength[1]}>{strength[0]}</span>
          <span className="num">n = {x.n}</span>
          <span className="num">χ²({x.df}) = {x.chi2.toFixed(1)}</span>
          <span className="num">p {x.p < 0.001 ? '< 0,001' : '= ' + x.p.toFixed(3)}</span>
          <span className="num">V de Cramér = {x.cramerV.toFixed(2)}</span>
        </div>
        {x.lowExpShare > 0.2 && <div className="note warn">Más del 20 % de las celdas tienen pocos casos esperados (menos de 5). Con estos números el resultado no es confiable: junta categorías o espera más datos.</div>}
        <div className="note">Una relación no prueba una causa. Sirve para formular preguntas y decidir qué revisar en las fichas.</div>
      </div>
    </>
  );
}

function Time({ data }) {
  const [g, setG] = useState('ansiedad');
  const dm = byDayOfMonth(data, 'emocion', GROUPS[g][1]);
  const total = dm.reduce((a, b) => a + b.n, 0) || 1;
  const avg = dm.reduce((a, b) => a + b.rate * b.n, 0) / total;
  const dows = [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const S = data.sessions.filter((s) => s.dow === d && s.answers.emocion);
    return { label: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d], value: S.length ? S.filter((s) => GROUPS[g][1].includes(s.answers.emocion)).length / S.length : 0 };
  });
  const hours = [['Madrugada (0–5)', 0, 5], ['Mañana (6–11)', 6, 11], ['Tarde (12–17)', 12, 17], ['Noche (18–23)', 18, 23]].map(([l, a, b]) => {
    const S = data.sessions.filter((s) => s.hour >= a && s.hour <= b && s.answers.emocion);
    return { label: l, value: S.length ? S.filter((s) => GROUPS[g][1].includes(s.answers.emocion)).length / S.length : 0 };
  });
  return (
    <>
      <div className="panel">
        <div className="ctrl"><b>Emoción</b><div className="segm" role="group" aria-label="Emoción">{Object.entries(GROUPS).map(([k, [l]]) => <button key={k} className={g === k ? 'on' : ''} onClick={() => setG(k)}>{l}</button>)}</div></div>
      </div>
      <div className="panel">
        <h2>Por día del mes</h2>
        <div className="sub">% de check-ins con "{GROUPS[g][0].toLowerCase()}" según el día del mes. Línea punteada: promedio ({Math.round(avg * 100)} %).</div>
        <Bars data={dm.map((d) => ({ label: d.d, value: Math.round(d.rate * 100), color: d.rate > avg * 1.3 ? 'var(--coral)' : 'var(--wing)', dim: d.n < 8 }))} fmt={(v) => v + '%'} refLine={Math.round(avg * 100)} labelEvery={2} width={900} height={240} ariaLabel="Por día del mes" />
        <div className="sub">Coral: más de 30 % por encima del promedio. Barras claras: menos de 8 check-ins ese día.</div>
      </div>
      <div className="grid2">
        <div className="panel"><h2>Por día de la semana</h2><Bars data={dows.map((d) => ({ ...d, value: Math.round(d.value * 100) }))} fmt={(v) => v + '%'} height={170} /></div>
        <div className="panel"><h2>Por momento del día</h2><Bars data={hours.map((d) => ({ ...d, value: Math.round(d.value * 100) }))} fmt={(v) => v + '%'} height={170} /></div>
      </div>
    </>
  );
}

function emojiOf(config, s) {
  for (const sc of Object.values(config.screens)) if (sc.key === 'emocion') { const o = sc.options.find((x) => x.code === s.answers.emocion); if (o) return o.emoji; }
  return s.crisis ? '🛟' : '·';
}

function People({ data, config }) {
  const list = people(data);
  const [sel, setSel] = useState(null);
  const [onlyReal, setOnlyReal] = useState(false);
  const shown = list.filter((p) => !onlyReal || !p.sim);
  const p = sel && list.find((x) => x.pid === sel);
  const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short' }) : '');
  return (
    <div className="grid2" style={{ gridTemplateColumns: p ? 'minmax(0,1.3fr) minmax(0,1fr)' : '1fr', alignItems: 'start' }}>
      <div className="panel">
        <div className="ctrl" style={{ justifyContent: 'space-between' }}><h2>{shown.length} personas</h2><label className="toggle"><input type="checkbox" id="ppl-real" checked={onlyReal} onChange={(e) => setOnlyReal(e.target.checked)} /> Solo reales</label></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Código</th><th>País</th><th>Edad</th><th className="r">Entradas</th><th>Primera</th><th>Última</th><th>Emociones en orden</th></tr></thead>
            <tbody>{shown.slice(0, 120).map((x) => (
              <tr key={x.pid} className="click" onClick={() => setSel(x.pid)} style={sel === x.pid ? { background: 'var(--leaf-soft)' } : null}>
                <td><code>{x.pid.slice(0, 10)}</code> {x.sim ? <span className="pill sim">sim</span> : <span className="pill ok">real</span>}</td>
                <td>{x.country}</td><td>{(x.age || '').replace('_mas', '+').replace('_', '–')}</td><td className="r">{x.entries}</td><td>{fmt(x.first)}</td><td>{fmt(x.last)}</td>
                <td><span className="strip">{x.sessions.slice(0, 18).map((s) => <span key={s.sid} title={s.answers.emocion}>{emojiOf(config, s)}</span>)}{x.sessions.length > 18 ? '…' : ''}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      {p && (
        <div className="panel" style={{ position: 'sticky', top: 12 }}>
          <div className="ctrl" style={{ justifyContent: 'space-between' }}><h2>Persona <code>{p.pid.slice(0, 10)}</code></h2><button className="xbtn" style={{ padding: '0 10px' }} onClick={() => setSel(null)}>Cerrar</button></div>
          <div className="ctrl" style={{ fontSize: '0.88rem' }}>
            <span className="pill">{p.country}</span><span className="pill">{p.lang}</span><span className="pill">{(p.age || '—').replace('_mas', '+').replace('_', '–')}</span><span className="pill">{p.consentResearch ? 'Acepta investigación' : 'Sin consentimiento de investigación'}</span>
          </div>
          <div className="tl">
            {p.sessions.map((s, i) => (
              <div key={s.sid}>
                <b className="num">#{i + 1}</b>
                <span className="muted num">{fmt(s.startedAt)} · {String(s.hour).padStart(2, '0')}h</span>
                <span className="e">{emojiOf(config, s)}</span>
                <span>{s.crisis ? <span className="pill bad">Ayuda de crisis</span> : !s.completed ? <span className="muted">Abandonó en {s.lastScreen}</span> : <>{s.answers.emocion} · factor <b>{s.factor}</b>{s.answers.ayudo ? <> · ayudó: {s.answers.ayudo}</> : null}</>}</span>
              </div>
            ))}
          </div>
          <div className="note">Sin email ni nombre. El email vive en otra tabla a la que el Lab no tiene acceso.</div>
        </div>
      )}
    </div>
  );
}

function Export({ data, config, onlyConsent }) {
  const [copied, setCopied] = useState('');
  const files = [
    ['checkins.csv', 'Check-ins (una fila por check-in)', () => toCSV(data, config), 'text/csv'],
    ['diccionario.csv', 'Diccionario de variables y códigos', () => codebookCSV(config), 'text/csv'],
    ['importar_spss.sps', 'Sintaxis SPSS (opcional): importa el CSV con etiquetas', () => spssSyntax(config), 'text/plain'],
  ];
  function download(name, make, type) {
    const blob = new Blob(['﻿' + make()], { type: type + ';charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  async function copy(name, make) {
    try { await navigator.clipboard.writeText(make()); setCopied(name); } catch { setCopied('error'); }
  }
  return (
    <div className="panel">
      <h2>Exportar para análisis</h2>
      <div className="sub">{data.sessions.length} check-ins · {onlyConsent ? 'solo personas que aceptaron investigación' : 'todas las personas'} · sin emails</div>
      <div className="tbl-wrap"><table className="tbl"><tbody>
        {files.map(([name, desc, make, type]) => (
          <tr key={name}><td><b>{name}</b><br /><span className="muted">{desc}</span></td>
            <td className="r" style={{ whiteSpace: 'nowrap' }}><button className="btn small" onClick={() => download(name, make, type)}>Descargar</button> <button className="btn small ghost" onClick={() => copy(name, make)}>{copied === name ? '✓ Copiado' : 'Copiar'}</button></td></tr>
        ))}
      </tbody></table></div>
      <div className="note">El CSV abre en Excel, Google Sheets, R, Python o SPSS. Cada fila trae la versión del flujo que respondió la persona, para saber qué pregunta exacta vio.</div>
    </div>
  );
}

function Dict({ vars }) {
  return (
    <div className="panel">
      <h2>Diccionario de variables</h2>
      <div className="sub">Se genera solo a partir del flujo publicado en Admin. Si cambias una pregunta, el diccionario cambia.</div>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Variable</th><th>Etiqueta</th><th>Grupo</th><th>Valores</th></tr></thead>
        <tbody>{vars.map((v) => <tr key={v.id}><td><code>{v.id}</code></td><td>{v.label}{v.question && v.group === 'Respuestas' ? <><br /><span className="muted">{v.question}</span></> : null}</td><td>{v.group}</td><td style={{ fontSize: '0.82rem' }}>{v.values.map((x) => `${x.code} = ${x.label}`).join(' · ')}</td></tr>)}</tbody>
      </table></div>
    </div>
  );
}
