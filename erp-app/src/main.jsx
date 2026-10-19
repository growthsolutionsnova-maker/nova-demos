import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import * as store from './lib/store.js';
import AppShell, { useStore } from './app/App.jsx';
import Admin from './admin/Admin.jsx';
import Dashboard from './dash/Dashboard.jsx';
import Lab from './lab/Lab.jsx';
import Creature from './app/Creature.jsx';
import { Icon } from './app/icons.jsx';

function useHash() {
  const [h, setH] = useState(() => (location.hash || '').replace('#', ''));
  useEffect(() => { const f = () => { setH((location.hash || '').replace('#', '')); window.scrollTo(0, 0); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return h;
}

// Textos de la página de accesos (ES / EN / PT). Sin nombres de personas.
const T = {
  es: {
    intro: 'El juego diario de emociones y el motor de datos detrás. Elige por dónde entrar.',
    introLive: 'Piloto: el juego diario de emociones y el motor de datos detrás. Elige por dónde entrar.',
    appTitle: 'La app', appWho: 'Para la persona · ES / EN / PT',
    appBody: 'Check-in de 1 minuto con emojis, preguntas de 1 a 4 opciones, reflexión, parecer, acción y versículo. La larvita crece hasta ser mariposa. Incluye mapa de emociones, respiración SOS y protocolo de crisis.',
    openApp: 'Abrir la app', appNote: 'Se ve mejor en el celular. Sin registro para empezar.',
    admin: 'Edita preguntas, opciones, reglas, versículos y líneas de crisis en ES/EN/PT, sin programar. Publica versiones.',
    dashboard: 'Personas activas, retención, dónde abandonan, qué ayuda y a qué hora entran. Todo agregado.',
    lab: 'Cruces de variables con χ², patrones por día del mes, historial de cada persona por código y exportación a CSV / SPSS.',
    enter: 'Entrar a', user: 'Usuario', pass: 'Clave', go: 'Entrar', going: 'Entrando…',
    footLive: 'Piloto: las respuestas se guardan en una base de datos protegida, con un código en vez del nombre. El equipo entra con su email y clave. Contenido clínico y bíblico en revisión.',
    footDemo: 'Modo demo: lo que hagas se guarda solo en este navegador. El Dashboard y el Lab muestran además datos simulados (marcados). Contenido clínico y bíblico en revisión.',
    demoBtn: 'Ver demostración (datos simulados)', demoNote: 'Entra con un clic. Solo datos de ejemplo; no muestra datos de personas reales.', realLogin: 'Cuenta del equipo (datos reales)',
    teamOnly: 'Este acceso es para el equipo.', back: '← Volver a los accesos', checking: 'Verificando acceso…', noPerm: 'Tu cuenta no tiene permiso para esta sección.',
  },
  en: {
    intro: 'The daily feelings game and the data engine behind it. Choose where to go in.',
    introLive: 'Pilot: the daily feelings game and the data engine behind it. Choose where to go in.',
    appTitle: 'The app', appWho: 'For the person · ES / EN / PT',
    appBody: 'A 1-minute check-in with emojis, questions with 1 to 4 options, reflection, insight, action and Bible verse. The little caterpillar grows into a butterfly. Includes a feelings map, SOS breathing and a crisis protocol.',
    openApp: 'Open the app', appNote: 'Best on a phone. No sign-up to start.',
    admin: 'Edit questions, options, rules, verses and crisis lines in ES/EN/PT, with no coding. Publish versions.',
    dashboard: 'Active people, retention, where people drop off, what helps and what time they come in. All aggregated.',
    lab: 'Variable cross-tabs with χ², day-of-month patterns, each person\'s history by code, and export to CSV / SPSS.',
    enter: 'Go to', user: 'User', pass: 'Password', go: 'Sign in', going: 'Signing in…',
    footLive: 'Pilot: answers are stored in a protected database, with a code instead of a name. The team signs in with email and password. Clinical and biblical content under review.',
    footDemo: 'Demo mode: what you do is saved only in this browser. The Dashboard and Lab also show simulated data (marked). Clinical and biblical content under review.',
    demoBtn: 'View demo (simulated data)', demoNote: 'One click. Example data only; no real people\'s data is shown.', realLogin: 'Team account (real data)',
    teamOnly: 'This area is for the team.', back: '← Back to access', checking: 'Checking access…', noPerm: 'Your account does not have permission for this area.',
  },
  pt: {
    intro: 'O jogo diário de emoções e o motor de dados por trás. Escolha por onde entrar.',
    introLive: 'Piloto: o jogo diário de emoções e o motor de dados por trás. Escolha por onde entrar.',
    appTitle: 'O app', appWho: 'Para a pessoa · ES / EN / PT',
    appBody: 'Check-in de 1 minuto com emojis, perguntas de 1 a 4 opções, reflexão, parecer, ação e versículo. A lagartinha cresce até virar borboleta. Inclui mapa de emoções, respiração SOS e protocolo de crise.',
    openApp: 'Abrir o app', appNote: 'Fica melhor no celular. Sem cadastro para começar.',
    admin: 'Edite perguntas, opções, regras, versículos e linhas de crise em ES/EN/PT, sem programar. Publique versões.',
    dashboard: 'Pessoas ativas, retenção, onde desistem, o que ajuda e a que horas entram. Tudo agregado.',
    lab: 'Cruzamento de variáveis com χ², padrões por dia do mês, histórico de cada pessoa por código e exportação para CSV / SPSS.',
    enter: 'Entrar no', user: 'Usuário', pass: 'Senha', go: 'Entrar', going: 'Entrando…',
    footLive: 'Piloto: as respostas ficam em um banco de dados protegido, com um código no lugar do nome. A equipe entra com email e senha. Conteúdo clínico e bíblico em revisão.',
    footDemo: 'Modo demo: o que você fizer fica salvo só neste navegador. O Dashboard e o Lab mostram também dados simulados (marcados). Conteúdo clínico e bíblico em revisão.',
    demoBtn: 'Ver demonstração (dados simulados)', demoNote: 'Entra com um clique. Só dados de exemplo; não mostra dados de pessoas reais.', realLogin: 'Conta da equipe (dados reais)',
    teamOnly: 'Este acesso é para a equipe.', back: '← Voltar aos acessos', checking: 'Verificando acesso…', noPerm: 'Sua conta não tem permissão para esta seção.',
  },
};
const DOORS = { admin: ['pencil', 'Admin'], dashboard: ['chart', 'Dashboard'], lab: ['flask', 'Lab'] };

function getSiteLang() {
  try { const l = localStorage.getItem('erp.v1.siteLang'); if (l && T[l]) return l; } catch { /* */ }
  const n = (navigator.language || 'es').slice(0, 2);
  return T[n] ? n : 'es';
}
function useSiteLang() {
  const [lang, setLang] = useState(getSiteLang);
  const set = (l) => { setLang(l); try { localStorage.setItem('erp.v1.siteLang', l); } catch { /* */ } document.documentElement.lang = l; };
  return [lang, set];
}
function LangSwitch({ lang, setLang }) {
  return (
    <div className="segm" role="group" aria-label="Idioma / Language / Idioma" style={{ alignSelf: 'center' }}>
      {[['es', 'Español'], ['en', 'English'], ['pt', 'Português']].map(([c, l]) => <button key={c} className={lang === c ? 'on' : ''} onClick={() => setLang(c)} aria-pressed={lang === c}>{l}</button>)}
    </div>
  );
}

function Access() {
  const [pending, setPending] = useState(null);
  const [lang, setLang] = useSiteLang();
  const t = T[lang];
  return (
    <div className="access">
      <LangSwitch lang={lang} setLang={setLang} />
      <div className="intro">
        <Creature stage="mariposa" size={150} />
        <h1>Emotional Reconstruction Program</h1>
        <p className="muted" style={{ margin: 0, maxWidth: '58ch' }}>{store.live ? t.introLive : t.intro}</p>
      </div>
      <div className="doors">
        <div className="door main">
          <span className="door-ic"><Icon name="leaf" size={30} /></span>
          <h2>{t.appTitle}</h2>
          <span className="who">{t.appWho}</span>
          <p style={{ margin: 0 }}>{t.appBody}</p>
          <a className="btn" href="#app" style={{ textDecoration: 'none' }}>{t.openApp}</a>
          <span className="muted" style={{ fontSize: '0.85rem' }}>{t.appNote}</span>
        </div>
        {Object.entries(DOORS).map(([k, [e, name]]) => (
          <div className="door" key={k}>
            <h2 className="door-h"><span className="door-ic sm"><Icon name={e} size={22} /></span>{name}</h2>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>{t[k]}</p>
            {store.live ? <a className="btn small ghost" style={{ alignSelf: 'flex-start', textDecoration: 'none' }} href={'#' + k}>{t.enter} {name}</a> : pending === k ? (
              <form className="login" onSubmit={(ev) => { ev.preventDefault(); store.setSessionRole(store.demoAccounts[k].role); location.hash = k; }}>
                <span>{t.user} <code>{store.demoAccounts[k].email}</code></span><span>{t.pass} <code>demo</code></span>
                <button className="btn small violet" type="submit">{t.go}</button>
              </form>
            ) : <button className="btn small ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setPending(k)}>{t.enter} {name}</button>}
          </div>
        ))}
      </div>
      <p className="footnote">{store.live ? t.footLive : t.footDemo}</p>
    </div>
  );
}

const NEED = { admin: ['admin'], dashboard: ['admin', 'team', 'research'], lab: ['admin', 'research'] };

function StaffLogin({ area, t }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form className="login" style={{ flexDirection: 'column', alignItems: 'stretch' }} onSubmit={async (ev) => {
      ev.preventDefault(); setBusy(true); setErr('');
      try { const role = await store.staffSignIn(email, pw); if (!NEED[area].includes(role)) setErr(t.noPerm); }
      catch (e) { setErr(e.message); }
      setBusy(false);
    }}>
      <label className="field"><span><b>Email</b></span><input className="in" id="staff-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label className="field"><span><b>{t.pass}</b></span><input className="in" id="staff-pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required /></label>
      {err && <div className="note warn">{err}</div>}
      <button className="btn small violet" type="submit" disabled={busy}>{busy ? t.going : t.go}</button>
    </form>
  );
}

function Gate({ area, children }) {
  useStore();
  const [lang, setLang] = useSiteLang();
  const t = T[lang];
  const [checked, setChecked] = useState(!store.live);
  useEffect(() => { if (store.live) store.staffCheck().finally(() => setChecked(true)); }, []);
  const role = store.getSessionRole();
  const ok = store.live ? (role === 'demoview' || NEED[area].includes(role)) : (role === store.demoAccounts[area].role || role === 'admin');
  if (!checked) return <div className="access" style={{ justifyContent: 'center' }}><p className="muted">{t.checking}</p></div>;
  if (ok) return children;
  return (
    <div className="access" style={{ justifyContent: 'center' }}>
      <LangSwitch lang={lang} setLang={setLang} />
      <div className="door" style={{ maxWidth: 420, width: '100%' }}>
        <h2 className="door-h"><span className="door-ic sm"><Icon name={DOORS[area][0]} size={22} /></span>{DOORS[area][1]}</h2>
        <p style={{ margin: 0 }}>{t.teamOnly}</p>
        {store.live ? (
          <>
            <button className="btn violet" onClick={() => store.enterDemoView()}>{t.demoBtn}</button>
            <span className="muted" style={{ fontSize: '0.85rem' }}>{t.demoNote}</span>
            <div style={{ height: 1, background: 'var(--line)', margin: '6px 0' }} />
            <b style={{ fontSize: '0.92rem' }}>{t.realLogin}</b>
            <StaffLogin area={area} t={t} />
          </>
        ) : (
          <form className="login" onSubmit={(ev) => { ev.preventDefault(); store.setSessionRole(store.demoAccounts[area].role); }}>
            <span>{t.user} <code>{store.demoAccounts[area].email}</code></span><span>{t.pass} <code>demo</code></span>
            <button className="btn small violet" type="submit">{t.go}</button>
          </form>
        )}
        <a href="#" className="link" style={{ alignSelf: 'flex-start' }}>{t.back}</a>
      </div>
    </div>
  );
}

function Root() {
  const h = useHash();
  useEffect(() => { document.title = { app: 'App · ERP', admin: 'Admin · ERP', dashboard: 'Dashboard · ERP', lab: 'Lab · ERP' }[h] || 'Emotional Reconstruction Program'; }, [h]);
  if (h === 'app') return <AppShell />;
  if (h === 'admin') return <Gate area="admin"><Admin /></Gate>;
  if (h === 'dashboard') return <Gate area="dashboard"><Dashboard /></Gate>;
  if (h === 'lab') return <Gate area="lab"><Lab /></Gate>;
  return <Access />;
}

store.init();
createRoot(document.getElementById('root')).render(<Root />);
