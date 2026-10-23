// Sonidos generados en el teléfono con Web Audio: nada se descarga y funciona sin internet.
// Sonidos de interfaz, respiración, lluvia, riachuelo, trueno y tono bilateral.
// Volumen general suave (21-10: "el sonido está muy fuerte").
const MASTER = 0.45;

let ctx = null;
let master = null;
const KEY = 'erp.v1.sound';
export function soundOn() { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } }
export function setSoundOn(on) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* */ }
  if (master) master.gain.value = on ? MASTER : 0;
}

function ac() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = soundOn() ? MASTER : 0;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function haptic(ms = 8) { try { if (soundOn() && navigator.vibrate) navigator.vibrate(ms); } catch { /* */ } }

function tone(freq, start, dur, { type = 'sine', vol = 0.18, pan = 0, attack = 0.01 } = {}) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.value = freq;
  const t0 = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node = g;
  if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); node = p; }
  o.connect(g); node.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

// ---------- Interfaz ----------
export const sfx = {
  tap() { tone(740, 0, 0.08, { vol: 0.08, type: 'triangle' }); haptic(6); },
  select() { tone(523, 0, 0.12, { vol: 0.09, type: 'triangle' }); tone(784, 0.07, 0.16, { vol: 0.09, type: 'triangle' }); haptic(10); },
  next() { tone(659, 0, 0.1, { vol: 0.08, type: 'sine' }); },
  leaf() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.32, { vol: 0.09, type: 'triangle' })); haptic(20); },
  grow() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.1, 0.45, { vol: 0.09, type: 'triangle' })); haptic(40); },
  soft() { tone(440, 0, 0.5, { vol: 0.07, attack: 0.08 }); },
  wing() { // aleteo suave
    const c = ac(); if (!c) return;
    for (let i = 0; i < 3; i++) noiseBurst(i * 0.11, 0.09, 1800, 0.05);
  },
};

// ---------- Ruido ----------
const noiseBufs = {};
function noiseBuffer(kind = 'pink') {
  const c = ac(); if (!c) return null;
  if (noiseBufs[kind]) return noiseBufs[kind];
  const len = c.sampleRate * 3; const buf = c.createBuffer(1, len, c.sampleRate); const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    else { b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0527; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; }
  }
  noiseBufs[kind] = buf;
  return buf;
}
function noiseSource(kind) {
  const c = ac(); const s = c.createBufferSource();
  s.buffer = noiseBuffer(kind); s.loop = true; return s;
}
function noiseBurst(start, dur, freq, vol) {
  const c = ac(); if (!c) return;
  const s = noiseSource('pink'); const f = c.createBiquadFilter(); const g = c.createGain();
  f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
  const t0 = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.05);
}

// ---------- Respiración: sube al tomar aire, baja al soltarlo ----------
export function breathSwell(inhale, seconds) {
  const c = ac(); if (!c) return;
  const s = noiseSource('pink'); const f = c.createBiquadFilter(); const g = c.createGain();
  f.type = 'lowpass'; f.Q.value = 0.5;
  const t0 = c.currentTime;
  f.frequency.setValueAtTime(inhale ? 300 : 1200, t0);
  f.frequency.linearRampToValueAtTime(inhale ? 1200 : 250, t0 + seconds);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(inhale ? 0.16 : 0.12, t0 + seconds * 0.45);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
  s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + seconds + 0.1);
  tone(inhale ? 392 : 330, 0, Math.min(1.4, seconds), { vol: 0.05, attack: 0.3 });
}

// ---------- Paisaje de atención: lluvia + riachuelo + truenos ----------
// Devuelve controles para subir el sonido en foco y apagar todo.
export function startSoundscape() {
  const c = ac(); if (!c) return { focus() {}, stop() {}, onThunder() {} };
  const out = c.createGain(); out.gain.value = 1; out.connect(master);
  const layer = (kind, type, freq, q, vol) => {
    const s = noiseSource(kind); const f = c.createBiquadFilter(); const g = c.createGain();
    f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(out); s.start();
    return { s, f, g, base: vol };
  };
  // 23-10: la lluvia manda; el riachuelo va más bajo y más lento, de fondo.
  const rain = layer('pink', 'highpass', 1100, 0.4, 0.17);
  const creek = layer('brown', 'bandpass', 420, 0.8, 0.09);
  // el riachuelo "burbujea" con una modulación muy lenta
  const lfo = c.createOscillator(); const lfoG = c.createGain();
  lfo.frequency.value = 0.12; lfoG.gain.value = 90; lfo.connect(lfoG); lfoG.connect(creek.f.frequency); lfo.start();
  let thunderCb = () => {};
  let thunderVol = 0.3;
  let timer = null;
  const thunder = () => {
    const s = noiseSource('brown'); const f = c.createBiquadFilter(); const g = c.createGain();
    f.type = 'lowpass'; f.frequency.value = 160;
    const t0 = c.currentTime;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(thunderVol, t0 + 0.25);
    g.gain.exponentialRampToValueAtTime(thunderVol * 0.5, t0 + 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.2);
    s.connect(f); f.connect(g); g.connect(out); s.start(t0); s.stop(t0 + 3.4);
    thunderCb();
    timer = setTimeout(thunder, 7500 + Math.random() * 3000);
  };
  timer = setTimeout(thunder, 2200);
  return {
    focus(which) { // 'rain' | 'creek' | 'thunder' | 'all'
      const t = c.currentTime;
      const set = (L, on) => L.g.gain.linearRampToValueAtTime(on ? L.base * 1.5 : L.base * 0.6, t + 1.2);
      if (which === 'all') { set(rain, true); set(creek, true); thunderVol = 0.35; rain.g.gain.linearRampToValueAtTime(rain.base, t + 1.2); creek.g.gain.linearRampToValueAtTime(creek.base, t + 1.2); return; }
      set(rain, which === 'rain'); set(creek, which === 'creek'); thunderVol = which === 'thunder' ? 0.5 : 0.2;
    },
    onThunder(cb) { thunderCb = cb; },
    stop() {
      clearTimeout(timer);
      const t = c.currentTime; out.gain.linearRampToValueAtTime(0.0001, t + 0.6);
      setTimeout(() => { try { rain.s.stop(); creek.s.stop(); lfo.stop(); out.disconnect(); } catch { /* */ } }, 700);
    },
  };
}

// ---------- Bilateral: tono suave que alterna oído izquierdo / derecho ----------
export function bilateralPulse(side) { // side: -1 izquierda, 1 derecha
  tone(side < 0 ? 261.6 : 293.7, 0, 0.55, { vol: 0.1, pan: side, attack: 0.06, type: 'sine' });
}

// ---------- Voz del versículo (sintética, la mejor disponible en el teléfono) ----------
export function pickVoice(lang) {
  try {
    const want = { es: 'es', en: 'en', pt: 'pt', ko: 'ko' }[lang] || 'es';
    const pref = { es: ['es-US', 'es-MX', 'es-419', 'es-ES'], en: ['en-US', 'en-GB'], pt: ['pt-BR', 'pt-PT'], ko: ['ko-KR'] }[lang] || [];
    const voices = window.speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith(want));
    const score = (v) => {
      let s = 0; const n = v.name.toLowerCase();
      if (/natural|neural|premium|enhanced|siri/.test(n)) s += 10;
      if (/google/.test(n)) s += 6;
      const i = pref.findIndex((p) => v.lang.toLowerCase() === p.toLowerCase()); if (i >= 0) s += 5 - i;
      if (v.localService) s += 1;
      return s;
    };
    return voices.sort((a, b) => score(b) - score(a))[0] || null;
  } catch { return null; }
}
export function speak(text, lang, onEnd) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(lang); if (v) u.voice = v;
    u.lang = v?.lang || { es: 'es-419', en: 'en-US', pt: 'pt-BR', ko: 'ko-KR' }[lang];
    u.rate = 0.9; u.pitch = 1;
    u.onend = onEnd; u.onerror = onEnd;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return true;
  } catch { return false; }
}
export function stopSpeaking() { try { window.speechSynthesis.cancel(); } catch { /* */ } }
