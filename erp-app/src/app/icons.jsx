// Íconos y caritas propios (sin emojis). Línea redondeada de 2px sobre una cuadrícula de 24.
import React from 'react';

export const ICON_NAMES = () => Object.keys(P);
const P = {
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
  moonHalf: <><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /><path d="M7 15h4" /></>,
  moonCloud: <><path d="M18 11a6 6 0 0 1-7.8-6.9A7 7 0 1 0 18 11Z" /><path d="M8 20h9a3 3 0 0 0 0-6 4 4 0 0 0-7.6 1.2A2.4 2.4 0 0 0 8 20Z" /></>,
  bowl: <><path d="M3 11h18a9 9 0 0 1-18 0Z" /><path d="M9 7c0-2 2-2 2-4M14 7c0-2 2-2 2-4" /></>,
  cookie: <><circle cx="12" cy="12" r="8" /><circle cx="9.5" cy="10" r=".8" /><circle cx="14" cy="9" r=".8" /><circle cx="13" cy="14.5" r=".8" /></>,
  bowlOff: <><path d="M3 11h18a9 9 0 0 1-18 0Z" /><path d="M4 4l16 16" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  thermo: <><path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0Z" /><path d="M12 9v7" /></>,
  bandage: <><rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)" /><path d="M11 11h.01M13 13h.01M13 11h.01M11 13h.01" /></>,
  drop: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />,
  coin: <><circle cx="12" cy="12" r="8" /><path d="M14.5 9.5c-.4-1-1.4-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.2-.6-2.6-1.6M12 6.5V8M12 16v1.5" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18" /></>,
  people: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.4" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M14.5 14.5A4.5 4.5 0 0 1 21 18.5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  compass: <><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
  phone: <><rect x="6.5" y="3" width="11" height="18" rx="2.5" /><path d="M11 17.5h2" /></>,
  house: <><path d="M4 11 12 4l8 7" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" /></>,
  dots: <path d="M6 12h.01M12 12h.01M18 12h.01" />,
  bed: <><path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5" /><circle cx="7" cy="11" r="1.6" /></>,
  ear: <><path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-5.5 1.6" /><path d="M10 9.5a2 2 0 0 1 4 0c0 1.5-1.5 2-1.5 3" /></>,
  sunrise: <><path d="M3 18h18M7 18a5 5 0 0 1 10 0M12 4v4M5 9l1.6 1.6M19 9l-1.6 1.6" /><path d="M8 21h8" /></>,
  thought: <><path d="M7 15h10a4 4 0 0 0 .5-8A5 5 0 0 0 8 6.5 4.2 4.2 0 0 0 7 15Z" /><circle cx="8" cy="19" r="1.2" /><circle cx="5" cy="21.5" r=".6" /></>,
  question: <><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.5M12 16.5h.01" /></>,
  lifebuoy: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.5" /><path d="m6 6 3.5 3.5M14.5 14.5 18 18M18 6l-3.5 3.5M9.5 14.5 6 18" /></>,
  hand: <><path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V5a1.5 1.5 0 0 1 3 0v6M14 11V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5A5.5 5.5 0 0 1 6 17.5L4.6 14a1.5 1.5 0 0 1 2.7-1.3L8 14" /></>,
  thumbUp: <><path d="M7 11v9H4v-9h3ZM7 11l4-7a2 2 0 0 1 2 2.3L12.5 10H18a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 16.8 20H7" /></>,
  thumbMid: <><path d="M4 12h16" /><circle cx="12" cy="12" r="8.5" /></>,
  thumbDown: <><path d="M7 13V4H4v9h3ZM7 13l4 7a2 2 0 0 0 2-2.3L12.5 14H18a2 2 0 0 0 2-2.3l-1.2-6A2 2 0 0 0 16.8 4H7" /></>,
  pin: <><path d="M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11Z" /><circle cx="12" cy="10" r="2.2" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  repeat: <><path d="M17 3l3 3-3 3" /><path d="M4 12v-1a5 5 0 0 1 5-5h11M7 21l-3-3 3-3" /><path d="M20 12v1a5 5 0 0 1-5 5H4" /></>,
  star: <path d="m12 3.5 2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8L12 3.5Z" />,
  sparkle: <><path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z" /><path d="M19 16c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5Z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
  bellOff: <><path d="M6 16h12l-1.5-2V10a4.5 4.5 0 0 0-7.6-3.3M7.5 10v4L6 16M10 19.5a2 2 0 0 0 4 0M4 4l16 16" /></>,
  dove: <><path d="M4 14c3 0 5-1 7-4l2-4 3 2 4-1-3 4c0 4-3 7-8 7H5l3-3" /><circle cx="15.5" cy="8" r=".6" /></>,
  butterfly: <><path d="M12 8c-2-3.5-7-5-8-2.5S5 12 9 12.5c-3 1-3.5 5-1.5 6s3.5-2 4.5-4.5c1 2.5 2.5 5.5 4.5 4.5s1.5-5-1.5-6c4-.5 6-4.5 5-7S14 4.5 12 8Z" /><path d="M12 8v9" /></>,
  waves: <path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />,
  stars: <><path d="M6 6.5c.4 2 1 2.6 3 3-2 .4-2.6 1-3 3-.4-2-1-2.6-3-3 2-.4 2.6-1 3-3ZM18 11.5c.4 2 1 2.6 3 3-2 .4-2.6 1-3 3-.4-2-1-2.6-3-3 2-.4 2.6-1 3-3Z" /><path d="M10 18h4" /></>,
  window: <><rect x="4" y="3.5" width="16" height="17" rx="2" /><path d="M12 3.5v17M4 12h16" /></>,
  chat: <path d="M5 18.5V6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H9l-4 2.5Z" />,
  speaker: <><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>,
  speakerOff: <><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="m16 9.5 5 5M21 9.5l-5 5" /></>,
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="2" />,
  pencil: <><path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1Z" /><path d="m14.5 6.5 3 3" /></>,
  stretch: <><circle cx="12" cy="4.5" r="2" /><path d="M5 4l5 5h4l5-5M12 9v6l-3 6M12 15l3 6" /></>,
  flower: <><circle cx="12" cy="9" r="2.3" /><path d="M12 6.7c0-3 3.5-3 3.5-.5 2.5-1.3 4 1.8 1.5 3 2.5 1.2 1 4.3-1.5 3 0 2.6-3.5 2.6-3.5-.2-0 2.8-3.5 2.8-3.5.2-2.5 1.3-4-1.8-1.5-3-2.5-1.2-1-4.3 1.5-3 0-2.5 3.5-2.5 3.5.5Z" /><path d="M12 13v8M12 18c-2 0-3.5-1-4-3M12 17c2 0 3.5-1 4-3" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  book: <><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5v-15ZM20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5v-15Z" /></>,
  arrowLeft: <path d="M15 5l-7 7 7 7" />,
  arrowRight: <path d="M9 5l7 7-7 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  leaf: <><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><path d="M5 19c3-4 6-6 9-7.5" /></>,
  map: <><path d="M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5-5.5 2.5Z" /><path d="M9 4v13.5M15 6.5V20" /></>,
  user: <><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
  shield: <><path d="M12 3 5 6v5.5c0 4.5 3 7.5 7 9.5 4-2 7-5 7-9.5V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  headphones: <><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><rect x="3.5" y="14" width="4" height="6.5" rx="1.8" /><rect x="16.5" y="14" width="4" height="6.5" rx="1.8" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.8 2.5 14.2 0 17M12 3.5c-2.5 2.8-2.5 14.2 0 17" /></>,
  rain: <><path d="M7 13h10a4 4 0 0 0 .5-8A5 5 0 0 0 8 4.5 4.2 4.2 0 0 0 7 13Z" /><path d="M8 16l-1 3M12 16l-1 3M16 16l-1 3" /></>,
  bolt: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" />,
  creek: <><path d="M3 18c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" /><path d="M3 13c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" /><path d="M6 8l2-3 2 3M14 8l2-3 2 3" /></>,
  sos: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5M12 16h.01" /></>,
  download: <><path d="M12 4v11M7 10.5l5 5 5-5" /><path d="M5 19.5h14" /></>,
  chart: <><path d="M4 20V4M4 20h16" /><rect x="7" y="11" width="3" height="6" rx="1" /><rect x="12" y="7" width="3" height="10" rx="1" /><rect x="17" y="13" width="3" height="4" rx="1" /></>,
  flask: <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" /><path d="M7.5 15h9" /></>,
  flow: <><rect x="3" y="4" width="7" height="5" rx="1.5" /><rect x="14" y="4" width="7" height="5" rx="1.5" /><rect x="8.5" y="15" width="7" height="5" rx="1.5" /><path d="M6.5 9v3h11V9M12 12v3" /></>,
  history: <><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" /><path d="M4 4v4.5h4.5M12 8v4l3 2" /></>,
};

export function Icon({ name, size = 24, stroke = 2, style, className, title }) {
  const g = P[name] || P.dots;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} style={{ flex: 'none', ...style }}
      fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {g}
    </svg>
  );
}

// Qué ícono usa cada opción del flujo (variable:código). Admin puede poner "icon" en la opción.
const OPT = {
  'fuente_bien:descanso': 'moon', 'fuente_bien:personas': 'people', 'fuente_bien:logro': 'star', 'fuente_bien:dios': 'sparkle',
  'sueno:bien': 'moon', 'sueno:poco': 'moonHalf', 'sueno:mal': 'moonCloud',
  'comida:si': 'bowl', 'comida:poco': 'cookie', 'comida:no': 'bowlOff',
  'cuerpo:bien': 'heart', 'cuerpo:enfermo': 'thermo', 'cuerpo:dolor': 'bandage', 'cuerpo:ciclo': 'drop',
  'tema:dinero': 'coin', 'tema:trabajo': 'briefcase', 'tema:personas': 'people', 'tema:otra': 'plus',
  'tema:futuro': 'compass', 'tema:noticias': 'phone', 'tema:soledad': 'house', 'tema:nada': 'dots',
  'necesidad:descansar': 'bed', 'necesidad:escucha': 'ear', 'necesidad:esperanza': 'sunrise', 'necesidad:no_se': 'thought',
  'seguridad:a_salvo': 'house', 'seguridad:no_seguro': 'question', 'seguridad:hacerme_dano': 'lifebuoy', 'seguridad:me_hacen_dano': 'hand',
  'ayudo:si': 'thumbUp', 'ayudo:poco': 'thumbMid', 'ayudo:no': 'thumbDown',
  'frecuencia:hoy': 'pin', 'frecuencia:dias': 'calendar', 'frecuencia:siempre': 'repeat',
};
export function iconFor(key, opt) { return opt?.icon || OPT[`${key}:${opt?.code}`] || 'dots'; }

// ---------- Caritas ----------
// expr: happy | calm | meh | down | sad | worried | angry | tired | blank | wild | scared | grateful
const EXPR_BY_EMOTION = {
  alegria: 'happy', paz: 'calm', gratitud: 'grateful', energia: 'happy',
  cansancio: 'tired', preocupacion: 'worried', impulsivo: 'wild', aburrimiento: 'blank',
  tristeza: 'sad', ansiedad: 'scared', rabia: 'angry', desanimo: 'down',
  miedo: 'scared', soledad: 'sad', agotamiento: 'tired', no_puedo: 'sad',
};
const EXPR_BY_MOOD = { bien: 'happy', regular: 'meh', mal: 'down', muy_mal: 'sad' };
export const exprForEmotion = (code) => EXPR_BY_EMOTION[code] || 'meh';
export const exprForMood = (code) => EXPR_BY_MOOD[code] || 'meh';

const INK = '#1F2D45';
export function Face({ expr = 'meh', color = '#FFFFFF', size = 56, ring = true, title }) {
  const eyes = {
    happy: <><path d="M17 23q4-5 8 0" /><path d="M31 23q4-5 8 0" /></>,
    grateful: <><path d="M17 22q4 4 8 0" /><path d="M31 22q4 4 8 0" /></>,
    calm: <><path d="M17 24q4 3 8 0" /><path d="M31 24q4 3 8 0" /></>,
    tired: <><path d="M17 25h8" /><path d="M31 25h8" /><path d="M18 21q3-1.5 6 0" opacity=".5" /><path d="M32 21q3-1.5 6 0" opacity=".5" /></>,
    blank: <><path d="M17 24h8" /><path d="M31 24h8" /></>,
  }[expr];
  const mouth = {
    happy: <path d="M20 34q8 9 16 0" />, grateful: <path d="M21 34q7 7 14 0" />, calm: <path d="M22 35q6 4 12 0" />,
    meh: <path d="M22 36h12" />, down: <path d="M22 37q6-3 12 0" />, sad: <path d="M21 38q7-6 14 0" />,
    worried: <path d="M21 37q3.5-3 7 0t7 0" />, angry: <path d="M21 38q7-5 14 0" />, tired: <path d="M23 36q5 2 10 0" />,
    blank: <path d="M23 36h10" />, wild: <path d="M20 35q4 4 8 0t8 0" />, scared: <ellipse cx="28" cy="37" rx="4" ry="3.2" />,
  }[expr];
  const brows = {
    worried: <><path d="M17 16l7 2" /><path d="M39 16l-7 2" /></>,
    angry: <><path d="M17 15l8 4" /><path d="M39 15l-8 4" /></>,
    sad: <><path d="M17 18l7-2" /><path d="M39 18l-7-2" /></>,
    scared: <><path d="M17 15q4-2 8 0" /><path d="M31 15q4-2 8 0" /></>,
  }[expr];
  const roundEyes = !eyes;
  const big = expr === 'scared' || expr === 'wild';
  return (
    <svg viewBox="0 0 56 56" width={size} height={size} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ flex: 'none' }}>
      <circle cx="28" cy="28" r="25" fill={color} stroke={ring ? INK : 'none'} strokeWidth="2.5" />
      <ellipse cx="20" cy="15" rx="7" ry="4" fill="#fff" opacity=".28" />
      <g fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        {brows}
        {roundEyes && (
          <>
            <circle cx="21" cy="24" r={big ? 4.6 : 3.6} fill="#fff" stroke={INK} strokeWidth="2" />
            <circle cx="35" cy="24" r={big ? 4.6 : 3.6} fill="#fff" stroke={INK} strokeWidth="2" />
            <circle cx={expr === 'wild' ? 22.5 : 21} cy="24.5" r="1.9" fill={INK} stroke="none" />
            <circle cx={expr === 'wild' ? 33.5 : 35} cy="24.5" r="1.9" fill={INK} stroke="none" />
          </>
        )}
        {eyes}
        {mouth}
      </g>
      {(expr === 'happy' || expr === 'grateful' || expr === 'calm') && <><circle cx="14" cy="32" r="3" fill="#FF8C8C" opacity=".45" /><circle cx="42" cy="32" r="3" fill="#FF8C8C" opacity=".45" /></>}
    </svg>
  );
}
