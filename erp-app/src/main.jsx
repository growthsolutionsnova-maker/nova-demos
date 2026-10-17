import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import * as store from './lib/store.js';
import AppShell, { useStore } from './app/App.jsx';
import Admin from './admin/Admin.jsx';
import Dashboard from './dash/Dashboard.jsx';
import Lab from './lab/Lab.jsx';
import Creature from './app/Creature.jsx';

function useHash() {
  const [h, setH] = useState(() => (location.hash || '').replace('#', ''));
  useEffect(() => { const f = () => { setH((location.hash || '').replace('#', '')); window.scrollTo(0, 0); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return h;
}

const DOORS = {
  admin: ['🛠️', 'Admin', 'Emilia y Queren editan preguntas, opciones, reglas, versículos y líneas de crisis en ES/EN/PT, sin programar. Publican versiones.'],
  dashboard: ['📊', 'Dashboard', 'Equipo: personas activas, retención, dónde abandonan, qué ayuda, a qué hora entran. Todo agregado.'],
  lab: ['🔬', 'Lab', 'Dra. Emilia: cruces de variables con χ², patrones por día del mes, historial de cada persona por código y exportación a CSV / SPSS.'],
};

function Access() {
  const [pending, setPending] = useState(null);
  return (
    <div className="access">
      <div className="intro">
        <Creature stage="mariposa" size={150} />
        <h1>Emotional Reconstruction Program</h1>
        <p className="muted" style={{ margin: 0, maxWidth: '58ch' }}>Demo de la fase 1: el juego diario de emociones y el motor de datos detrás. Elige por dónde entrar.</p>
      </div>
      <div className="doors">
        <div className="door main">
          <span style={{ fontSize: 34 }} aria-hidden>🐛</span>
          <h2>La app</h2>
          <span className="who">Para la persona · ES / EN / PT</span>
          <p style={{ margin: 0 }}>Check-in de 1 minuto con emojis, preguntas de 1 a 4 opciones, reflexión, parecer, acción y versículo. La larvita crece hasta ser mariposa. Incluye mapa de emociones, respiración SOS y protocolo de crisis.</p>
          <a className="btn" href="#app" style={{ textDecoration: 'none' }}>Abrir la app</a>
          <span className="muted" style={{ fontSize: '0.85rem' }}>Se ve mejor en el celular. Sin registro para empezar.</span>
        </div>
        {Object.entries(DOORS).map(([k, [e, t, d]]) => (
          <div className="door" key={k}>
            <h2><span aria-hidden>{e}</span> {t}</h2>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>{d}</p>
            {pending === k ? (
              <form className="login" onSubmit={(ev) => { ev.preventDefault(); store.setSessionRole(store.demoAccounts[k].role); location.hash = k; }}>
                <span>Usuario <code>{store.demoAccounts[k].email}</code></span><span>Clave <code>demo</code></span>
                <button className="btn small violet" type="submit">Entrar</button>
              </form>
            ) : <button className="btn small ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setPending(k)}>Entrar a {t}</button>}
          </div>
        ))}
      </div>
      <p className="footnote">Modo demo: lo que hagas se guarda solo en este navegador y el Dashboard y el Lab muestran además datos simulados (marcados). En la fase 2 se conecta a una base de datos real con cuentas y permisos por rol. Contenido clínico y bíblico: borrador para revisión de la Dra. Emilia.</p>
    </div>
  );
}

function Gate({ area, children }) {
  useStore();
  const role = store.getSessionRole();
  const need = store.demoAccounts[area].role;
  const ok = role === need || role === 'admin';
  if (ok) return children;
  return (
    <div className="access" style={{ justifyContent: 'center' }}>
      <div className="door" style={{ maxWidth: 420 }}>
        <h2>{DOORS[area][0]} {DOORS[area][1]}</h2>
        <p style={{ margin: 0 }}>Este acceso es para el equipo.</p>
        <form className="login" onSubmit={(ev) => { ev.preventDefault(); store.setSessionRole(need); }}>
          <span>Usuario <code>{store.demoAccounts[area].email}</code></span><span>Clave <code>demo</code></span>
          <button className="btn small violet" type="submit">Entrar</button>
        </form>
        <a href="#" className="link" style={{ alignSelf: 'flex-start' }}>← Volver a los accesos</a>
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

createRoot(document.getElementById('root')).render(<Root />);
