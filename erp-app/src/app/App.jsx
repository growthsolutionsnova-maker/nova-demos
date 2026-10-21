import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import * as store from '../lib/store.js';
import { nextStep, evaluate, detectCrisis, leavesFrom, stageFor, careDays, localDate, colorOf, emotionOption, change, suggestFor } from '../lib/engine.js';
import { simulate } from '../lib/sim.js';
import { tr, L, DOW, DOW_SHORT, COUNTRIES, guessCountry } from '../i18n.js';
import Creature from './Creature.jsx';
import { Icon, Face, iconFor, exprForEmotion, exprForMood } from './icons.jsx';
import { ExerciseFor } from './Exercises.jsx';
import { sfx, soundOn, setSoundOn, speak, stopSpeaking } from './sound.js';

export function useStore() { return useSyncExternalStore(store.subscribe, store.getVersion); }

const HARD = ['mal', 'muy_mal'];
const MOOD_FACE = '#FFF1CC';
const creatureMood = (animo) => (animo === 'bien' ? 'bien' : animo === 'regular' ? 'regular' : 'soft');
const hexOf = (config, color) => config.colors?.[color]?.hex || '#C9D2DC';

function sessionColor(config, s) { return s?.answers?.color || colorOf(config, s?.answers?.emocion); }
function lastCompletedOn(sessions, ds) { return [...sessions].reverse().find((x) => x.localDate === ds && x.completed); }

export default function AppShell() {
  useStore();
  const config = store.getConfig();
  const pid = store.getMe();
  const profile = pid ? store.getProfile(pid) : null;
  const [view, setView] = useState(profile ? 'home' : 'onb');
  const [tab, setTab] = useState('home');
  const [run, setRun] = useState(null);
  const [exercise, setExercise] = useState(null);
  const lang = profile?.lang || run?.lang || 'es';

  useEffect(() => { if (profile) store.logEvent(profile.pid, 'app_open'); }, []); // eslint-disable-line
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { window.scrollTo(0, 0); }, [view, tab]);

  const goHome = () => { setView('home'); setTab('home'); };
  if (!profile && view !== 'onb' && view !== 'checkin') return <Frame><Onboarding onDone={() => setView('checkin')} /></Frame>;

  return (
    <Frame>
      {view === 'onb' && <Onboarding onDone={() => setView('checkin')} />}
      {view === 'checkin' && (
        <CheckIn config={config} lang={lang} profile={profile} onClose={goHome}
          onCrisis={(info) => { setRun(info); setView('crisis'); }}
          onResult={(info) => { setRun(info); setView('result'); }} />
      )}
      {view === 'result' && run && <ResultFlow config={config} lang={lang} run={run} onCrisis={() => { setRun({ ...run, reason: 'final' }); setView('crisis'); }} onFinish={(r) => { setRun(r); setView('reward'); }} />}
      {view === 'reward' && run && <Reward config={config} lang={lang} run={run} profile={profile} onHome={goHome} />}
      {view === 'crisis' && <Crisis config={config} lang={lang} profile={profile} reason={run?.reason} onHome={goHome} onBreathe={() => { setExercise('breath'); setView('exercise'); }} />}
      {view === 'exercise' && <ExerciseScreen config={config} lang={lang} kind={exercise} pid={pid} onClose={() => { setView('home'); }} />}
      {view === 'home' && profile && (
        <>
          {tab === 'home' && <Home config={config} lang={lang} profile={profile} onCheckin={() => setView('checkin')} />}
          {tab === 'exercises' && <ExercisesList config={config} lang={lang} onPick={(k) => { setExercise(k); setView('exercise'); }} />}
          {tab === 'map' && <MapView config={config} lang={lang} />}
          {tab === 'me' && <Me config={config} lang={lang} profile={profile} onDeleted={() => setView('onb')} />}
          <nav className="dock" aria-label="App">
            {[['home', 'house', 'tab_home', 'mint'], ['exercises', 'butterfly', 'tab_exercises', 'lilac'], ['map', 'calendar', 'tab_map', 'sky'], ['me', 'user', 'tab_me', 'sun']].map(([k, ic, label, tone]) => (
              <button key={k} className={'dock-btn ' + tone + (tab === k ? ' on' : '')} onClick={() => { sfx.tap(); setTab(k); }} aria-current={tab === k}>
                <span className="dock-ic"><Icon name={ic} size={26} /></span>{tr(lang, label)}
              </button>
            ))}
          </nav>
        </>
      )}
    </Frame>
  );
}

function Frame({ children }) {
  let l = 'es'; try { l = localStorage.getItem('erp.v1.siteLang') || document.documentElement.lang || 'es'; } catch { /* */ }
  return <div className="stage"><div className="phone"><div className="demo-flag">{tr(l, store.live ? 'flag_pilot' : 'flag_demo')}</div>{children}</div></div>;
}

function MiniLarva() {
  return (
    <svg viewBox="0 0 40 24" width="34" height="22" aria-hidden>
      <circle cx="8" cy="16" r="5" fill="var(--leaf-2)" stroke="var(--ink)" strokeWidth="1.6" />
      <circle cx="16" cy="15" r="5.5" fill="var(--leaf)" stroke="var(--ink)" strokeWidth="1.6" />
      <circle cx="27" cy="12" r="8" fill="var(--leaf)" stroke="var(--ink)" strokeWidth="1.6" />
      <circle cx="25" cy="11" r="1.3" fill="var(--ink)" /><circle cx="30" cy="11" r="1.3" fill="var(--ink)" />
    </svg>
  );
}
function Progress({ value, tone }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${value * 100}%`, background: tone }} /><b style={{ left: `${value * 100}%` }}><MiniLarva /></b>
    </div>
  );
}
function TopBar({ lang, onBack, onClose, value, tone }) {
  return (
    <div className="topbar">
      {onBack ? <button className="iconbtn" onClick={() => { sfx.tap(); onBack(); }} aria-label={tr(lang, 'back')}><Icon name="arrowLeft" /></button> : <span className="iconbtn ghost" aria-hidden />}
      <Progress value={value} tone={tone} />
      {onClose ? <button className="iconbtn" onClick={() => { sfx.tap(); onClose(); }} aria-label={tr(lang, 'close')}><Icon name="close" /></button> : null}
    </div>
  );
}

// ---------------- Onboarding ----------------
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState(() => { let l = null; try { l = localStorage.getItem('erp.v1.siteLang'); } catch { /* */ } const n = l || (navigator.language || 'es').slice(0, 2); return ['es', 'en', 'pt', 'ko'].includes(n) ? n : 'es'; });
  const [ok, setOk] = useState(false);
  const [research, setResearch] = useState(true);
  if (step === 0) return (
    <div className="screen">
      <Scene hour={8} stage="mariposa" mood="bien" name="Buddy" />
      <div className="center-col">
        <span className="wordmark" aria-label="Green Buddy"><span className="wm-green">Green</span> Buddy</span>
        <p className="buddy-hi">{tr(lang, 'brand_hi')}</p>
        <h1 className="hero-title">{tr(lang, 'welcome_title')}</h1>
        <p className="lead">{tr(lang, 'welcome_body')}</p>
        <p className="verse-mini">{tr(lang, 'welcome_verse')}</p>
      </div>
      <div style={{ flex: 1 }} />
      <button className="btn wide" onClick={() => { sfx.next(); setStep(1); }}>{tr(lang, 'start')}</button>
    </div>
  );
  if (step === 1) return (
    <div className="screen">
      <TopBar lang={lang} onBack={() => setStep(0)} value={0.33} />
      <h2 className="q-title">{tr(lang, 'choose_lang')}</h2>
      <div className="options n4">
        {[['es', 'Español'], ['en', 'English'], ['pt', 'Português'], ['ko', '한국어']].map(([c, l]) => (
          <button key={c} className={'opt' + (lang === c ? ' on' : '')} onClick={() => { sfx.select(); setLang(c); store.setSiteLang(c); setTimeout(() => setStep(2), 220); }}>
            <span className="opt-ic lang">{c.toUpperCase()}</span><span className="opt-label">{l}</span>
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="screen">
      <TopBar lang={lang} onBack={() => setStep(1)} value={0.66} />
      <h2 className="q-title">{tr(lang, 'consent_title')}</h2>
      <div className="card list">
        {[['book', 'consent_1'], ['lock', 'consent_2'], ['shield', 'consent_3'], ['user', 'personal_msg']].map(([ic, k]) => (
          <div key={k} className="li"><span className="li-ic"><Icon name={ic} /></span><span>{tr(lang, k)}</span></div>
        ))}
      </div>
      <label className="check"><input type="checkbox" id="c-ok" checked={ok} onChange={(e) => { sfx.tap(); setOk(e.target.checked); }} /><span>{tr(lang, 'consent_req')}</span></label>
      <label className="check small"><input type="checkbox" id="c-research" checked={research} onChange={(e) => setResearch(e.target.checked)} /><span>{tr(lang, 'consent_research')}</span></label>
      <div style={{ flex: 1 }} />
      <button className="btn wide" disabled={!ok} onClick={() => {
        sfx.select();
        store.createProfile({ lang, country: guessCountry(), consentData: true, consentResearch: research, consentVersion: '2026-10-17' });
        onDone();
      }}>{tr(lang, 'first_checkin')}</button>
    </div>
  );
}

// ---------------- Opción (carita de color, carita neutra o ícono) ----------------
function OptionCard({ config, sc, o, lang, picked, onPick, danger }) {
  let art;
  if (sc.key === 'emocion') art = <Face expr={exprForEmotion(o.code)} color={hexOf(config, o.color)} size={60} />;
  else if (sc.key === 'animo' || sc.key === 'animo_final') art = <Face expr={exprForMood(o.code)} color={MOOD_FACE} size={60} />;
  else art = <span className="opt-ic"><Icon name={iconFor(sc.key, o)} size={30} /></span>;
  const tint = sc.key === 'emocion' ? hexOf(config, o.color) : null;
  return (
    <button className={'opt' + (picked === o.code ? ' on' : '') + (danger ? ' danger' : '')} style={tint ? { '--tint': tint } : null}
      onClick={() => onPick(o.code)} disabled={!!picked}>
      {art}
      <span className="opt-label">{L(o.label, lang)}</span>
    </button>
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
  const progress = Math.min(0.9, stack.length / 8);
  const current = () => ({ ...(store.mySessions().find((s) => s.sid === sessRef.current.sid)?.answers || {}) });

  function go(code) {
    const sess = sessRef.current;
    store.recordAnswer(sess, sid, sc.key, code, Date.now() - shownAt.current, config.version);
    const opt = sc.options.find((o) => o.code === code);
    if (opt?.color) store.updateSession(sess.sid, { answers: { ...current(), color: opt.color } });
    const nx = nextStep(config, sid, code);
    if (nx === '@crisis') {
      store.updateSession(sess.sid, { crisis: true, crisisReason: code, completed: false });
      store.logEvent(sess.pid, 'crisis_shown', { reason: code });
      return onCrisis({ reason: code, sid: sess.sid, lang });
    }
    if (nx === '@result') return onResult({ sid: sess.sid, answers: current(), note, started: started.current, lang });
    setStack((s) => [...s, nx]);
  }
  function choose(code) { sfx.select(); setPicked(code); setTimeout(() => go(code), 260); }

  function finishReflect() {
    const sess = sessRef.current;
    if (detectCrisis(config, note)) {
      store.updateSession(sess.sid, { crisis: true, crisisReason: 'texto', completed: false, note });
      store.logEvent(sess.pid, 'crisis_shown', { reason: 'texto' });
      return onCrisis({ reason: 'texto', sid: sess.sid, lang });
    }
    sfx.next();
    store.recordAnswer(sess, sid, sc.key, chip || 'sin_respuesta', Date.now() - shownAt.current, config.version);
    if (note.trim()) store.updateSession(sess.sid, { note: note.trim() });
    onResult({ sid: sess.sid, answers: current(), note, started: started.current, lang });
  }

  if (!sc) return <div className="screen center"><p>Pantalla "{sid}" no encontrada en el flujo.</p><button className="btn" onClick={onClose}>OK</button></div>;
  return (
    <div className="screen">
      <TopBar lang={lang} onBack={stack.length > 1 ? () => setStack((s) => s.slice(0, -1)) : null} onClose={onClose} value={progress} />
      {stack.length === 1 && <div className="q-greet">{greet}</div>}
      <h2 className="q-title" key={sid}>{L(sc.prompt, lang)}</h2>
      {sc.type === 'reflect' ? (
        <>
          <div className="pause"><span className="dot" aria-hidden /> {lang === 'ko' ? '천천히 해요. 숨을 들이쉬고, 내쉬어요.' : lang === 'en' ? 'No rush. Breathe in, breathe out.' : lang === 'pt' ? 'Sem pressa. Puxe o ar, solte o ar.' : 'Sin prisa. Toma aire, suéltalo.'}</div>
          <div className="chips">
            {sc.options.map((o) => (
              <button key={o.code} className={'chip' + (chip === o.code ? ' on' : '')} onClick={() => { sfx.tap(); setChip(o.code); }} aria-pressed={chip === o.code}>
                <span className="chip-ic"><Icon name={iconFor(sc.key, o)} size={22} /></span>{L(o.label, lang)}
              </button>
            ))}
          </div>
          <label className="field"><span className="muted small">{tr(lang, 'write_optional')}</span>
            <textarea id="reflect-note" className="line" rows={2} maxLength={280} placeholder={tr(lang, 'write_ph')} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div style={{ flex: 1 }} />
          <button className="btn violet wide" disabled={!chip && !note.trim()} onClick={finishReflect}>{tr(lang, 'see_result')}</button>
        </>
      ) : (
        <div className={'options n' + sc.options.length}>
          {sc.options.map((o) => <OptionCard key={o.code} config={config} sc={sc} o={o} lang={lang} picked={picked} onPick={choose} danger={sc.safety && o.next === '@crisis'} />)}
        </div>
      )}
    </div>
  );
}

// ---------------- Versículo (tarjeta completa y versión fija abajo) ----------------
function ListenBtn({ verse, lang, small }) {
  const [on, setOn] = useState(false);
  const can = typeof window !== 'undefined' && 'speechSynthesis' in window;
  useEffect(() => () => stopSpeaking(), []);
  if (!can) return null;
  const toggle = () => {
    if (on) { stopSpeaking(); setOn(false); return; }
    setOn(speak(`${L(verse.text, lang)}. ${L(verse.ref, lang)}. ${L(verse.reflection, lang)}`, lang, () => setOn(false)));
  };
  return <button className={'btn ghost ' + (small ? 'tiny' : 'small')} onClick={toggle}><Icon name={on ? 'stop' : 'speaker'} size={20} />{on ? tr(lang, 'stop') : tr(lang, 'listen')}</button>;
}
function VerseCard({ config, verse, lang }) {
  return (
    <section className="card verse">
      <h3 className="card-k"><Icon name="book" size={20} />{tr(lang, 'verse_for_you')}</h3>
      <div className="verse-text">{L(verse.text, lang)}</div>
      <div className="verse-ref"><b>{L(verse.ref, lang)}</b><span className="tag">{verse.ver?.[lang] || config.bibleVersions[lang]?.active}</span></div>
      <p className="m0">{L(verse.reflection, lang)}</p>
      <ListenBtn verse={verse} lang={lang} />
    </section>
  );
}
// Pedido de la Dra. Emilia: una vez que aparece, el versículo se queda hasta el final.
function VerseDock({ config, verse, lang }) {
  const [open, setOpen] = useState(false);
  if (!verse) return null;
  return (
    <aside className={'verse-dock' + (open ? ' open' : '')} aria-label={tr(lang, 'verse_today')}>
      <button className="vd-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="vd-k"><Icon name="book" size={18} />{tr(lang, 'verse_for_you')}</span>
        <span className="vd-ref">{L(verse.ref, lang)}</span>
      </button>
      <div className="vd-text">{L(verse.text, lang)}</div>
      {open && <><p className="m0 small">{L(verse.reflection, lang)}</p><ListenBtn verse={verse} lang={lang} small /></>}
    </aside>
  );
}

// ---------------- Resultado → ¿ayudó? → frecuencia → ¿cómo te sientes ahora? → antes y después ----------------
function ResultFlow({ config, lang, run, onFinish, onCrisis }) {
  const recent = store.mySessions().slice(-6).map((s) => s.verseId).filter(Boolean);
  const ev = useMemo(() => evaluate(config, run.answers, recent), []); // eslint-disable-line
  const ins = config.insights[ev.factor] || config.insights.ninguno;
  const act = config.actions[ev.actionId];
  const verse = config.verses.find((v) => v.id === ev.verseId);
  const [done, setDone] = useState(null);
  const [step, setStep] = useState('result');
  const [answers, setAnswers] = useState({});
  const positive = run.answers.animo === 'bien';
  const shown = useRef(Date.now());
  const color = run.answers.color || colorOf(config, run.answers.emocion);

  useEffect(() => { store.updateSession(run.sid, { factor: ev.factor, ruleId: ev.ruleId, actionId: ev.actionId, verseId: ev.verseId }); }, []); // eslint-disable-line
  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  const order = ['result', 'helped', 'frequency', 'feelNow', 'summary'];
  const prog = 0.9 + order.indexOf(step) * 0.025;

  if (step === 'summary') return <Summary config={config} lang={lang} run={run} answers={answers} verse={verse} color={color} onCrisis={onCrisis} onNext={() => onFinish({ ...run, ev, after: answers, verse })} />;

  if (step !== 'result') {
    const q = config.after[step];
    return (
      <div className="screen with-dock">
        <TopBar lang={lang} value={prog} />
        <h2 className="q-title">{L(q.prompt, lang)}</h2>
        <div className={'options n' + q.options.length}>
          {q.options.map((o) => (
            <OptionCard key={o.code} config={config} sc={{ key: q.key }} o={o} lang={lang} picked={answers[q.key]} onPick={(code) => {
              sfx.select();
              const sess = { sid: run.sid, pid: store.getMe() };
              store.recordAnswer(sess, '@' + step, q.key, code, Date.now() - shown.current, config.version);
              const a = { ...answers, [q.key]: code }; setAnswers(a); shown.current = Date.now();
              setTimeout(() => {
                if (step === 'helped') setStep('frequency');
                else if (step === 'frequency') setStep('feelNow');
                else {
                  const sugg = suggestFor(config, { ...run.answers, ...a });
                  store.updateSession(run.sid, { completed: true, actionDone: done, durationMs: Date.now() - run.started, lastScreen: '@done', suggestions: sugg });
                  store.logEvent(store.getMe(), 'checkin_done');
                  setStep('summary');
                }
              }, 260);
            }} />
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <VerseDock config={config} verse={verse} lang={lang} />
      </div>
    );
  }

  return (
    <div className="screen">
      <TopBar lang={lang} value={prog} />
      <section className="card insight" style={color ? { '--tint': hexOf(config, color) } : null}>
        <h3 className="card-k">{tr(lang, 'might_be')}</h3>
        <div className="validate">{L(positive ? config.validations.positive : config.validations.default, lang)}</div>
        <p className="m0">{L(ins.reason, lang)}</p>
        <div className="tip"><Icon name="sparkle" size={20} /><span>{L(ins.tip, lang)}</span></div>
      </section>
      {act && (
        <section className="card action">
          <h3 className="card-k"><Icon name={act.icon || 'sparkle'} size={20} />{tr(lang, 'your_exercise')}</h3>
          <b className="act-title">{L(act.title, lang)}</b>
          <p className="m0">{L(act.text, lang)}</p>
          {act.interactive && done === null && <ExerciseFor kind={act.interactive} lang={lang} compact onDone={() => setDone(true)} />}
          {done === null && !act.interactive && <div className="row"><button className="btn small" onClick={() => { sfx.leaf(); setDone(true); }}>{tr(lang, 'did_it')}</button><button className="btn small ghost" onClick={() => setDone(false)}>{tr(lang, 'not_now')}</button></div>}
          {done === null && act.interactive && <button className="link" onClick={() => setDone(false)}>{tr(lang, 'not_now')}</button>}
          {done && <div className="tip sun"><Icon name="star" size={20} />{tr(lang, 'done_nice')}</div>}
        </section>
      )}
      {verse && <VerseCard config={config} verse={verse} lang={lang} />}
      <button className="btn wide" onClick={() => { sfx.next(); shown.current = Date.now(); setStep('helped'); }}>{tr(lang, 'continue')}</button>
      <p className="disclaimer">{tr(lang, 'disclaimer')}</p>
    </div>
  );
}

// Antes y después + 3 sugerencias, siempre con el mismo versículo debajo.
function Summary({ config, lang, run, answers, verse, color, onNext, onCrisis }) {
  const before = run.answers.animo, after = answers.animo_final;
  const ch = change(before, after);
  const emo = emotionOption(config, run.answers.emocion);
  const moodLabel = (code) => L(config.after.feelNow.options.find((o) => o.code === code)?.label, lang);
  const sugg = suggestFor(config, { ...run.answers, ...answers });
  useEffect(() => { if (ch === 'mejor') sfx.leaf(); else sfx.soft(); }, []); // eslint-disable-line
  return (
    <div className="screen with-dock center-text">
      <TopBar lang={lang} value={1} />
      <h2 className="q-title">{tr(lang, 'your_moment')}</h2>
      <div className="ba">
        <div className="ba-col">
          <span className="ba-k">{tr(lang, 'started')}</span>
          {emo ? <Face expr={exprForEmotion(emo.code)} color={hexOf(config, color)} size={76} /> : <Face expr={exprForMood(before)} color={MOOD_FACE} size={76} />}
          <b>{emo ? L(emo.label, lang) : moodLabel(before)}</b>
        </div>
        <span className={'ba-arrow ' + (ch || '')}><Icon name="arrowRight" size={30} stroke={2.6} /></span>
        <div className="ba-col">
          <span className="ba-k">{tr(lang, 'now_label')}</span>
          <Face expr={exprForMood(after)} color={MOOD_FACE} size={76} />
          <b>{moodLabel(after)}</b>
        </div>
      </div>
      <p className="lead">{tr(lang, ch === 'mejor' ? 'msg_better' : ch === 'peor' ? 'msg_worse' : 'msg_same')}</p>
      {after === 'muy_mal' && (
        <div className="card help-card"><span>{tr(lang, 'need_help')}</span><button className="btn small" onClick={onCrisis}><Icon name="lifebuoy" size={20} />{tr(lang, 'see_help')}</button></div>
      )}
      <section className="card sugg">
        <h3 className="card-k">{tr(lang, ch === 'mejor' || after === 'bien' ? 'keep_it' : 'care_it')}</h3>
        {sugg.map((id, i) => (
          <div key={id} className="sugg-row"><span className="sugg-n num">{i + 1}</span><span className="li-ic"><Icon name={config.suggestions[id].icon} size={22} /></span><span>{L(config.suggestions[id].text, lang)}</span></div>
        ))}
      </section>
      <button className="btn wide" onClick={() => { sfx.next(); onNext(); }}>{tr(lang, 'continue')}</button>
      <div style={{ flex: 1 }} />
      <VerseDock config={config} verse={verse} lang={lang} />
    </div>
  );
}

// ---------------- Recompensa + personalización temprana ----------------
// Mensajes de la Dra. Emilia (21-10): niveles con inscripción y uso personal en línea.
// Solo en "Yo" y al llegar a crisálida; nunca durante el check-in. Sin urgencia ni botón de compra.
function ProgramNote({ lang }) {
  return (
    <div className="card program-note">
      <h3 className="card-k"><Icon name="sparkle" size={18} />{tr(lang, 'program_title')}</h3>
      <span className="small">{tr(lang, 'levels_msg')}</span>
      <span className="small muted">{tr(lang, 'personal_msg')}</span>
    </div>
  );
}

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
  const mood = creatureMood(run.after?.animo_final || run.answers.animo);
  const often = run.after?.frecuencia === 'siempre' && run.answers.animo !== 'bien';
  const creatureName = p?.avatarName || L(now.stage.name, lang);
  const isCocoon = now.stage.id.startsWith('capullo');
  useEffect(() => { if (setup === -1 || setup === null) (grew ? sfx.grow : sfx.leaf)(); }, []); // eslint-disable-line

  const dock = <VerseDock config={config} verse={run.verse} lang={lang} />;
  if (setup === null || setup === -1) return (
    <div className="screen with-dock center-text">
      <Scene hour={new Date().getHours()} stage={now.stage.id} mood={mood} celebrate compact />
      <span className="pill leafpill"><Icon name="leaf" size={18} />{tr(lang, 'leaf_gain')}</span>
      <h2 className="q-title">{grew ? `${tr(lang, 'grew_to')} ${L(now.stage.name, lang)}!` : `${creatureName} ${tr(lang, isCocoon || now.stage.id === 'mariposa' ? 'stored_light' : 'ate_leaf')}`}</h2>
      {now.next ? (
        <div className="leafbar"><span className="num">{now.leaves}</span><div className="track"><i style={{ width: `${now.progress * 100}%` }} /></div><span>{now.next.min - now.leaves} {tr(lang, 'leaves_to_grow')}</span></div>
      ) : <p className="muted">{tr(lang, 'fully_grown')}</p>}
      {often && <div className="card"><span>{tr(lang, 'often_note')}</span></div>}
      {grew && now.stage.id === 'capullo' && <ProgramNote lang={lang} />}
      <button className="btn wide" onClick={() => { sfx.next(); needsSetup ? setSetup(0) : onHome(); }}>{needsSetup ? tr(lang, 'continue') : tr(lang, 'go_home')}</button>
      <div style={{ flex: 1 }} />
      {dock}
    </div>
  );

  const steps = [
    { k: 'name' },
    { k: 'age', q: 'age_q', opts: [['13_17', null, '13–17'], ['18_29', null, '18–29'], ['30_49', null, '30–49'], ['50_mas', null, '50+']] },
    { k: 'motive', q: 'motive_q', opts: ['entenderme', 'paz', 'dios', 'curiosidad'].map((c, i) => [c, ['compass', 'dove', 'sparkle', 'star'][i], tr(lang, 'motive_' + c)]) },
    { k: 'reminder', q: 'reminder_q', opts: ['ambos', 'manana', 'noche', 'ninguno'].map((c, i) => [c, ['sunrise', 'sun', 'moon', 'bellOff'][i], tr(lang, 'reminder_' + c)]) },
  ];
  if (setup === 'minor') return (
    <div className="screen with-dock center-text">
      <Creature stage={now.stage.id} size={180} />
      <p className="lead">{tr(lang, 'minor_note')}</p>
      <button className="btn wide" onClick={() => setSetup(2)}>{tr(lang, 'continue')}</button>
      <div style={{ flex: 1 }} />
      {dock}
    </div>
  );
  const st = steps[setup];
  const nextS = () => (setup + 1 < steps.length ? setSetup(setup + 1) : onHome());
  return (
    <div className="screen with-dock">
      <TopBar lang={lang} value={(setup + 1) / steps.length} tone="var(--wing)" />
      {st.k === 'name' ? (
        <>
          <div className="center-col"><Creature stage={now.stage.id} size={180} /></div>
          <h2 className="q-title">{tr(lang, 'name_title')}</h2>
          <input id="larva-name" className="line" maxLength={20} placeholder={tr(lang, 'name_ph')} value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn wide" onClick={() => { sfx.next(); if (name.trim()) store.updateProfile(p.pid, { avatarName: name.trim() }); nextS(); }}>{tr(lang, 'continue')}</button>
          <button className="link" onClick={nextS}>{tr(lang, 'skip')}</button>
        </>
      ) : (
        <>
          <h2 className="q-title">{tr(lang, st.q)}</h2>
          <div className="options">
            {st.opts.map(([c, ic, l]) => (
              <button key={c} className="opt" onClick={() => { sfx.select(); store.updateProfile(p.pid, { [st.k]: c }); if (st.k === 'age' && c === '13_17') setSetup('minor'); else nextS(); }}>
                {ic ? <span className="opt-ic"><Icon name={ic} size={30} /></span> : <span className="opt-ic lang">{l}</span>}
                {ic && <span className="opt-label">{l}</span>}
              </button>
            ))}
          </div>
        </>
      )}
      <div style={{ flex: 1 }} />
      {dock}
    </div>
  );
}

// ---------------- Crisis: se interrumpe el juego (sin larva, hojas ni versículo) ----------------
function Crisis({ config, lang, profile, reason, onHome, onBreathe }) {
  const country = profile?.country || guessCountry();
  const h = config.helplines[country] || config.helplines.OTHER;
  const others = Object.entries(config.helplines).filter(([c, x]) => c !== country && x.number);
  useEffect(() => { stopSpeaking(); }, []);
  return (
    <div className="screen crisis" role="alert">
      <h2 className="q-title">{L(config.crisisCopy.title, lang)}</h2>
      <p className="lead left">{L(config.crisisCopy.body, lang)}</p>
      {reason === 'me_hacen_dano' && <div className="card li"><span className="li-ic"><Icon name="hand" /></span><span>{L(config.crisisCopy.abuse, lang)}</span></div>}
      {h.number ? (
        <div className="helpline">
          <span className="muted">{L(h.name, lang)} · {COUNTRIES[country]?.[{ es: 0, en: 1, pt: 2, ko: 3 }[lang]]}</span>
          <span className="number num">{h.number}</span>
          <div className="row">
            <a className="btn" href={`tel:${h.number.replace(/\s/g, '')}`}><Icon name="phone" size={20} />{tr(lang, 'call')}</a>
            {h.sms && <a className="btn ghost" href={`sms:${h.sms}`}><Icon name="chat" size={20} />{tr(lang, 'text')}</a>}
          </div>
          <span className="small">{L(config.crisisCopy.danger, lang)} <b className="num">{h.emergency}</b>.</span>
        </div>
      ) : <div className="helpline"><span>{tr(lang, 'crisis_other')}</span></div>}
      <div className="card li"><span className="li-ic"><Icon name="chat" /></span><span>{L(config.crisisCopy.trusted, lang)}</span></div>
      <details>
        <summary className="muted">{lang === 'ko' ? '다른 나라' : lang === 'en' ? 'Other countries' : lang === 'pt' ? 'Outros países' : 'Otros países'}</summary>
        <ul>{others.map(([c, x]) => <li key={c}>{COUNTRIES[c]?.[0]}: <b className="num">{x.number}</b> · {L(x.name, lang)}</li>)}</ul>
      </details>
      <div style={{ flex: 1 }} />
      <button className="btn violet wide" onClick={onBreathe}><Icon name="butterfly" size={22} />{tr(lang, 'breathe_with_me')}</button>
      <button className="btn ghost wide" onClick={onHome}>{tr(lang, 'safe_back')}</button>
    </div>
  );
}

// ---------------- Ejercicios desde el inicio ----------------
const EX = [['breath', 'respirar', 'butterfly', 'lilac'], ['attention', 'atencion', 'waves', 'sky'], ['bilateral', 'bilateral', 'stars', 'night']];
function ExercisesList({ config, lang, onPick }) {
  return (
    <div className="screen with-nav">
      <h2 className="page-title">{tr(lang, 'exercises_title')}</h2>
      <p className="muted m0">{tr(lang, 'works_offline')}</p>
      <div className="ex-list">
        {EX.map(([k, actId, ic, tone]) => {
          const a = config.actions[actId];
          return (
            <button key={k} className={'ex-card ' + tone} onClick={() => { sfx.select(); onPick(k); }}>
              <span className="ex-ic"><Icon name={ic} size={34} /></span>
              <span className="ex-txt"><b>{L(a?.title, lang)}</b><span>{L(a?.text, lang)}</span></span>
              <span className="pill">{tr(lang, 'one_min')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function ExerciseScreen({ lang, kind, pid, onClose }) {
  useEffect(() => { if (pid) store.logEvent(pid, 'exercise_open', { kind }); }, []); // eslint-disable-line
  return (
    <div className="screen exercise-screen">
      <div className="topbar"><button className="iconbtn" onClick={onClose} aria-label={tr(lang, 'close')}><Icon name="close" /></button><span className="pill"><Icon name="lock" size={16} />{tr(lang, 'works_offline')}</span></div>
      <div className="ex-full"><ExerciseFor kind={kind || 'breath'} lang={lang} /></div>
    </div>
  );
}

// ---------------- Escena (cielo, colinas y la larvita) ----------------
function Scene({ hour, stage, mood, celebrate, compact, name, stageName }) {
  const tod = hour < 6 || hour >= 20 ? 'night' : hour >= 17 ? 'dusk' : 'day';
  return (
    <div className={'scene ' + tod + (compact ? ' compact' : '')}>
      <svg className="scene-bg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden>
        {tod === 'day' && <><circle cx="330" cy="62" r="26" fill="#FFE07A" /><g fill="#fff" opacity=".9"><ellipse cx="90" cy="70" rx="46" ry="16" /><ellipse cx="118" cy="58" rx="30" ry="18" /></g></>}
        {tod === 'dusk' && <><circle cx="320" cy="120" r="30" fill="#FFC27A" opacity=".9" /><g fill="#fff" opacity=".85"><circle cx="70" cy="40" r="2" /><circle cx="150" cy="70" r="1.6" /><circle cx="250" cy="34" r="2" /></g></>}
        {tod === 'night' && <><path d="M330 46a22 22 0 1 0 18 34 18 18 0 0 1-18-34Z" fill="#FFF1B8" /><g fill="#fff"><circle cx="60" cy="40" r="2" /><circle cx="140" cy="80" r="1.5" /><circle cx="230" cy="30" r="2" /><circle cx="280" cy="90" r="1.4" /></g></>}
        <path d="M0 210 Q100 170 210 200 T400 190 V300 H0Z" fill="var(--hill-2)" />
        <path d="M0 240 Q120 205 240 232 T400 226 V300 H0Z" fill="var(--hill)" />
        <ellipse cx="200" cy="268" rx="70" ry="9" fill="#000" opacity=".08" />
      </svg>
      <div className="scene-creature"><Creature stage={stage} mood={mood} size={compact ? 200 : 230} celebrate={celebrate} /></div>
      {name && <div className="scene-name"><b>{name}</b>{stageName && <span>{stageName}</span>}</div>}
    </div>
  );
}

// ---------------- Inicio ----------------
function Home({ config, lang, profile, onCheckin }) {
  const sessions = store.mySessions();
  const st = stageFor(config, leavesFrom(sessions));
  const last = [...sessions].reverse().find((s) => s.completed);
  const care = careDays(sessions);
  const [snd, setSnd] = useState(soundOn());
  const hour = new Date().getHours();
  const greet = tr(lang, hour < 12 ? 'hello_morning' : hour < 19 ? 'hello_afternoon' : 'hello_night');
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const today = localDate(new Date());
  const yest = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return localDate(d); })();
  const prev = [...sessions].reverse().find((s) => s.completed && s.verseId && s.localDate < today);
  const prevVerse = prev && config.verses.find((v) => v.id === prev.verseId);
  const doneToday = sessions.some((s) => s.completed && s.localDate === today);
  return (
    <div className="screen home with-nav">
      <div className="hud">
        <div className="hud-bar" title={tr(lang, 'last7')}>
          <span className="hud-heart"><Icon name="heart" size={18} /></span>
          {days.map((d) => {
            const s = lastCompletedOn(sessions, localDate(d));
            const c = sessionColor(config, s);
            return <i key={localDate(d)} className={'hseg' + (s ? ' on' : '')} style={s ? { background: hexOf(config, c || 'verde') } : null} title={`${DOW_SHORT[lang][d.getDay()]}${c ? ' · ' + L(config.colors[c]?.name, lang) : ''}`} />;
          })}
        </div>
        <div className="hud-row">
          <span className="pill"><Icon name="leaf" size={18} /><b className="num">{st.leaves}</b></span>
          <span className="pill"><span>{tr(lang, 'level')}</span><LevelRing value={st.progress} n={st.index + 1} /></span>
          <button className="pill icon-pill" onClick={() => { const n = !snd; setSoundOn(n); setSnd(n); if (n) sfx.select(); }} aria-label={tr(lang, snd ? 'sound_on' : 'sound_off')} aria-pressed={snd}><Icon name={snd ? 'speaker' : 'speakerOff'} size={18} /></button>
        </div>
      </div>
      <Scene hour={hour} stage={st.stage.id} mood={creatureMood(last?.answers.animo_final || last?.answers.animo)} name={profile.avatarName || L(st.stage.name, lang)} stageName={profile.avatarName ? L(st.stage.name, lang) : null} />
      <div className="home-body">
        <div className="greet-row"><span className="muted">{greet}</span><span className="small muted"><b className="num">{care}</b> {tr(lang, care === 1 ? 'care_day' : 'care_days')}</span></div>
        {prevVerse && !doneToday && (
          <div className="card yesterday">
            <span className="card-k"><Icon name="book" size={18} />{tr(lang, prev.localDate === yest ? 'yesterday_verse' : 'last_verse')}</span>
            <p className="m0 verse-line">“{L(prevVerse.text, lang)}”</p>
            <span className="small muted">{L(prevVerse.ref, lang)}</span>
            <b className="today-q">{tr(lang, 'today_q')}</b>
          </div>
        )}
        <button className="btn wide big" onClick={() => { sfx.select(); onCheckin(); }}>{tr(lang, 'how_now')}</button>
        <div className="card">
          <span className="card-k"><Icon name="calendar" size={18} />{tr(lang, 'last7')}</span>
          <div className="week">
            {days.map((d) => {
              const ds = localDate(d);
              const s = lastCompletedOn(sessions, ds);
              const c = sessionColor(config, s);
              return (
                <div key={ds} className={ds === today ? 'today' : ''}>
                  {s ? <Face expr={s.answers.emocion ? exprForEmotion(s.answers.emocion) : exprForMood(s.answers.animo)} color={hexOf(config, c || 'verde')} size={34} /> : <span className="wk-empty" />}
                  {DOW_SHORT[lang][d.getDay()]}
                </div>
              );
            })}
          </div>
          <span className="small muted">{tr(lang, 'care_note')}</span>
        </div>
      </div>
    </div>
  );
}
function LevelRing({ value, n }) {
  const r = 11, C = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 30 30" width="30" height="30" aria-hidden>
      <circle cx="15" cy="15" r={r} fill="#fff" stroke="var(--line)" strokeWidth="3.5" />
      <circle cx="15" cy="15" r={r} fill="none" stroke="var(--sky-ring)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - value)} transform="rotate(-90 15 15)" />
      <text x="15" y="19.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--ink)" fontFamily="var(--body)">{n}</text>
    </svg>
  );
}

// ---------------- Mi mapa: colores, semana y patrones ----------------
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
  const monthName = today.toLocaleDateString({ es: 'es', en: 'en', pt: 'pt-BR', ko: 'ko-KR' }[lang], { month: 'long', year: 'numeric' });
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(<div key={'e' + i} className="d empty" />);
  for (let d = 1; d <= nDays; d++) {
    const ds = localDate(new Date(today.getFullYear(), today.getMonth(), d));
    const s = lastCompletedOn(sessions, ds);
    const c = sessionColor(config, s);
    cells.push(
      <div key={ds} className={'d' + (s ? ' has' : '') + (d === today.getDate() ? ' today' : '')} style={s ? { '--tint': hexOf(config, c || 'verde') } : null} title={c ? L(config.colors[c]?.name, lang) : ''}>
        {s ? <Face expr={s.answers.emocion ? exprForEmotion(s.answers.emocion) : exprForMood(s.answers.animo)} color={hexOf(config, c || 'verde')} size={26} ring={false} /> : null}
        <span>{d}</span>
      </div>,
    );
  }
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d; });
  const weekRows = week.map((d) => ({ d, s: lastCompletedOn(sessions, localDate(d)) })).filter((x) => x.s);
  const patterns = findPatterns(sessions, config, lang);
  return (
    <div className="screen with-nav">
      <div className="page-head">
        <h2 className="page-title">{tr(lang, 'map_title')}</h2>
        <button className="link" onClick={() => setExample(!example)}>{example ? tr(lang, 'my_map') : tr(lang, 'example_map')}</button>
      </div>
      {example && <span className="pill sim">{tr(lang, 'example_tag')}</span>}
      <div className="card">
        <b>{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</b>
        <div className="cal">{DOW_SHORT[lang].map((d, i) => <div key={i} className="h">{d}</div>)}{cells}</div>
        {!sessions.length && <p className="muted m0">{tr(lang, 'map_empty')}</p>}
      </div>
      <div className="card">
        <h3 className="card-k"><Icon name="calendar" size={18} />{tr(lang, 'week_title')}</h3>
        {weekRows.length ? weekRows.map(({ d, s }) => {
          const c = sessionColor(config, s);
          const v = config.verses.find((x) => x.id === s.verseId);
          const ch = change(s.answers.animo, s.answers.animo_final);
          return (
            <div key={s.sid} className="wk-row">
              <span className="wk-day">{DOW_SHORT[lang][d.getDay()]}<small className="num">{d.getDate()}</small></span>
              <Face expr={s.answers.emocion ? exprForEmotion(s.answers.emocion) : exprForMood(s.answers.animo)} color={hexOf(config, c || 'verde')} size={34} />
              {s.answers.animo_final ? <><span className={'ba-arrow mini ' + (ch || '')}><Icon name="arrowRight" size={18} stroke={2.6} /></span><Face expr={exprForMood(s.answers.animo_final)} color={MOOD_FACE} size={34} /></> : <span className="wk-gap" />}
              <span className="wk-verse"><Icon name="book" size={16} />{v ? L(v.ref, lang) : '—'}</span>
            </div>
          );
        }) : <p className="muted m0">{tr(lang, 'week_empty')}</p>}
      </div>
      <div className="card">
        <h3 className="card-k">{tr(lang, 'colors_title')}</h3>
        <p className="small muted m0">{tr(lang, 'colors_note')}</p>
        <div className="legend">
          {Object.entries(config.colors).map(([k, c]) => (
            <div key={k} className="lg"><Face expr={{ verde: 'happy', amarillo: 'scared', naranja: 'wild', rojo: 'angry', morado: 'worried', azul: 'down', gris: 'blank' }[k]} color={c.hex} size={30} /><span><b>{L(c.name, lang)}</b><small>{L(c.desc, lang)}</small></span></div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3 className="card-k"><Icon name="sparkle" size={18} />{tr(lang, 'patterns')}</h3>
        {sessions.length < 5 ? <p className="muted m0">{tr(lang, 'patterns_wait')} ({sessions.length}/5)</p>
          : patterns.length ? patterns.map((p, i) => <div key={i} className="pattern"><span className="li-ic" style={p.color ? { background: p.color, color: '#fff' } : null}><Icon name={p.icon} size={20} /></span><span>{p.t}</span></div>)
          : <p className="muted m0">{tr(lang, 'pat_none')}</p>}
      </div>
    </div>
  );
}

// Patrones personales, redactados con cuidado (los revisa la Dra. Emilia antes del piloto).
function findPatterns(sessions, config, lang) {
  const out = [];
  // Código de colores: un color (no verde) que aparece 3+ días en la última semana
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
  const since = localDate(weekAgo);
  const daysByColor = new Map();
  sessions.filter((s) => s.localDate >= since).forEach((s) => {
    const c = sessionColor(config, s); if (!c || c === 'verde') return;
    if (!daysByColor.has(c)) daysByColor.set(c, new Set()); daysByColor.get(c).add(s.localDate);
  });
  const top = [...daysByColor.entries()].sort((a, b) => b[1].size - a[1].size)[0];
  if (top && top[1].size >= 3) out.push({ icon: 'sparkle', color: hexOf(config, top[0]), t: tr(lang, 'pat_color', { c: L(config.colors[top[0]].name, lang), n: top[1].size }) });
  const hardRate = (arr) => (arr.length ? arr.filter((s) => HARD.includes(s.answers.animo) || s.answers.animo === 'regular').length / arr.length : 0);
  const poor = sessions.filter((s) => s.answers.sueno && s.answers.sueno !== 'bien'), good = sessions.filter((s) => s.answers.sueno === 'bien' || s.answers.animo === 'bien');
  if (poor.length >= 3 && hardRate(poor) - hardRate(good) > 0.25) out.push({ icon: 'moon', t: tr(lang, 'pat_sleep') });
  const end = sessions.filter((s) => s.dom >= 27 || s.dom <= 1), mid = sessions.filter((s) => s.dom > 1 && s.dom < 27);
  const hr = (arr) => (arr.length ? arr.filter((s) => HARD.includes(s.answers.animo)).length / arr.length : 0);
  if (end.length >= 3 && hr(end) - hr(mid) > 0.2) out.push({ icon: 'calendar', t: tr(lang, 'pat_month') });
  const byDow = [0, 1, 2, 3, 4, 5, 6].map((d) => sessions.filter((s) => s.dow === d));
  const overall = hr(sessions);
  const worst = byDow.map((a, d) => ({ d, n: a.length, r: hr(a) })).filter((x) => x.n >= 3).sort((a, b) => b.r - a.r)[0];
  if (worst && worst.r - overall > 0.2) out.push({ icon: 'calendar', t: tr(lang, 'pat_dow', { d: DOW[lang][worst.d] }) });
  const am = sessions.filter((s) => s.hour < 15), pm = sessions.filter((s) => s.hour >= 19);
  if (am.length >= 3 && pm.length >= 3 && hr(pm) - hr(am) > 0.2) out.push({ icon: 'moon', t: tr(lang, 'pat_night') });
  const helped = sessions.filter((s) => s.actionDone && s.answers.ayudo === 'si');
  if (helped.length >= 3) {
    const c = new Map(); helped.forEach((s) => c.set(s.actionId, (c.get(s.actionId) || 0) + 1));
    const best = [...c.entries()].sort((a, b) => b[1] - a[1])[0];
    if (best && config.actions[best[0]]) out.push({ icon: config.actions[best[0]].icon || 'sparkle', t: tr(lang, 'pat_help', { a: L(config.actions[best[0]].title, lang).toLowerCase() }) });
  }
  return out.slice(0, 4);
}

// ---------------- Yo ----------------
function Me({ config, lang, profile, onDeleted }) {
  const [email, setEmail] = useState(store.getIdentity(profile.pid)?.email || '');
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const st = stageFor(config, leavesFrom(store.mySessions()));
  return (
    <div className="screen with-nav">
      <h2 className="page-title">{tr(lang, 'me_title')}</h2>
      <div className="card">
        <div className="field"><label htmlFor="me-name">{tr(lang, 'name_title')}</label>
          <input id="me-name" className="line" defaultValue={profile.avatarName || ''} maxLength={20} onBlur={(e) => store.updateProfile(profile.pid, { avatarName: e.target.value.trim() })} placeholder={tr(lang, 'name_ph')} /></div>
        <div className="field"><label>{tr(lang, 'language')}</label>
          <div className="seg">{[['es', 'Español'], ['en', 'English'], ['pt', 'Português'], ['ko', '한국어']].map(([c, l]) => <button key={c} className={lang === c ? 'on' : ''} onClick={() => { sfx.tap(); store.updateProfile(profile.pid, { lang: c }); store.setSiteLang(c); }}>{l}</button>)}</div></div>
        <div className="field"><label htmlFor="me-country">{tr(lang, 'country')}</label>
          <select id="me-country" className="line" value={profile.country || 'OTHER'} onChange={(e) => store.updateProfile(profile.pid, { country: e.target.value })}>
            {Object.entries(COUNTRIES).map(([c, n]) => <option key={c} value={c}>{n[{ es: 0, en: 1, pt: 2, ko: 3 }[lang]]}</option>)}
          </select></div>
        <div className="field"><label>{tr(lang, 'reminders')}</label>
          <div className="seg">{['ambos', 'manana', 'noche', 'ninguno'].map((c) => <button key={c} className={profile.reminder === c ? 'on' : ''} onClick={() => store.updateProfile(profile.pid, { reminder: c })}>{tr(lang, 'reminder_' + c)}</button>)}</div>
          <span className="small muted">{tr(lang, 'reminders_note')}</span></div>
      </div>
      <div className="card">
        <h3 className="card-k">{tr(lang, 'save_map')}</h3>
        <span className="small">{tr(lang, 'save_map_body')}</span>
        <form className="row" onSubmit={(e) => { e.preventDefault(); if (/\S+@\S+\.\S+/.test(email)) { store.saveIdentity(profile.pid, email.trim()); setSaved(true); sfx.select(); } }}>
          <input id="me-email" className="line" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setSaved(false); }} placeholder="tu@email.com" style={{ flex: 2, minWidth: 0 }} />
          <button className="btn small" type="submit">{saved ? tr(lang, 'saved') : tr(lang, 'save')}</button>
        </form>
      </div>
      <div className="card">
        <h3 className="card-k">{tr(lang, 'stages_title')}</h3>
        <div className="stages">
          {config.stages.map((s, i) => (
            <div key={s.id} className={i === st.index ? 'on' : ''}>
              <Creature stage={s.id} size={104} />
              <b>{L(s.name, lang)}</b><span className="muted num small"><Icon name="leaf" size={14} /> {s.min}+</span>
            </div>
          ))}
        </div>
      </div>
      <ProgramNote lang={lang} />
      <div className="card">
        <h3 className="card-k"><Icon name="lock" size={18} />{tr(lang, 'privacy_title')}</h3>
        <span className="small">{tr(lang, 'consent_2')} {tr(lang, 'consent_3')}</span>
        {config.bibleVersions[lang]?.credit && <span className="small muted">{config.bibleVersions[lang].credit}</span>}
        {!confirm ? <button className="btn small ghost" onClick={() => setConfirm(true)}>{tr(lang, 'delete_data')}</button> : (
          <div className="note warn col">
            {tr(lang, 'delete_confirm')}
            <div className="row"><button className="btn small danger" onClick={() => { store.deleteMyData(); onDeleted(); }}>{tr(lang, 'yes_delete')}</button><button className="btn small ghost" onClick={() => setConfirm(false)}>{tr(lang, 'cancel')}</button></div>
          </div>
        )}
      </div>
      <a className="link center-text" href="#">← Accesos</a>
    </div>
  );
}
