import React, { useMemo, useState } from 'react';
import * as store from '../lib/store.js';
import { useStore } from '../app/App.jsx';
import { validateConfig } from '../lib/engine.js';
import { defaultConfig } from '../lib/content.js';
import ToolShell from '../ToolShell.jsx';

const LANGS = [['es', 'Español'], ['en', 'English'], ['pt', 'Português']];
const clone = (x) => JSON.parse(JSON.stringify(x));

function order(cfg) {
  // Orden por profundidad (camino más largo desde el inicio): refleja el orden real en que se ven.
  const depth = { [cfg.startScreen]: 0 };
  const ids = Object.keys(cfg.screens);
  for (let round = 0; round < ids.length; round++) {
    let changed = false;
    for (const id of ids) {
      if (depth[id] == null) continue;
      const s = cfg.screens[id];
      const outs = [...(s.options || []).map((o) => o.next), s.next].filter((n) => n && !n.startsWith('@') && cfg.screens[n]);
      for (const n of outs) if ((depth[n] ?? -1) < depth[id] + 1 && depth[id] + 1 < ids.length) { depth[n] = depth[id] + 1; changed = true; }
    }
    if (!changed) break;
  }
  return ids.sort((a, b) => (depth[a] ?? 99) - (depth[b] ?? 99));
}

export default function Admin() {
  useStore();
  const pub = store.getConfig();
  const draft = store.getDraft();
  const dirty = JSON.stringify(draft) !== JSON.stringify(pub);
  const [sec, setSec] = useState('flujo');
  const [lang, setLang] = useState('es');
  const [note, setNote] = useState('');
  const [justPublished, setJustPublished] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const issues = useMemo(() => validateConfig(draft), [draft]);
  const errors = issues.filter((i) => i.level === 'error');
  const update = (fn) => { const d = clone(draft); fn(d); store.saveDraft(d); setJustPublished(null); };

  return (
    <ToolShell area="admin" section={sec} onSection={setSec} sections={[['flujo', '🧩', 'Flujo de preguntas', Object.keys(draft.screens).length], ['pareceres', '💡', 'Reglas y pareceres'], ['acciones', '⚡', 'Acciones de 1 minuto', Object.keys(draft.actions).length], ['versiculos', '📖', 'Versículos', draft.verses.length], ['crisis', '🛟', 'Protocolo de crisis'], ['versiones', '🕓', 'Versiones']]}>
      <div className="head">
        <div><h1>Admin de contenido</h1><p>Cambia preguntas, opciones, textos y versículos sin programar. Los cambios quedan en borrador hasta que publiques.</p></div>
        <div className="ctrl">
          <div className="segm" role="group" aria-label="Idioma de edición">{LANGS.map(([c, l]) => <button key={c} className={lang === c ? 'on' : ''} onClick={() => setLang(c)}>{l}</button>)}</div>
        </div>
      </div>
      <div className="panel" style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span className={'pill ' + (dirty ? 'warn' : 'ok')}>{dirty ? 'Borrador con cambios sin publicar' : `Publicado · versión ${pub.version}`}</span>
        {errors.length > 0 && <span className="pill bad">{errors.length} error(es) a corregir</span>}
        {issues.length - errors.length > 0 && <span className="pill warn">{issues.length - errors.length} aviso(s) de traducción</span>}
        <div style={{ flex: 1 }} />
        {dirty && <input className="in" style={{ maxWidth: 280 }} id="pub-note" placeholder="¿Qué cambiaste? (para el historial)" value={note} onChange={(e) => setNote(e.target.value)} />}
        {dirty && <button className="btn ghost" onClick={() => store.discardDraft()}>Descartar</button>}
        <button className="btn violet" disabled={!dirty || errors.length > 0 || busy} onClick={async () => {
          setBusy(true); setErr('');
          try { const n = await store.publishDraft(note); setNote(''); setJustPublished(n.version); } catch (e) { setErr(e.message); }
          setBusy(false);
        }}>{busy ? 'Publicando…' : `Publicar versión ${pub.version + 1}`}</button>
        <a className="btn ghost" href="#app" style={{ textDecoration: 'none' }}>Probar en la app</a>
      </div>
      {err && <div className="note warn">No se pudo publicar: {err}. Revisa que tu cuenta tenga rol de admin y que haya internet.</div>}
      {store.live && !store.isDemoView() && <div className="note">Base de datos real: lo que publiques lo ven todas las personas en su próximo check-in.</div>}
      {store.isDemoView() && <div className="note warn">Modo demostración: puedes editar y publicar para probar, pero los cambios quedan solo en este navegador. Para publicar a todas las personas, entra con una cuenta de admin.</div>}
      {justPublished && <div className="note" style={{ background: 'var(--leaf-soft)' }}>✓ Publicada la versión {justPublished}. Los check-ins nuevos guardan este número de versión, así el Lab sabe qué pregunta exacta vio cada persona.</div>}
      {issues.length > 0 && sec === 'flujo' && (
        <details className="panel"><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Revisión automática ({issues.length})</summary>
          <div className="issues">{issues.map((i, k) => <div key={k}><span className={'pill ' + (i.level === 'error' ? 'bad' : 'warn')}>{i.level === 'error' ? 'Error' : 'Aviso'}</span><code>{i.where}</code> {i.msg}</div>)}</div>
        </details>
      )}
      {sec === 'flujo' && <FlowEditor draft={draft} lang={lang} update={update} />}
      {sec === 'pareceres' && <Insights draft={draft} lang={lang} update={update} />}
      {sec === 'acciones' && <Actions draft={draft} lang={lang} update={update} />}
      {sec === 'versiculos' && <Verses draft={draft} lang={lang} update={update} />}
      {sec === 'crisis' && <CrisisEd draft={draft} lang={lang} update={update} />}
      {sec === 'versiones' && <Versions pub={pub} />}
    </ToolShell>
  );
}

function FlowEditor({ draft, lang, update }) {
  const ids = order(draft);
  const [sel, setSel] = useState(ids[0]);
  const s = draft.screens[sel] || draft.screens[ids[0]];
  const id = draft.screens[sel] ? sel : ids[0];
  const targets = [['', '(sigue la pantalla)'], ...ids.filter((x) => x !== id).map((x) => [x, draft.screens[x].title || x]), ['@result', '→ Resultado (parecer + acción + versículo)'], ['@crisis', '🛟 Protocolo de crisis']];
  const nextLabel = (n) => (n === '@result' ? 'Resultado' : n === '@crisis' ? '🛟 Crisis' : draft.screens[n]?.title || n);
  function addScreen() {
    update((d) => {
      let n = 1; while (d.screens['pregunta_' + n]) n++;
      const nid = 'pregunta_' + n;
      d.screens[nid] = { type: 'choice', key: 'variable_' + n, title: 'Nueva pregunta ' + n, prompt: { es: 'Nueva pregunta', en: '', pt: '' }, options: [{ code: 'a', emoji: '🙂', label: { es: 'Opción A', en: '', pt: '' } }, { code: 'b', emoji: '🙃', label: { es: 'Opción B', en: '', pt: '' } }], next: '@result' };
      setSel(nid);
    });
  }
  return (
    <div className="editor-grid">
      <div className="panel">
        <h2>Pantallas</h2>
        <div className="sub">En el orden en que las ve la persona. Cada pantalla guarda una variable.</div>
        <div className="flowlist">
          {ids.map((x) => {
            const sc = draft.screens[x];
            const nexts = [...new Set([...(sc.options || []).map((o) => o.next).filter(Boolean), sc.next].filter(Boolean))];
            return (
              <button key={x} className={'flownode' + (x === id ? ' on' : '') + (sc.safety ? ' safety' : '')} onClick={() => setSel(x)}>
                <b>{sc.title || x}</b>
                <span className="k">variable <code>{sc.key}</code> · {sc.options.length} opciones{x === draft.startScreen ? ' · inicio' : ''}</span>
                <span className="to">→ {nexts.map(nextLabel).join(', ') || '—'}</span>
              </button>
            );
          })}
        </div>
        <button className="btn ghost" onClick={addScreen}>+ Nueva pregunta</button>
        <div className="note">El motor sirve para cualquier tema: una pregunta sobre carros funciona igual que una sobre emociones.</div>
      </div>
      <div className="panel">
        <div className="ctrl" style={{ justifyContent: 'space-between' }}>
          <h2>{s.title || id}</h2>
          {id !== draft.startScreen && <button className="xbtn" style={{ padding: '0 10px' }} onClick={() => update((d) => { delete d.screens[id]; setSel(d.startScreen); })}>Eliminar pantalla</button>}
        </div>
        <div className="grid2">
          <label className="field"><span><b>Nombre interno</b></span><input className="in" id="sc-title" value={s.title || ''} onChange={(e) => update((d) => { d.screens[id].title = e.target.value; })} /></label>
          <label className="field"><span><b>Variable para análisis</b></span><input className="in" id="sc-key" value={s.key} onChange={(e) => update((d) => { d.screens[id].key = e.target.value.replace(/[^a-z0-9_]/gi, '_').toLowerCase(); })} /></label>
        </div>
        <label className="field"><span><b>Pregunta ({lang.toUpperCase()})</b></span><input className="in" id="sc-prompt" value={s.prompt?.[lang] || ''} placeholder={s.prompt?.es} onChange={(e) => update((d) => { d.screens[id].prompt[lang] = e.target.value; })} /></label>
        <div className="optrow hdr"><span>Emoji</span><span>Código</span><span>Texto ({lang.toUpperCase()})</span><span>Después va a</span><span /></div>
        {s.options.map((o, i) => (
          <div className="optrow" key={i}>
            <input className="in emo" aria-label="Emoji" value={o.emoji} onChange={(e) => update((d) => { d.screens[id].options[i].emoji = e.target.value; })} />
            <input className="in c-code" aria-label="Código" value={o.code} onChange={(e) => update((d) => { d.screens[id].options[i].code = e.target.value.replace(/[^a-z0-9_]/gi, '_').toLowerCase(); })} />
            <input className="in" aria-label="Texto" value={o.label?.[lang] || ''} placeholder={o.label?.es} onChange={(e) => update((d) => { d.screens[id].options[i].label[lang] = e.target.value; })} />
            <select className="in c-next" aria-label="Siguiente" value={o.next || ''} onChange={(e) => update((d) => { if (e.target.value) d.screens[id].options[i].next = e.target.value; else delete d.screens[id].options[i].next; })}>
              {targets.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button className="xbtn" aria-label="Quitar opción" disabled={s.options.length <= 1} onClick={() => update((d) => { d.screens[id].options.splice(i, 1); })}>✕</button>
          </div>
        ))}
        <div className="ctrl">
          <button className="btn ghost small" disabled={s.options.length >= 4} onClick={() => update((d) => { d.screens[id].options.push({ code: 'opcion_' + (s.options.length + 1), emoji: '🙂', label: { es: '', en: '', pt: '' } }); })}>+ Opción</button>
          {s.options.length >= 4 && <span className="muted" style={{ fontSize: '0.85rem' }}>Máximo 4 opciones por pantalla (regla del equipo).</span>}
        </div>
        <label className="field"><span><b>Pantalla siguiente por defecto</b></span>
          <select className="in" id="sc-next" value={s.next || ''} onChange={(e) => update((d) => { if (e.target.value) d.screens[id].next = e.target.value; else delete d.screens[id].next; })}>
            {targets.map(([v, l]) => <option key={v} value={v}>{v ? l : '(ninguna)'}</option>)}
          </select>
        </label>
        <div>
          <b style={{ fontSize: '0.88rem' }}>Vista previa</b>
          <div className="preview">
            <h3 style={{ fontSize: '1.3rem', marginBottom: 12 }}>{s.prompt?.[lang] || <span className="muted">Sin traducir</span>}</h3>
            <div className={'options n' + s.options.length}>{s.options.map((o, i) => <div key={i} className="opt"><span className="e">{o.emoji}</span>{o.label?.[lang] || <span className="muted">—</span>}</div>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Insights({ draft, lang, update }) {
  const factors = Object.keys(draft.insights);
  return (
    <>
      <div className="panel">
        <h2>Reglas: respuesta → posible razón</h2>
        <div className="sub">Se revisan todas; gana la de mayor peso. Ajusta pesos según las fichas.</div>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Si la persona responde…</th><th>Posible razón</th><th className="r">Peso</th></tr></thead>
          <tbody>{draft.rules.map((r, i) => (
            <tr key={r.id}>
              <td>{Object.entries(r.when).map(([k, v]) => <span key={k}><code>{k}</code> = {v.join(' o ')}</span>)}</td>
              <td><select className="in" value={r.factor} onChange={(e) => update((d) => { d.rules[i].factor = e.target.value; })}>{factors.map((f) => <option key={f}>{f}</option>)}</select></td>
              <td className="r"><input className="in num" type="number" step="0.5" style={{ width: 80 }} value={r.weight} onChange={(e) => update((d) => { d.rules[i].weight = Number(e.target.value); })} /></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
      <div className="panel">
        <h2>Pareceres ({lang.toUpperCase()})</h2>
        <div className="note">Lenguaje seguro: "Puede que…". Nunca nombrar trastornos ni decir "tienes…".</div>
        {factors.map((f) => (
          <div key={f} className="grid2" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
            <label className="field"><span><b>{f}</b> · posible razón</span><textarea className="in" rows={2} value={draft.insights[f].reason[lang] || ''} placeholder={draft.insights[f].reason.es} onChange={(e) => update((d) => { d.insights[f].reason[lang] = e.target.value; })} /></label>
            <label className="field"><span>Sugerencia práctica</span><textarea className="in" rows={2} value={draft.insights[f].tip[lang] || ''} placeholder={draft.insights[f].tip.es} onChange={(e) => update((d) => { d.insights[f].tip[lang] = e.target.value; })} /></label>
          </div>
        ))}
      </div>
    </>
  );
}

function Actions({ draft, lang, update }) {
  const emotions = [];
  for (const s of Object.values(draft.screens)) if (s.key === 'emocion') s.options.forEach((o) => emotions.push(o));
  return (
    <div className="grid2" style={{ alignItems: 'start' }}>
      <div className="panel">
        <h2>Acciones ({lang.toUpperCase()})</h2>
        {Object.entries(draft.actions).map(([k, a]) => (
          <div key={k} className="field" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
            <span><b>{a.emoji} {k}</b>{a.interactive ? <span className="pill" style={{ marginLeft: 8 }}>interactiva</span> : null}</span>
            <input className="in" value={a.title[lang] || ''} placeholder={a.title.es} onChange={(e) => update((d) => { d.actions[k].title[lang] = e.target.value; })} />
            <textarea className="in" rows={2} value={a.text[lang] || ''} placeholder={a.text.es} onChange={(e) => update((d) => { d.actions[k].text[lang] = e.target.value; })} />
          </div>
        ))}
      </div>
      <div className="panel">
        <h2>¿Qué acción para cada emoción?</h2>
        <div className="tbl-wrap"><table className="tbl"><tbody>
          {emotions.map((o) => (
            <tr key={o.code}><td>{o.emoji} {o.label.es}</td><td><select className="in" value={draft.actionByEmotion[o.code] || ''} onChange={(e) => update((d) => { d.actionByEmotion[o.code] = e.target.value; })}>{Object.entries(draft.actions).map(([k, a]) => <option key={k} value={k}>{a.emoji} {a.title.es}</option>)}</select></td></tr>
          ))}
        </tbody></table></div>
      </div>
    </div>
  );
}

function Verses({ draft, lang, update }) {
  const v = draft.bibleVersions[lang];
  return (
    <>
      <div className="panel">
        <h2>Versión bíblica ({lang.toUpperCase()})</h2>
        <div className="ctrl"><span className="pill ok">En uso: {v.active}</span><span className="pill warn">Objetivo: {v.target} · pendiente de licencia</span></div>
        <div className="note">{v.license} Biblica permite citar hasta 500 versículos sin permiso escrito, con aviso de copyright, pero pide solicitar permiso para uso comercial en apps. Cuando llegue la licencia, se reemplaza el texto aquí y se cambia el nombre de la versión.</div>
      </div>
      <div className="panel">
        <h2>{draft.verses.length} versículos</h2>
        <div className="sub">Cada versículo se asocia a emociones. La reflexión va centrada en quién es Jesús.</div>
        {draft.verses.map((x, i) => (
          <div key={x.id} className="grid2" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
            <div className="field">
              <span><b>{x.ref[lang]}</b> <span className="muted">· emociones:</span></span>
              <input className="in" value={x.emotions.join(', ')} onChange={(e) => update((d) => { d.verses[i].emotions = e.target.value.split(',').map((s) => s.trim()).filter(Boolean); })} />
              <textarea className="in" rows={3} value={x.text[lang]} onChange={(e) => update((d) => { d.verses[i].text[lang] = e.target.value; })} />
            </div>
            <label className="field"><span>Reflexión breve</span><textarea className="in" rows={4} value={x.reflection[lang]} onChange={(e) => update((d) => { d.verses[i].reflection[lang] = e.target.value; })} /></label>
          </div>
        ))}
      </div>
    </>
  );
}

function CrisisEd({ draft, lang, update }) {
  return (
    <>
      <div className="panel">
        <h2>Cuándo se activa</h2>
        <div className="note">1) Si la persona elige "Muy mal", la app pregunta si está a salvo. Las respuestas "No lo sé", "Pienso en hacerme daño" y "Alguien me hace daño" interrumpen el juego. 2) Si en el texto libre aparece una palabra de alerta. En ambos casos no se muestran larva, hojas ni versículo: solo ayuda real.</div>
        <label className="field"><span><b>Palabras de alerta</b> (ES, EN, PT; una por línea)</span>
          <textarea className="in" rows={8} value={draft.crisisKeywords.join('\n')} onChange={(e) => update((d) => { d.crisisKeywords = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean); })} /></label>
      </div>
      <div className="panel">
        <h2>Líneas de ayuda por país</h2>
        <div className="sub">Verificar cada número antes de habilitar un país, y repetir la verificación cada 3 meses.</div>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>País</th><th>Nombre ({lang.toUpperCase()})</th><th>Línea</th><th>Emergencias</th><th>Verificado</th></tr></thead>
          <tbody>{Object.entries(draft.helplines).map(([c, h]) => (
            <tr key={c}><td><b>{c}</b></td>
              <td><input className="in" value={h.name[lang]} onChange={(e) => update((d) => { d.helplines[c].name[lang] = e.target.value; })} /></td>
              <td><input className="in num" style={{ width: 130 }} value={h.number} onChange={(e) => update((d) => { d.helplines[c].number = e.target.value; })} /></td>
              <td><input className="in num" style={{ width: 80 }} value={h.emergency} onChange={(e) => update((d) => { d.helplines[c].emergency = e.target.value; })} /></td>
              <td><span className={'pill ' + (h.verified === 'pendiente' ? 'warn' : 'ok')}>{h.verified}</span></td></tr>
          ))}</tbody>
        </table></div>
      </div>
    </>
  );
}

function Versions({ pub }) {
  const hist = store.getHistory();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="panel">
      <h2>Historial de versiones</h2>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Versión</th><th>Publicada</th><th>Nota</th></tr></thead>
        <tbody>
          <tr><td><b>{pub.version}</b> <span className="pill ok">actual</span></td><td>{new Date(pub.publishedAt).toLocaleString('es')}</td><td>{pub.note}</td></tr>
          {hist.map((h) => <tr key={h.version}><td>{h.version}</td><td>{new Date(h.publishedAt).toLocaleString('es')}{h.by ? ` · ${h.by}` : ''}</td><td>{h.note}</td></tr>)}
        </tbody>
      </table></div>
      {!confirm ? <button className="btn ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setConfirm(true)}>Cargar el contenido original en el borrador</button> : (
        <div className="note warn ctrl">Se reemplaza el borrador por el contenido original v1. Para aplicarlo, publícalo como una versión nueva. <button className="btn small" onClick={() => { const d = defaultConfig(); store.saveDraft({ ...d, version: pub.version, publishedAt: pub.publishedAt, note: pub.note }); setConfirm(false); }}>Cargar</button><button className="btn small ghost" onClick={() => setConfirm(false)}>Cancelar</button></div>
      )}
    </div>
  );
}
