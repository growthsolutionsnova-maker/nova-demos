// Los tres ejercicios de 1 minuto: respirar, atención (riachuelo) y bilateral (estrellas).
// "Media aspirina": dosis baja, simple y repetitiva (Dra. Emilia).
import React, { useEffect, useRef, useState } from 'react';
import { tr } from '../i18n.js';
import { Butterfly } from './Creature.jsx';
import Creature from './Creature.jsx';
import { Icon } from './icons.jsx';
import { breathSwell, startSoundscape, bilateralPulse, sfx } from './sound.js';

function Ring({ t, total, children }) {
  const r = 26, C = 2 * Math.PI * r, p = Math.min(1, t / total);
  return (
    <div className="ring">
      <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--line)" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--leaf)" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - p)} transform="rotate(-90 32 32)" />
      </svg>
      <span className="num">{children}</span>
    </div>
  );
}

function useClock(running, total, onEnd) {
  const [t, setT] = useState(0);
  const start = useRef(0);
  useEffect(() => {
    if (!running) return;
    start.current = performance.now() - t * 1000;
    let raf;
    const tick = () => {
      const s = (performance.now() - start.current) / 1000;
      if (s >= total) { setT(total); onEnd && onEnd(); return; }
      setT(s); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]); // eslint-disable-line
  return [t, setT];
}

function Shell({ lang, phase, onStart, onAgain, intro, done, children, compact, extra }) {
  return (
    <div className={'exercise' + (compact ? ' compact' : '')}>
      {children}
      {phase === 'ready' && (
        <>
          {intro && <p className="ex-intro">{intro}</p>}
          {extra}
          <button className="btn violet" onClick={onStart}>{tr(lang, 'breath_go')}</button>
        </>
      )}
      {phase === 'done' && (
        <>
          <p className="ex-intro done">{done}</p>
          {!compact && <button className="btn ghost small" onClick={onAgain}>{tr(lang, 'breath_again')}</button>}
        </>
      )}
    </div>
  );
}

// ---------- Respirar: un poco más lento (21-10), 6 respiraciones ≈ 1 minuto ----------
export function Breath({ lang, compact = false, onDone }) {
  const IN = 3800, OUT = 5800, CYCLES = 6;
  const [phase, setPhase] = useState('ready'); // ready | in | out | done
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (phase === 'in') { breathSwell(true, IN / 1000); const t = setTimeout(() => setPhase('out'), IN); return () => clearTimeout(t); }
    if (phase === 'out') {
      breathSwell(false, OUT / 1000);
      const t = setTimeout(() => {
        if (cycle + 1 >= CYCLES) { setPhase('done'); sfx.leaf(); onDone && onDone(); } else { setCycle(cycle + 1); setPhase('in'); }
      }, OUT);
      return () => clearTimeout(t);
    }
  }, [phase, cycle]); // eslint-disable-line
  const open = phase === 'in' ? 1 : phase === 'out' ? 0 : 0.6;
  const go = () => { setCycle(0); setPhase('in'); };
  return (
    <Shell lang={lang} compact={compact} phase={phase === 'in' || phase === 'out' ? 'run' : phase} onStart={go} onAgain={go}
      intro={tr(lang, 'breath_ready')} done={tr(lang, 'breath_done')}>
      <div className="ex-stage sky">
        <svg viewBox="0 0 240 200" className="ex-butterfly" style={{ '--breath-ms': (phase === 'in' ? IN : OUT) + 'ms' }} aria-hidden>
          <Butterfly open={open} flap={false} />
        </svg>
      </div>
      <div className="cue" aria-live="polite">{phase === 'in' ? tr(lang, 'breath_in') : phase === 'out' ? tr(lang, 'breath_out') : ''}</div>
      <div className="count" aria-hidden>{Array.from({ length: CYCLES }, (_, i) => <i key={i} className={i < cycle + (phase === 'done' ? 1 : 0) ? 'on' : ''} />)}</div>
    </Shell>
  );
}

// ---------- Atención: lluvia, riachuelo y trueno (1 minuto) ----------
// Más pausado (21-10): 0–36 s un sonido a la vez (12 s cada uno) · 36–54 s cambio cada 6 s · 54–60 s todos juntos
const ORDER = ['rain', 'creek', 'thunder'];
function focusAt(s) {
  if (s < 36) return ORDER[Math.floor(s / 12)];
  if (s < 54) return ['rain', 'thunder', 'creek'][Math.floor((s - 36) / 6)];
  return 'all';
}
export function Attention({ lang, compact = false, onDone }) {
  const TOTAL = 60;
  const [phase, setPhase] = useState('ready');
  const [flash, setFlash] = useState(0);
  const scape = useRef(null);
  const [t, setT] = useClock(phase === 'run', TOTAL, () => { setPhase('done'); sfx.leaf(); onDone && onDone(); });
  const focus = phase === 'run' ? focusAt(t) : null;
  useEffect(() => { if (scape.current && focus) scape.current.focus(focus); }, [focus]);
  useEffect(() => {
    if (phase !== 'run') { if (scape.current) { scape.current.stop(); scape.current = null; } return; }
    const sc = startSoundscape(); scape.current = sc;
    sc.onThunder(() => { setFlash((f) => f + 1); });
    sc.focus('rain');
    return () => { sc.stop(); scape.current = null; };
  }, [phase]);
  const go = () => { setT(0); setPhase('run'); };
  const cueText = { rain: tr(lang, 'att_rain'), creek: tr(lang, 'att_creek'), thunder: tr(lang, 'att_thunder'), all: tr(lang, 'att_all') }[focus];
  return (
    <Shell lang={lang} compact={compact} phase={phase} onStart={go} onAgain={go} intro={tr(lang, 'att_intro')} done={tr(lang, 'att_done')}>
      <div className={'ex-stage creek-scene' + (phase === 'run' ? ' raining' : '')}>
        <div key={flash} className={flash ? 'lightning' : ''} aria-hidden />
        <svg viewBox="0 0 320 180" className="creek-svg" aria-hidden>
          <path d="M0 120 Q80 100 160 118 T320 112 V180 H0Z" fill="var(--hill)" />
          <path d="M0 140 Q60 128 120 142 T240 138 T320 144 V160 Q260 152 200 160 T80 156 T0 162Z" fill="#7CC4F2" className="water" />
          <path d="M20 148 q20 -6 40 0 M140 150 q20 -6 40 0 M250 152 q20 -6 40 0" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".8" className="ripples" />
        </svg>
        <div className="creek-larva"><Creature stage="larvita" size={120} /></div>
        <div className="drops" aria-hidden>{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i * 0.21) % 2}s` }} />)}</div>
      </div>
      {phase === 'run' && <Ring t={t} total={TOTAL}>{Math.ceil(TOTAL - t)}</Ring>}
      <div className="sound-chips">
        {[['rain', 'rain', 'att_w_rain'], ['creek', 'creek', 'att_w_creek'], ['thunder', 'bolt', 'att_w_thunder']].map(([k, ic, w]) => (
          <span key={k} className={'schip' + (focus === k || focus === 'all' ? ' on' : '')}><Icon name={ic} size={20} />{tr(lang, w)}</span>
        ))}
      </div>
      <div className="cue" aria-live="polite">{cueText || ''}</div>
    </Shell>
  );
}

// ---------- Bilateral: izquierda, derecha (1 minuto) ----------
export function Bilateral({ lang, compact = false, onDone }) {
  const TOTAL = 60, STEP = 0.65; // un lado cada 0,65 s (un poco más lento, 21-10)
  const [phase, setPhase] = useState('ready');
  const [t, setT] = useClock(phase === 'run', TOTAL, () => { setPhase('done'); sfx.leaf(); onDone && onDone(); });
  const beat = phase === 'run' ? Math.floor(t / STEP) : -1;
  const side = beat < 0 ? 0 : beat % 2 === 0 ? -1 : 1;
  useEffect(() => { if (beat >= 0) bilateralPulse(side); }, [beat]); // eslint-disable-line
  const go = () => { setT(0); setPhase('run'); };
  return (
    <Shell lang={lang} compact={compact} phase={phase} onStart={go} onAgain={go} intro={tr(lang, 'bil_intro')} done={tr(lang, 'bil_done')}
      extra={<p className="ex-hint"><Icon name="headphones" size={20} /> {tr(lang, 'bil_headphones')}</p>}>
      <div className="ex-stage night">
        <div className={'bstar left' + (side === -1 ? ' on' : '')} aria-hidden><Icon name="star" size={46} stroke={2.2} /></div>
        <div className="bil-center" style={{ '--look': side * 5 + 'px' }}>
          <svg viewBox="0 0 240 200" className="ex-butterfly small" aria-hidden><Butterfly open={0.85} /></svg>
        </div>
        <div className={'bstar right' + (side === 1 ? ' on' : '')} aria-hidden><Icon name="star" size={46} stroke={2.2} /></div>
        {Array.from({ length: 14 }, (_, i) => <i key={i} className="twinkle-dot" style={{ left: `${(i * 23) % 100}%`, top: `${(i * 41) % 90}%`, animationDelay: `${i * 0.2}s` }} />)}
      </div>
      {phase === 'run' && <Ring t={t} total={TOTAL}>{Math.ceil(TOTAL - t)}</Ring>}
      <div className="cue" aria-live="polite">{phase === 'run' ? (side < 0 ? tr(lang, 'bil_left') : tr(lang, 'bil_right')) : ''}</div>
    </Shell>
  );
}

export function ExerciseFor({ kind, ...p }) {
  if (kind === 'attention') return <Attention {...p} />;
  if (kind === 'bilateral') return <Bilateral {...p} />;
  return <Breath {...p} />;
}
