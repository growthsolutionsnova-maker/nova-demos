// Datos SIMULADOS para que el Dashboard y el Lab se vean vivos en la demo.
// Siempre marcados con sim:true. Incluyen patrones plausibles (fin de mes, sueño, ciclo, noches)
// para mostrar lo que el Lab puede detectar. No son datos de personas reales.
import { localDateStr } from './util.js';
import { evaluate } from './engine.js';

function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulate(config, { people = 140, days = 63, seed = 1712 } = {}) {
  const r = rng(seed);
  const pick = (arr, w) => {
    if (!w) return arr[Math.floor(r() * arr.length)];
    const tot = w.reduce((a, b) => a + b, 0); let x = r() * tot;
    for (let i = 0; i < arr.length; i++) { x -= w[i]; if (x <= 0) return arr[i]; }
    return arr[arr.length - 1];
  };
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const countries = ['CO', 'MX', 'US', 'BR', 'ES'];
  const langOf = { CO: 'es', MX: 'es', ES: 'es', BR: 'pt', US: null };
  const profiles = [], sessions = [];

  for (let i = 0; i < people; i++) {
    const country = pick(countries, [30, 20, 25, 15, 10]);
    const lang = langOf[country] || pick(['es', 'en'], [65, 35]);
    const age = pick(['13_17', '18_29', '30_49', '50_mas'], [8, 34, 40, 18]);
    const cycle = r() < 0.42; // registra "en mis días" a veces
    const cycleStart = Math.floor(r() * 28);
    const type = pick(['early', 'casual', 'regular'], [52, 30, 18]);
    const baseline = r() * 0.5 - 0.15; // tendencia personal (más alto = más difícil)
    const startAgo = Math.floor(r() * (days - 3)) + 2;
    const start = new Date(today); start.setDate(start.getDate() - startAgo);
    const pid = 'sim_' + (1000 + i).toString(36) + Math.floor(r() * 1e4).toString(36);
    profiles.push({ pid, sim: true, createdAt: start.toISOString(), lang, country, age,
      motive: pick(['entenderme', 'paz', 'dios', 'curiosidad'], [35, 30, 25, 10]),
      reminder: pick(['ambos', 'manana', 'noche', 'ninguno'], [45, 20, 20, 15]), consentData: true, consentResearch: r() < 0.78 });

    const activeDays = type === 'early' ? 1 + Math.floor(r() * 3) : startAgo;
    for (let d = 0; d <= Math.min(startAgo, activeDays + (type === 'early' ? 0 : 0)); d++) {
      const date = new Date(start); date.setDate(date.getDate() + d);
      if (date > today) break;
      const daysIn = d;
      // probabilidad de usar ese día: decae con el tiempo
      let pDay = type === 'regular' ? 0.82 - daysIn * 0.004 : type === 'casual' ? 0.3 - daysIn * 0.003 : 0.6;
      if (d === 0) pDay = 1;
      if (r() > pDay) continue;
      const slots = type === 'regular' && r() < 0.55 ? ['am', 'pm'] : [r() < 0.55 ? 'am' : 'pm'];
      for (const slot of slots) {
        const hour = slot === 'am' ? pick([6, 7, 8, 9, 10, 12], [8, 25, 30, 15, 8, 6]) : pick([15, 18, 20, 21, 22, 23], [6, 12, 22, 28, 22, 10]);
        const dt = new Date(date); dt.setHours(hour, Math.floor(r() * 60), 0, 0);
        if (dt > new Date()) continue;
        sessions.push(makeSession({ r, pick, pid, dt, config, baseline, cycle, cycleStart, slot }));
      }
    }
  }
  sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  return { profiles, sessions };
}

function makeSession({ r, pick, pid, dt, config, baseline, cycle, cycleStart, slot }) {
  const dom = dt.getDate(), dow = dt.getDay(), hour = dt.getHours();
  const dayOfYear = Math.floor(dt.getTime() / 86400000);
  const inCycle = cycle && ((dayOfYear - cycleStart) % 28 + 28) % 28 < 4;
  const endMonth = dom >= 27 || dom <= 1;

  const sueno = pick(['bien', 'poco', 'mal'], [55, 30, 15]);
  const comida = pick(['si', 'poco', 'no'], [68, 24, 8]);
  let cuerpo = pick(['bien', 'enfermo', 'dolor'], [84, 9, 7]);
  if (inCycle && r() < 0.8) cuerpo = 'ciclo';

  // "dificultad" del momento: suma de factores
  let diff = baseline + (r() - 0.5) * 0.9;
  if (sueno === 'poco') diff += 0.35; if (sueno === 'mal') diff += 0.7;
  if (comida === 'no') diff += 0.3;
  if (cuerpo !== 'bien') diff += 0.4;
  if (endMonth) diff += 0.45;
  if (dow === 1 || dow === 2) diff += 0.18;
  if (slot === 'pm' && hour >= 21) diff += 0.15;

  const mood = diff < 0.15 ? 'bien' : diff < 0.6 ? 'regular' : diff < 1.25 ? 'mal' : 'muy_mal';
  const answers = { animo: mood };
  let emotion;
  if (mood === 'bien') emotion = pick(['alegria', 'paz', 'gratitud', 'energia'], [30, 30, 25, 15]);
  else if (mood === 'regular') emotion = sueno !== 'bien' ? pick(['cansancio', 'preocupacion', 'confusion', 'aburrimiento'], [50, 25, 12, 13]) : pick(['cansancio', 'preocupacion', 'confusion', 'aburrimiento'], [22, 40, 18, 20]);
  else if (mood === 'mal') emotion = endMonth ? pick(['tristeza', 'ansiedad', 'rabia', 'desanimo'], [18, 52, 12, 18]) : inCycle ? pick(['tristeza', 'ansiedad', 'rabia', 'desanimo'], [30, 15, 30, 25]) : hour >= 21 ? pick(['tristeza', 'ansiedad', 'rabia', 'desanimo'], [42, 25, 10, 23]) : pick(['tristeza', 'ansiedad', 'rabia', 'desanimo'], [28, 34, 16, 22]);
  else emotion = pick(['miedo', 'soledad', 'agotamiento', 'no_puedo'], endMonth ? [45, 15, 25, 15] : hour >= 21 ? [18, 42, 22, 18] : [25, 28, 32, 15]);
  answers.emocion = emotion;

  const path = ['mood', { bien: 'feel_good', regular: 'feel_meh', mal: 'feel_bad', muy_mal: 'feel_worst' }[mood]];
  let crisis = false;
  if (mood === 'muy_mal') {
    path.push('safety');
    const s = pick(['a_salvo', 'no_seguro', 'hacerme_dano', 'me_hacen_dano'], emotion === 'no_puedo' ? [70, 15, 12, 3] : [91, 5, 3, 1]);
    answers.seguridad = s;
    if (s !== 'a_salvo') crisis = true;
  }
  if (!crisis) {
    if (mood === 'bien') { answers.fuente_bien = pick(['descanso', 'personas', 'logro', 'dios'], [30, 30, 15, 25]); path.push('good_source'); }
    else {
      answers.sueno = sueno; answers.comida = comida; answers.cuerpo = cuerpo;
      let tema;
      if (endMonth) tema = pick(['dinero', 'trabajo', 'personas', 'futuro', 'noticias', 'soledad', 'nada'], [45, 20, 12, 10, 4, 5, 4]);
      else if (emotion === 'soledad') tema = pick(['personas', 'soledad', 'futuro', 'nada'], [30, 50, 10, 10]);
      else tema = pick(['dinero', 'trabajo', 'personas', 'futuro', 'noticias', 'soledad', 'nada'], [14, 26, 24, 13, 8, 7, 8]);
      answers.tema = tema;
      path.push('sleep', 'food', 'body', 'mind');
      if (['futuro', 'noticias', 'soledad', 'nada'].includes(tema)) path.push('mind2');
    }
    answers.necesidad = pick(['descansar', 'escucha', 'esperanza', 'no_se'], sueno === 'mal' ? [55, 15, 20, 10] : [22, 28, 32, 18]);
    path.push('reflect');
  }

  // abandono a mitad de camino (~13%)
  let completed = !crisis;
  let lastScreen = path[path.length - 1];
  if (!crisis && r() < 0.13) {
    const cut = pick([1, 2, 3, 4, 5, 6], [10, 14, 12, 16, 26, 22]);
    const cutAt = Math.min(cut, path.length - 1);
    const keep = path.slice(0, cutAt);
    for (const k of Object.keys(answers)) {
      const scr = { animo: 'mood', emocion: path[1], seguridad: 'safety', fuente_bien: 'good_source', sueno: 'sleep', comida: 'food', cuerpo: 'body', tema: 'mind', necesidad: 'reflect' }[k];
      if (!keep.includes(scr) && !(k === 'tema' && keep.includes('mind'))) delete answers[k];
    }
    path.length = cutAt; completed = false; lastScreen = path[path.length - 1];
  }

  const ev = completed ? evaluate(config, answers) : {};
  let helped, frequency, actionDone;
  if (completed) {
    actionDone = r() < 0.71;
    helped = actionDone ? pick(['si', 'poco', 'no'], [62, 29, 9]) : pick(['si', 'poco', 'no'], [34, 38, 28]);
    frequency = mood === 'bien' ? pick(['hoy', 'dias', 'siempre'], [50, 30, 20]) : diff > 1.1 ? pick(['hoy', 'dias', 'siempre'], [25, 40, 35]) : pick(['hoy', 'dias', 'siempre'], [55, 32, 13]);
    answers.ayudo = helped; answers.frecuencia = frequency;
  }

  return {
    sid: 's' + dt.getTime().toString(36) + Math.floor(r() * 1e6).toString(36), pid, sim: true,
    startedAt: dt.toISOString(), localDate: localDateStr(dt), hour, dow, dom, tzOffset: 0, configVersion: 1,
    answers, path, completed, lastScreen, crisis, crisisReason: crisis ? answers.seguridad : null,
    factor: ev.factor || null, actionId: ev.actionId || null, verseId: ev.verseId || null,
    actionDone: actionDone ?? null, durationMs: Math.round(35000 + r() * 70000),
  };
}
