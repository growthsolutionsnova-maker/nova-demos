import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import * as store from '../lib/store.js';
import { nextStep, evaluate, detectCrisis, leavesFrom, stageFor, careDays, localDate } from '../lib/engine.js';
import { simulate } from '../lib/sim.js';
import { tr, L, DOW, DOW_SHORT, COUNTRIES, guessCountry } from '../i18n.js';
import Creature, { Butterfly } from './Creature.jsx';

export function useStore() { return useSyncExternalStore(store.subscribe, store.getVersion); }

const HARD = ['mal', 'muy_mal'];
function emojiFor(config, s) {
  const code = s.answers?.emocion;
  for (const sc of Object.values(config.screens)) if (sc.key === 'emocion') { const o = sc.options.find((x) => x.code === code); if (o) return o.emoji; }
  const m = config.screens.mood.options.find((o) => o.code === s.answers?.animo);
  return m ? m.emoji : '•';
}

export default function AppShell() {
  useStore();
  const config = store.getConfig();
  const pid = store.getMe();
  const profile = pid ? store.getProfile(pid) : null;
  const [view, setView] = useState(profile ? 'home' : 'onb');
  const [tab, setTab] = useState('home');
  const [run, setRun] = useState(null); // datos del check-in en curso
  const lang = profile?.lang || run?.lang || 'es';

  useEffect(() => { if (profile) store.logEvent(profile.pid, 'app_open'); }, []); // eslint-disable-line
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  if (!profile && view !== 'onb' && view !== 'checkin') return <Frame><Onboarding onDone={() => setView('checkin')} /></Frame>;

  return (
    <Frame>
      {view === 'onb' && <Onboarding onDone={() => setView('checkin')} />}
      {view === 'checkin' && (
        <CheckIn config={config} lang={lang} profile={profile}
          onClose={() => { setView('home'); setTab('home'); }}
          onCrisis={(info) => { setRun(info); setView('crisis'); }}
          onResult={(info) => { setRun(info); setView('result'); }} />
      )}
      {view === 'result' && run && <Result config={config} lang={lang} run={run} onFinish={(r) => { setRun(r); setView('reward'); }} />}
      {view === 'reward' && run && <Reward config={config} lang={lang} run={run} profile={profile} onHome={() => { setView('home'); setTab('home'); }} />}
      {view === 'crisis' && <Crisis config={config} lang={lang} profile={profile} reason={run?.reason} onHome={() => { setView('home'); setTab('home'); }} onBreathe={() => setView('sos')} />}
      {view === 'sos' && <SOS lang={lang} onClose={() => setView('home')} pid={pid} />}
      {view === 'home' && profile && (
        <>
          {tab === 'home' && <Home config={config} lang={lang} profile={profile} onCheckin={() => setView('checkin')} onSOS={() => setView('sos')} />}
          {tab === 'map' && <MapView config={config} lang={lang} />}
          {tab === 'me' && <Me config={config} lang={lang} profile={profile} onDeleted={() => setView('onb')} />}
          <nav className="nav" aria-label="App">
            {[['home', '🏡'], ['map', '🗓️'], ['me', '🦋']].map(([k, e]) => (
              <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)} aria-current={tab === k}>
                <span className="e" aria-hidden>{e}</span>{tr(lang, 'tab_' + k)}
              </button>
            ))}
          </nav>
        </>
      )}
    </Frame>
  );
}

function Frame({ children }) {
  return <div className="stage"><div className="phone"><div className="demo-flag">Demo · fase 1 · contenido en revisión</div>{children}</div></div>;
}

// ---------------- Onboarding (valor desde el minuto 1: 3 pantallas y al check-in) ----------------
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState(() => { const n = (navigator.language || 'es').slice(0, 2); return ['es', 'en', 'pt'].includes(n) ? n : 'es'; });
  const [ok, setOk] = useState(false);
  const [research, setResearch] = useState(true);
  if (step === 0) return (
    <div className="screen center">
      <Creature stage="larvita" size={250} title="Larvita" />
      <h1 style={{ fontSize: '2rem' }}>{tr(lang, 'welcome_title')}</h1>
      <p className="muted" style={{ margin: 0, maxWidth: '34ch' }}>{tr(lang, 'welcome_body')}</p>
      <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--wing-deep)', maxWidth: '34ch', fontStyle: 'italic' }}>{tr(lang, 'welcome_verse')}</p>
      <button className="btn wide" onClick={() => setStep(1)}>{tr(lang, 'start')}</button>
      <small className="muted">Emotional Reconstruction Program</small>
    </div>
  );
  if (step === 1) return (
    <div className="screen">
      <div className="topbar"><button className="iconbtn" onClick={() => setStep(0)} aria-label={tr(lang, 'back')}>←</button><div className="progress"><i style={{ width: '33%' }} /><b style={{ left: '33%' }}>🐛</b></div></div>
      <h2 className="q-title">{tr(lang, 'choose_lang')}</h2>
      <div className="options n3">
        {[['es', '🇪🇸', 'Español'], ['en', '🇺🇸', 'English'], ['pt', '🇧🇷', 'Português']].map(([c, e, l]) => (
          <button key={c} className={'opt' + (lang === c ? ' on' : '')} onClick={() => { setLang(c); setTimeout(() => setStep(2), 220); }}><span className="e">{e}</span>{l}</button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="screen">
      <div className="topbar"><button className="iconbtn" onClick={() => setStep(1)} aria-label={tr(lang, 'back')}>←</button><div className="progress"><i style={{ width: '66%' }} /><b style={{ left: '66%' }}>🐛</b></div></div>
      <h2 className="q-title">{tr(lang, 'consent_title')}</h2>
      <div className="card" style={{ gap: 14 }}>
        {[['📒', 'consent_1'], ['🔒', 'consent_2'], ['🤝', 'consent_3']].map(([e, k]) => (
          <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><span style={{ fontSize: 26 }}>{e}</span><span>{tr(lang, k)}</span></div>
        ))}
      </div>
      <label className="chip" style={{ minHeight: 0 }}><input type="checkbox" id="c-ok" checked={ok} onChange={(e) => setOk(e.target.checked)} style={{ width: 22, height: 22 }} /> {tr(lang, 'consent_req')}</label>
      <label className="chip" style={{ minHeight: 0, fontWeight: 400, fontSize: '0.92rem' }}><input type="checkbox" id="c-research" checked={research} onChange={(e) => setResearch(e.target.checked)} style={{ width: 22, height: 22, flex: 'none' }} /> {tr(lang, 'consent_research')}</label>
      <div style={{ flex: 1 }} />
      <button className="btn wide" disabled={!ok} onClick={() => {
        store.createProfile({ lang, country: guessCountry(), consentData: true, consentResearch: research, consentVersion: '2026-10-17' });
        onDone();
      }}>{tr(lang, 'first_checkin')}</button>
    </div>
  );
}

// ---------------- Check-in (motor genérico) ----------------
function CheckIn({ config, lang, profile, onClose, onCrisis, onResult }) {
  const [stack, setStack] = useState([config.startScreen]);
  const [picked, setPicked] = useState(null);
  const [chip, setChip] = useState(null);
  const [note, setNote] = useState('');
  const sessRef = useRef(null);
  const shownAt = useRef(Date.now());
  const started = useRef(Date.now());
  const p = profile || store.getProfile(store.getMe());
  if (!sessRef.current && p) sessRef.current = store.startSession(p.pid, config.version);
  const sid = stack[stack.length - 1];
  const sc = config.screens[sid];
  useEffect(() => { shownAt.current = Date.now(); setPicked(null); setChip(null); }, [sid]);

  const hour = new Date().getHours();
  const greet = tr(lang, hour < 12 ? 'hello_morning' : hour < 19 ? 'hello_afternoon' : 'hello_night');
  const progress = Math.min(0.92, stack.length / 8);

  function go(code) {
    const sess = sessRef.current;
    store.recordAnswer(sess, sid, sc.key, code, Date.now() - shownAt.current, config.version);
    const nx = nextStep(config, sid, code);
    const answers = { ...(store.mySessions().find((s) => s.sid === sess.sid)?.answers || {}) };
    if (nx === '@crisis') {
      store.updateSession(sess.sid, { crisis: true, crisisReason: code, completed: false });
      store.logEvent(sess.pid, 'crisis_shown', { reason: code });
      return onCrisis({ reason: code, sid: sess.sid, lang });
    }
    if (nx === '@result') return onResult({ sid: sess.sid, answers, note, started: started.current, lang });
    setStack((s) => [...s, nx]);
  }
  function choose(code) { setPicked(code); setTimeout(() => go(code), 230); }
  function back() { if (stack.length > 1) setStack((s) => s.slice(0, -1)); }
  function close() { onClose(); }

  function finishReflect() {
    const sess = sessRef.current;
    if (detectCrisis(config, note)) {
      store.updateSession(sess.sid, { crisis: true, crisisReason: 'texto', completed: false, note });
      store.logEvent(sess.pid, 'crisis_shown', { reason: 'texto' });
      return onCrisis({ reason: 'texto', sid: sess.sid, lang });
    }
    store.recordAnswer(sess, sid, sc.key, chip || 'sin_respuesta', Date.now() - shownAt.current, config.version);
    if (note.trim()) store.updateSession(sess.sid, { note: note.trim() });
    const answers = { ...(store.mySessions().find((s) => s.sid === sess.sid)?.answers || {}) };
    onResult({ sid: sess.sid, answers, note, started: started.current, lang });
  }

  if (!sc) return <div className="screen center"><p>Pantalla "{sid}" no encontrada en el flujo.</p><button className="btn" onClick={close}>OK</button></div>;
  return (
    <div className="screen">
      <div className="topbar">
        <button className="iconbtn" onClick={stack.length > 1 ? back : close} aria-label={stack.length > 1 ? tr(lang, 'back') : tr(lang, 'close')}>{stack.length > 1 ? '←' : '✕'}</button>
        <div className="progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${progress * 100}%` }} /><b style={{ left: `${progress * 100}%` }} aria-hidden>🐛</b>
        </div>
        {stack.length > 1 && <button className="iconbtn" onClick={close} aria-label={tr(lang, 'close')}>✕</button>}
      </div>
      {stack.length === 1 && <div className="q-greet">{greet} ☀️</div>}
      <h2 className="q-title" key={sid}>{L(sc.prompt, lang)}</h2>
      {sc.type === 'reflect' ? (
        <>
          <div className="pause"><span className="dot" aria-hidden /> {lang === 'en' ? 'No rush. Breathe in, breathe out.' : lang === 'pt' ? 'Sem pressa. Puxe o ar, solte o ar.' : 'Sin prisa. Toma aire, suéltalo.'}</div>
          <div className="chips">
            {sc.options.map((o) => (
              <button key={o.code} className={'chip' + (chip === o.code ? ' on' : '')} onClick={() => setChip(o.code)} aria-pressed={chip === o.code}><span className="e">{o.emoji}</span>{L(o.label, lang)}</button>
            ))}
          </div>
          <label className="field"><span className="muted" style={{ fontSize: '0.92rem' }}>{tr(lang, 'write_optional')}</span>
            <textarea id="reflect-note" className="line" rows={2} maxLength={280} placeholder={tr(lang, 'write_ph')} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div style={{ flex: 1 }} />
          <button className="btn violet wide" disabled={!chip && !note.trim()} onClick={finishReflect}>{tr(lang, 'see_result')}</button>
        </>
      ) : (
        <div className={'options n' + sc.options.length}>
          {sc.options.map((o) => (
            <button key={o.code} className={'opt' + (picked === o.code ? ' on' : '') + (sc.safety && o.next === '@crisis' ? ' danger' : '')} onClick={() => choose(o.code)} disabled={!!picked}>
              <span className="e" aria-hidden>{o.emoji}</span>{L(o.label, lang)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Resultado: parecer → acción → versículo ----------------
function Result({ config, lang, run, onFinish }) {
  const recent = store.mySessions().slice(-6).map((s) => s.verseId).filter(Boolean);
  const ev = useMemo(() => evaluate(config, run.answers, recent), []); // eslint-disable-line
  const ins = config.insights[ev.factor] || config.insights.ninguno;
  const act = config.actions[ev.actionId];
  const verse = config.verses.find((v) => v.id === ev.verseId);
  const [done, setDone] = useState(null);
  const [step, setStep] = useState('result'); // result → helped → frequency
  const [answers, setAnswers] = useState({});
  const positive = run.answers.animo === 'bien';
  const shown = useRef(Date.now());

  useEffect(() => { store.updateSession(run.sid, { factor: ev.factor, ruleId: ev.ruleId, actionId: ev.actionId, verseId: ev.verseId }); }, []); // eslint-disable-line

  if (step !== 'result') {
    const q = config.after[step];
    return (
      <div className="screen">
        <div className="topbar"><div className="progress"><i style={{ width: step === 'helped' ? '94%' : '98%' }} /><b style={{ left: step === 'helped' ? '94%' : '98%' }} aria-hidden>🐛</b></div></div>
        <h2 className="q-title">{L(q.prompt, lang)}</h2>
        <div className={'options n' + q.options.length}>
          {q.options.map((o) => (
            <button key={o.code} className={'opt' + (answers[q.key] === o.code ? ' on' : '')} onClick={() => {
              const sess = { sid: run.sid, pid: store.getMe() };
              store.recordAnswer(sess, '@' + step, q.key, o.code, Date.now() - shown.current, config.version);
              const a = { ...answers, [q.key]: o.code }; setAnswers(a); shown.current = Date.now();
              setTimeout(() => {
                if (step === 'helped') setStep('frequency');
                else {
                  store.updateSession(run.sid, { completed: true, actionDone: done, durationMs: Date.now() - run.started, lastScreen: '@done' });
                  store.logEvent(store.getMe(), 'checkin_done');
                  onFinish({ ...run, ev, after: a });
                }
              }, 230);
            }}><span className="e" aria-hidden>{o.emoji}</span>{L(o.label, lang)}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="topbar"><div className="progress"><i style={{ width: '90%' }} /><b style={{ left: '90%' }} aria-hidden>🐛</b></div></div>
      <section className="card insight">
        <h3>{tr(lang, 'might_be')}</h3>
        <div className="validate">{L(positive ? config.validations.positive : config.validations.default, lang)}</div>
        <p style={{ margin: 0 }}>{L(ins.reason, lang)}</p>
        <div className="tip"><span aria-hidden>💡</span><span>{L(ins.tip, lang)}</span></div>
      </section>
      {act && (
        <section className="card action">
          <h3>{tr(lang, 'right_now')} · {tr(lang, 'one_min')}</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><span style={{ fontSize: 40 }} aria-hidden>{act.emoji}</span><div><b style={{ fontFamily: 'var(--display)', fontSize: '1.2rem' }}>{L(act.title, lang)}</b><div>{L(act.text, lang)}</div></div></div>
          {act.interactive === 'breath' && done === null && <Breath lang={lang} compact onDone={() => setDone(true)} />}
          {done === null ? (
            <div className="row"><button className="btn small" onClick={() => setDone(true)}>{tr(lang, 'did_it')}</button><button className="btn small ghost" onClick={() => setDone(false)}>{tr(lang, 'not_now')}</button></div>
          ) : done ? <div className="tip" style={{ background: 'var(--sun-soft)' }}>🌟 {tr(lang, 'done_nice')}</div> : null}
        </section>
      )}
      {verse && <VerseCard config={config} verse={verse} lang={lang} />}
      <button className="btn wide" onClick={() => { shown.current = Date.now(); setStep('helped'); }}>{tr(lang, 'continue')}</button>
      <p className="muted" style={{ fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>{tr(lang, 'disclaimer')}</p>
    </div>
  );
}

function VerseCard({ config, verse, lang }) {
  const [speaking, setSpeaking] = useState(false);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  function speak() {
    try {
      if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
      const u = new SpeechSynthesisUtterance(`${L(verse.text, lang)}. ${L(verse.ref, lang)}. ${L(verse.reflection, lang)}`);
      u.lang = { es: 'es-419', en: 'en-US', pt: 'pt-BR' }[lang]; u.rate = 0.92;
      u.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(u); setSpeaking(true);
    } catch { setSpeaking(false); }
  }
  useEffect(() => () => { try { window.speechSynthesis.cancel(); } catch { /* */ } }, []);
  return (
    <section className="card verse">
      <h3>{tr(lang, 'verse_for_you')}</h3>
      <div className="verse-text">{L(verse.text, lang)}</div>
      <div className="verse-ref"><b>{L(verse.ref, lang)}</b><span className="tag">{config.bibleVersions[lang]?.active}</span></div>
      <p style={{ margin: 0 }}>{L(verse.reflection, lang)}</p>
      {canSpeak && <button className="btn small ghost" onClick={speak}>{speaking ? '⏹ ' + tr(lang, 'stop') : '🔊 ' + tr(lang, 'listen')}</button>}
    </section>
  );
}

// ---------------- Recompensa + personalización temprana ----------------
function Reward({ config, lang, run, profile, onHome }) {
  const sessions = store.mySessions();
  const leaves = leavesFrom(sessions);
  const now = stageFor(config, leaves);
  const before = stageFor(config, Math.max(0, leaves - 1));
  const grew = now.index > before.index;
  const p = store.getProfile(store.getMe()) || profile;
  const needsSetup = p && !p.age;
  const [setup, setSetup] = useState(needsSetup ? -1 : null);
  const [name, setName] = useState('');
  const mood = run.answers.animo === 'bien' ? 'bien' : run.answers.animo === 'regular' ? 'regular' : 'soft';
  const often = run.after?.frecuencia === 'siempre' && run.answers.animo !== 'bien';
  const creatureName = p?.avatarName || L(now.stage.name, lang);
  const isCocoon = now.stage.id.startsWith('capullo');

  if (setup === null || setup === -1) return (
    <div className="screen center">
      <Creature stage={now.stage.id} mood={mood} size={260} celebrate />
      <div className="pill ok" style={{ fontSize: '1rem' }}>🍃 {tr(lang, 'leaf_gain')}</div>
      <h2 style={{ fontSize: '1.7rem' }}>{grew ? `${tr(lang, 'grew_to')} ${L(now.stage.name, lang)}!` : `${creatureName} ${tr(lang, isCocoon || now.stage.id === 'mariposa' ? 'stored_light' : 'ate_leaf')}`}</h2>
      {now.next ? (
        <div className="leafbar"><span>🍃 {now.leaves}</span><div className="track"><i style={{ width: `${now.progress * 100}%` }} /></div><span>{now.next.min - now.leaves} {tr(lang, 'leaves_to_grow')}</span></div>
      ) : <p className="muted">{tr(lang, 'fully_grown')}</p>}
      {often && <div className="card" style={{ textAlign: 'left' }}><span>🤝 {tr(lang, 'often_note')}</span></div>}
      <div style={{ flex: 1 }} />
      <button className="btn wide" onClick={() => (needsSetup ? setSetup(0) : onHome())}>{needsSetup ? tr(lang, 'continue') : tr(lang, 'go_home')}</button>
    </div>
  );

  const steps = [
    { k: 'name' },
    { k: 'age', q: 'age_q', opts: [['13_17', '🧒', '13–17'], ['18_29', '🧑', '18–29'], ['30_49', '🧑‍💼', '30–49'], ['50_mas', '🧓', '50+']] },
    { k: 'motive', q: 'motive_q', opts: ['entenderme', 'paz', 'dios', 'curiosidad'].map((c, i) => [c, ['🧭', '🕊️', '🙏', '✨'][i], tr(lang, 'motive_' + c)]) },
    { k: 'reminder', q: 'reminder_q', opts: ['ambos', 'manana', 'noche', 'ninguno'].map((c, i) => [c, ['🌅', '☀️', '🌙', '🔕'][i], tr(lang, 'reminder_' + c)]) },
  ];
  if (setup === 'minor') return (
    <div className="screen center">
      <Creature stage={now.stage.id} size={200} />
      <p style={{ fontSize: '1.15rem', maxWidth: '32ch' }}>👨‍👩‍👧 {tr(lang, 'minor_note')}</p>
      <button className="btn wide" onClick={() => setSetup(2)}>{tr(lang, 'continue')}</button>
    </div>
  );
  const st = steps[setup];
  const nextS = () => (setup + 1 < steps.length ? setSetup(setup + 1) : onHome());
  return (
    <div className="screen">
      <div className="topbar"><div className="progress"><i style={{ width: `${((setup + 1) / steps.length) * 100}%`, background: 'var(--wing)' }} /><b style={{ left: `${((setup + 1) / steps.length) * 100}%` }} aria-hidden>🦋</b></div></div>
      {st.k === 'name' ? (
        <>
          <Creature stage={now.stage.id} size={200} />
          <h2 className="q-title">{tr(lang, 'name_title')}</h2>
          <input id="larva-name" className="line" style={{ border: '2px solid var(--line)', borderRadius: 14, padding: 14, background: 'var(--paper)', fontSize: '1.1rem' }} maxLength={20} placeholder={tr(lang, 'name_ph')} value={name} onChange={(e) => setName(e.target.value)} />
          <div style={{ flex: 1 }} />
          <button className="btn wide" onClick={() => { if (name.trim()) store.updateProfile(p.pid, { avatarName: name.trim() }); nextS(); }}>{tr(lang, 'continue')}</button>
          <button className="link" onClick={nextS}>{tr(lang, 'skip')}</button>
        </>
      ) : (
        <>
          <h2 className="q-title">{tr(lang, st.q)}</h2>
          <div className="options">
            {st.opts.map(([c, e, l]) => (
              <button key={c} className="opt" onClick={() => { store.updateProfile(p.pid, { [st.k]: c }); if (st.k === 'age' && c === '13_17') setSetup('minor'); else nextS(); }}><span className="e" aria-hidden>{e}</span>{l}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------- Crisis: se interrumpe el juego ----------------
function Crisis({ config, lang, profile, reason, onHome, onBreathe }) {
  const country = profile?.country || guessCountry();
  const h = config.helplines[country] || config.helplines.OTHER;
  const others = Object.entries(config.helplines).filter(([c, x]) => c !== country && x.number);
  return (
    <div className="screen crisis" role="alert">
      <h2 className="q-title">{L(config.crisisCopy.title, lang)}</h2>
      <p style={{ margin: 0, fontSize: '1.1rem' }}>{L(config.crisisCopy.body, lang)}</p>
      {reason === 'me_hacen_dano' && <div className="card"><span>🛑 {L(config.crisisCopy.abuse, lang)}</span></div>}
      {h.number ? (
        <div className="helpline">
          <span className="muted">{L(h.name, lang)} · {COUNTRIES[country]?.[{ es: 0, en: 1, pt: 2 }[lang]]}</span>
          <span className="number num">{h.number}</span>
          <div className="row">
            <a className="btn" href={`tel:${h.number.replace(/\s/g, '')}`}>📞 {tr(lang, 'call')}</a>
            {h.sms && <a className="btn ghost" href={`sms:${h.sms}`}>💬 {tr(lang, 'text')}</a>}
          </div>
          <span style={{ fontSize: '0.9rem' }}>{L(config.crisisCopy.danger, lang)} <b className="num">{h.emergency}</b>.</span>
        </div>
      ) : (
        <div className="helpline"><span>{tr(lang, 'crisis_other')}</span></div>
      )}
      <div className="card"><span>💬 {L(config.crisisCopy.trusted, lang)}</span></div>
      <details>
        <summary className="muted" style={{ cursor: 'pointer' }}>{lang === 'en' ? 'Other countries' : lang === 'pt' ? 'Outros países' : 'Otros países'}</summary>
        <ul style={{ paddingLeft: 18, margin: '8px 0 0' }}>{others.map(([c, x]) => <li key={c}>{COUNTRIES[c]?.[0]}: <b className="num">{x.number}</b> · {L(x.name, lang)}</li>)}</ul>
      </details>
      <div style={{ flex: 1 }} />
      <button className="btn violet wide" onClick={onBreathe}>🦋 {tr(lang, 'breathe_with_me')}</button>
      <button className="btn ghost wide" onClick={onHome}>{tr(lang, 'safe_back')}</button>
    </div>
  );
}

// ---------------- Respiración (SOS, funciona sin internet) ----------------
export function Breath({ lang, compact = false, onDone }) {
  const [phase, setPhase] = useState('ready'); // ready | in | out | done
  const [cycle, setCycle] = useState(0);
  const IN = 4000, OUT = 6000, CYCLES = 5;
  useEffect(() => {
    if (phase === 'in') { const t = setTimeout(() => setPhase('out'), IN); return () => clearTimeout(t); }
    if (phase === 'out') { const t = setTimeout(() => { if (cycle + 1 >= CYCLES) { setPhase('done'); onDone && onDone(); } else { setCycle(cycle + 1); setPhase('in'); } }, OUT); return () => clearTimeout(t); }
  }, [phase, cycle]); // eslint-disable-line
  const open = phase === 'in' ? 1 : phase === 'ready' || phase === 'done' ? 0.55 : 0;
  return (
    <div className="breath">
      <svg viewBox="0 0 240 200" style={{ '--breath-ms': phase === 'in' ? IN + 'ms' : OUT + 'ms', width: compact ? 'min(180px, 50vw)' : undefined }} aria-hidden>
        <Butterfly open={open} flap={false} />
      </svg>
      <div className="cue" aria-live="polite">{phase === 'ready' ? (compact ? '' : tr(lang, 'breath_ready')) : phase === 'in' ? tr(lang, 'breath_in') : phase === 'out' ? tr(lang, 'breath_out') : tr(lang, 'breath_done')}</div>
      <div className="count" aria-hidden>{Array.from({ length: CYCLES }, (_, i) => <i key={i} className={i < cycle + (phase === 'done' ? 1 : 0) ? 'on' : ''} />)}</div>
      {phase === 'ready' && <button className="btn violet" onClick={() => { setCycle(0); setPhase('in'); }}>{tr(lang, 'breath_go')}</button>}
      {phase === 'done' && !compact && <button className="btn ghost small" onClick={() => { setCycle(0); setPhase('in'); }}>{tr(lang, 'breath_again')}</button>}
    </div>
  );
}

function SOS({ lang, onClose, pid }) {
  useEffect(() => { if (pid) store.logEvent(pid, 'sos_open'); }, []); // eslint-disable-line
  return (
    <div className="screen" style={{ background: 'var(--wing-soft)' }}>
      <div className="topbar"><button className="iconbtn" onClick={onClose} aria-label={tr(lang, 'close')}>✕</button><span className="pill">📴 {tr(lang, 'works_offline')}</span></div>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}><Breath lang={lang} /></div>
    </div>
  );
}

// ---------------- Inicio ----------------
function Home({ config, lang, profile, onCheckin, onSOS }) {
  const sessions = store.mySessions();
  const st = stageFor(config, leavesFrom(sessions));
  const last = [...sessions].reverse().find((s) => s.completed);
  const mood = last ? (last.answers.animo === 'bien' ? 'bien' : last.answers.animo === 'regular' ? 'regular' : 'soft') : 'bien';
  const care = careDays(sessions);
  const hour = new Date().getHours();
  const greet = tr(lang, hour < 12 ? 'hello_morning' : hour < 19 ? 'hello_afternoon' : 'hello_night');
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14 }}>
        <span className="muted">{greet}</span>
        <span className="pill">🍃 {st.leaves}</span>
      </div>
      <div className="hero">
        <Creature stage={st.stage.id} mood={mood} size={240} />
        <div className="name">{profile.avatarName || L(st.stage.name, lang)}</div>
        {profile.avatarName && <span className="muted" style={{ fontSize: '0.9rem' }}>{L(st.stage.name, lang)}</span>}
        <div className="leafbar" style={{ padding: '8px 4px 0' }}>
          {st.next ? <><div className="track"><i style={{ width: `${st.progress * 100}%` }} /></div><span className="num">{st.next.min - st.leaves} {tr(lang, 'leaves_to_grow')}</span></> : <span>{tr(lang, 'fully_grown')}</span>}
        </div>
      </div>
      <button className="btn wide" style={{ fontSize: '1.25rem', padding: '18px' }} onClick={onCheckin}>{tr(lang, 'how_now')}</button>
      <button className="sos" onClick={onSOS}>
        <svg viewBox="0 0 240 200" aria-hidden><Butterfly open={0.8} /></svg>
        <span><b>{tr(lang, 'breathe_now')}</b><span className="muted" style={{ fontSize: '0.88rem' }}>{tr(lang, 'one_min')} · {tr(lang, 'works_offline')}</span></span>
      </button>
      <div className="card">
        <div className="care">
          <span><b className="num" style={{ fontFamily: 'var(--display)', fontSize: '1.4rem' }}>{care}</b> {tr(lang, care === 1 ? 'care_day' : 'care_days')}</span>
          <span className="dots" aria-hidden>{Array.from({ length: 7 }, (_, i) => <i key={i} className={i < care ? 'on' : ''} />)}</span>
        </div>
        <span className="muted" style={{ fontSize: '0.88rem' }}>{tr(lang, 'care_note')}</span>
        <div className="week">
          {days.map((d) => {
            const ds = localDate(d);
            const s = [...sessions].reverse().find((x) => x.localDate === ds && x.completed);
            return <div key={ds}><span className={(s ? 'has' : '') + (ds === localDate(new Date()) ? ' today' : '')}>{s ? emojiFor(config, s) : ''}</span>{DOW_SHORT[lang][d.getDay()]}</div>;
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------- Mi mapa ----------------
function MapView({ config, lang }) {
  const [example, setExample] = useState(false);
  const exampleSessions = useMemo(() => {
    const sim = simulate(config, { people: 30, seed: 77 });
    const by = new Map(); sim.sessions.forEach((s) => { if (!by.has(s.pid)) by.set(s.pid, []); by.get(s.pid).push(s); });
    return [...by.values()].sort((a, b) => b.length - a.length)[0] || [];
  }, [config]);
  const sessions = (example ? exampleSessions : store.mySessions()).filter((s) => s.completed);
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const nDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const byDay = new Map();
  sessions.forEach((s) => { const arr = byDay.get(s.localDate) || []; arr.push(s); byDay.set(s.localDate, arr); });
  const monthName = today.toLocaleDateString({ es: 'es', en: 'en', pt: 'pt-BR' }[lang], { month: 'long', year: 'numeric' });
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(<div key={'e' + i} className="d empty" />);
  for (let d = 1; d <= nDays; d++) {
    const ds = localDate(new Date(today.getFullYear(), today.getMonth(), d));
    const arr = byDay.get(ds) || [];
    const s = arr[arr.length - 1];
    const hard = arr.some((x) => HARD.includes(x.answers.animo));
    cells.push(<div key={ds} className={'d' + (s ? (hard ? ' hard' : ' good') : '') + (d === today.getDate() ? ' today' : '')}>{s ? <span className="e">{emojiFor(config, s)}</span> : null}<span>{d}</span></div>);
  }
  // resumen semanal
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
  const wk = new Map();
  sessions.filter((s) => new Date(s.startedAt) >= new Date(localDate(weekAgo))).forEach((s) => { const h = HARD.includes(s.answers.animo); wk.set(s.localDate, (wk.get(s.localDate) || false) || h); });
  const hardDays = [...wk.values()].filter(Boolean).length, goodDays = wk.size - hardDays;
  const patterns = findPatterns(sessions, config, lang);
  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingTop: 14, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.6rem' }}>{tr(lang, 'map_title')}</h2>
        <button className="link" onClick={() => setExample(!example)}>{example ? tr(lang, 'my_map') : tr(lang, 'example_map')}</button>
      </div>
      {example && <span className="pill sim" style={{ alignSelf: 'flex-start' }}>{tr(lang, 'example_tag')}</span>}
      <div className="card">
        <b>{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</b>
        <div className="cal">{DOW_SHORT[lang].map((d, i) => <div key={i} className="h">{d}</div>)}{cells}</div>
        <div className="legend"><span><i style={{ background: 'var(--leaf-soft)' }} />{tr(lang, 'good_days')}</span><span><i style={{ background: 'var(--wing-soft)' }} />{tr(lang, 'hard_days')}</span></div>
        {!sessions.length && <p className="muted" style={{ margin: 0 }}>{tr(lang, 'map_empty')}</p>}
      </div>
      {sessions.length > 0 && (
        <div className="card">
          <h3>{tr(lang, 'week_summary')}</h3>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <span><b className="num" style={{ fontSize: '1.5rem', fontFamily: 'var(--display)', color: 'var(--leaf-deep)' }}>{goodDays}</b> {tr(lang, goodDays === 1 ? 'good_day' : 'good_days')}</span>
            <span><b className="num" style={{ fontSize: '1.5rem', fontFamily: 'var(--display)', color: 'var(--wing-deep)' }}>{hardDays}</b> {tr(lang, hardDays === 1 ? 'hard_day' : 'hard_days')}</span>
          </div>
        </div>
      )}
      <div className="card">
        <h3>{tr(lang, 'patterns')}</h3>
        {sessions.length < 5 ? <p className="muted" style={{ margin: 0 }}>🐛 {tr(lang, 'patterns_wait')} ({sessions.length}/5)</p>
          : patterns.length ? patterns.map((p, i) => <div key={i} className="pattern"><span className="e" aria-hidden>{p.e}</span><span>{p.t}</span></div>)
          : <p className="muted" style={{ margin: 0 }}>{tr(lang, 'pat_none')}</p>}
      </div>
    </div>
  );
}

// Patrones personales, redactados con cuidado (los revisa Emilia antes del piloto).
function findPatterns(sessions, config, lang) {
  const out = [];
  const hardRate = (arr) => (arr.length ? arr.filter((s) => HARD.includes(s.answers.animo) || s.answers.animo === 'regular').length / arr.length : 0);
  const withSleep = sessions.filter((s) => s.answers.sueno);
  const poor = withSleep.filter((s) => s.answers.sueno !== 'bien'), good = sessions.filter((s) => s.answers.sueno === 'bien' || s.answers.animo === 'bien');
  if (poor.length >= 3 && hardRate(poor) - hardRate(good) > 0.25) out.push({ e: '😴', t: tr(lang, 'pat_sleep') });
  const end = sessions.filter((s) => s.dom >= 27 || s.dom <= 1), mid = sessions.filter((s) => s.dom > 1 && s.dom < 27);
  const hr = (arr) => (arr.length ? arr.filter((s) => HARD.includes(s.answers.animo)).length / arr.length : 0);
  if (end.length >= 3 && hr(end) - hr(mid) > 0.2) out.push({ e: '📅', t: tr(lang, 'pat_month') });
  const byDow = [0, 1, 2, 3, 4, 5, 6].map((d) => sessions.filter((s) => s.dow === d));
  const overall = hr(sessions);
  const worst = byDow.map((a, d) => ({ d, n: a.length, r: hr(a) })).filter((x) => x.n >= 3).sort((a, b) => b.r - a.r)[0];
  if (worst && worst.r - overall > 0.2) out.push({ e: '🗓️', t: tr(lang, 'pat_dow', { d: DOW[lang][worst.d] }) });
  const am = sessions.filter((s) => s.hour < 15), pm = sessions.filter((s) => s.hour >= 19);
  if (am.length >= 3 && pm.length >= 3 && hr(pm) - hr(am) > 0.2) out.push({ e: '🌙', t: tr(lang, 'pat_night') });
  const helped = sessions.filter((s) => s.actionDone && s.answers.ayudo === 'si');
  if (helped.length >= 3) {
    const c = new Map(); helped.forEach((s) => c.set(s.actionId, (c.get(s.actionId) || 0) + 1));
    const top = [...c.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && config.actions[top[0]]) out.push({ e: config.actions[top[0]].emoji, t: tr(lang, 'pat_help', { a: L(config.actions[top[0]].title, lang).toLowerCase() }) });
  }
  return out.slice(0, 4);
}

// ---------------- Yo ----------------
function Me({ config, lang, profile, onDeleted }) {
  const [email, setEmail] = useState(store.getIdentity(profile.pid)?.email || '');
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const leaves = leavesFrom(store.mySessions());
  const st = stageFor(config, leaves);
  return (
    <div className="screen">
      <h2 style={{ fontSize: '1.6rem', paddingTop: 14 }}>{tr(lang, 'me_title')}</h2>
      <div className="card">
        <div className="field"><label htmlFor="me-name">{tr(lang, 'name_title')}</label>
          <input id="me-name" defaultValue={profile.avatarName || ''} maxLength={20} onBlur={(e) => store.updateProfile(profile.pid, { avatarName: e.target.value.trim() })} placeholder={tr(lang, 'name_ph')} /></div>
        <div className="field"><label>{tr(lang, 'language')}</label>
          <div className="seg">{[['es', 'Español'], ['en', 'English'], ['pt', 'Português']].map(([c, l]) => <button key={c} className={lang === c ? 'on' : ''} onClick={() => store.updateProfile(profile.pid, { lang: c })}>{l}</button>)}</div></div>
        <div className="field"><label htmlFor="me-country">{tr(lang, 'country')}</label>
          <select id="me-country" value={profile.country || 'OTHER'} onChange={(e) => store.updateProfile(profile.pid, { country: e.target.value })}>
            {Object.entries(COUNTRIES).map(([c, n]) => <option key={c} value={c}>{n[{ es: 0, en: 1, pt: 2 }[lang]]}</option>)}
          </select></div>
        <div className="field"><label>{tr(lang, 'reminders')}</label>
          <div className="seg">{['ambos', 'manana', 'noche', 'ninguno'].map((c) => <button key={c} className={profile.reminder === c ? 'on' : ''} onClick={() => store.updateProfile(profile.pid, { reminder: c })}>{tr(lang, 'reminder_' + c)}</button>)}</div>
          <span className="muted" style={{ fontSize: '0.85rem' }}>{tr(lang, 'reminders_note')}</span></div>
      </div>
      <div className="card">
        <h3>{tr(lang, 'save_map')}</h3>
        <span style={{ fontSize: '0.95rem' }}>{tr(lang, 'save_map_body')}</span>
        <form className="row" onSubmit={(e) => { e.preventDefault(); if (/\S+@\S+\.\S+/.test(email)) { store.saveIdentity(profile.pid, email.trim()); setSaved(true); } }}>
          <input id="me-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setSaved(false); }} placeholder="tu@email.com" style={{ flex: 2, minWidth: 0, border: '2px solid var(--line)', borderRadius: 14, padding: '10px 12px', background: 'var(--paper)' }} />
          <button className="btn small" type="submit">{saved ? '✓ ' + tr(lang, 'saved') : tr(lang, 'save')}</button>
        </form>
      </div>
      <div className="card">
        <h3>{tr(lang, 'stages_title')}</h3>
        <div className="stages">
          {config.stages.map((s, i) => (
            <div key={s.id} className={i === st.index ? 'on' : ''}>
              <Creature stage={s.id} size={110} />
              <div><b>{L(s.name, lang)}</b></div><div className="muted num">🍃 {s.min}+</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>{tr(lang, 'privacy_title')}</h3>
        <span style={{ fontSize: '0.95rem' }}>🔒 {tr(lang, 'consent_2')} {tr(lang, 'consent_3')}</span>
        {!confirm ? <button className="btn small ghost" onClick={() => setConfirm(true)}>{tr(lang, 'delete_data')}</button> : (
          <div className="note warn" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tr(lang, 'delete_confirm')}
            <div className="row"><button className="btn small" style={{ background: 'var(--bad)', boxShadow: 'none' }} onClick={() => { store.deleteMyData(); onDeleted(); }}>{tr(lang, 'yes_delete')}</button><button className="btn small ghost" onClick={() => setConfirm(false)}>{tr(lang, 'cancel')}</button></div>
          </div>
        )}
      </div>
      <a className="link" href="#" style={{ textAlign: 'center' }}>← Accesos de la demo</a>
    </div>
  );
}
