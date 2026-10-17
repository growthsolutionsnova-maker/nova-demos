import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultConfig } from '../src/lib/content.js';
import { nextStep, evaluate, detectCrisis, validateConfig, stageFor } from '../src/lib/engine.js';
import { simulate } from '../src/lib/sim.js';
import { kpis, crosstab, codebook, byDayOfMonth, funnel, toCSV, spssSyntax } from '../src/lib/analytics.js';

const cfg = defaultConfig();

test('el contenido por defecto es válido (máx. 4 opciones, sin enlaces rotos)', () => {
  const errs = validateConfig(cfg).filter((i) => i.level === 'error');
  assert.deepEqual(errs, []);
});

test('protocolo de crisis: las 3 respuestas de riesgo interrumpen el juego', () => {
  for (const code of ['no_seguro', 'hacerme_dano', 'me_hacen_dano']) assert.equal(nextStep(cfg, 'safety', code), '@crisis');
  assert.equal(nextStep(cfg, 'safety', 'a_salvo'), 'sleep');
  assert.equal(nextStep(cfg, 'mood', 'muy_mal'), 'feel_worst');
  assert.equal(nextStep(cfg, 'feel_worst', 'miedo'), 'safety');
});

test('protocolo de crisis: palabras clave en ES/EN/PT, con o sin tildes', () => {
  assert.ok(detectCrisis(cfg, 'Ya no quiero vivir'));
  assert.ok(detectCrisis(cfg, 'quiero hacerme DAÑO'));
  assert.ok(detectCrisis(cfg, 'quiero hacerme dano'));
  assert.ok(detectCrisis(cfg, 'I want to die'));
  assert.ok(detectCrisis(cfg, 'eu quero morrer'));
  assert.ok(!detectCrisis(cfg, 'estoy cansada del trabajo'));
});

test('reglas: elige el factor de mayor peso', () => {
  assert.equal(evaluate(cfg, { animo: 'mal', emocion: 'ansiedad', sueno: 'mal', tema: 'dinero' }).factor, 'sueno');
  assert.equal(evaluate(cfg, { animo: 'mal', emocion: 'ansiedad', sueno: 'bien', comida: 'si', cuerpo: 'bien', tema: 'dinero' }).factor, 'dinero');
  assert.equal(evaluate(cfg, { animo: 'bien', emocion: 'paz' }).factor, 'positivo');
  assert.equal(evaluate(cfg, { animo: 'regular', emocion: 'confusion', sueno: 'bien', comida: 'si', cuerpo: 'bien', tema: 'nada' }).factor, 'ninguno');
});

test('metamorfosis por etapas', () => {
  assert.equal(stageFor(cfg, 0).stage.id, 'larvita');
  assert.equal(stageFor(cfg, 12).stage.id, 'capullo');
  assert.equal(stageFor(cfg, 40).stage.id, 'mariposa');
});

test('simulación + analítica', () => {
  const d = simulate(cfg);
  assert.ok(d.sessions.length > 500, 'sesiones: ' + d.sessions.length);
  const k = kpis(d, 30);
  console.log('KPIs', JSON.stringify(k));
  const vars = codebook(cfg);
  const x = crosstab({ ...d, answers: [] }, vars.find((v) => v.id === 'sueno'), vars.find((v) => v.id === 'animo'));
  console.log('sueño×ánimo chi2', x.chi2.toFixed(1), 'p', x.p, 'V', x.cramerV.toFixed(2));
  assert.ok(x.p < 0.05);
  const dm = byDayOfMonth(d, 'emocion', ['ansiedad', 'preocupacion', 'miedo']);
  console.log('ansiedad días 27-31 vs 10-20', (dm.slice(26).reduce((a, b) => a + b.rate, 0) / 5).toFixed(2), (dm.slice(9, 20).reduce((a, b) => a + b.rate, 0) / 11).toFixed(2));
  console.log('funnel', funnel(d).map((f) => f.step + ':' + Math.round(f.rate * 100)).join(' '));
  const csv = toCSV(d, cfg); assert.ok(csv.split('\n').length === d.sessions.length + 1);
  assert.ok(spssSyntax(cfg).includes('VALUE LABELS emocion'));
});
