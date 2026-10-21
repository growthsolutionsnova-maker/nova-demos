// La compañera: larvita → larva → crisálida → crisálida con luz → mariposa (Buddy).
// Buddy es una mariposa verde, sin rasgos de género (sin pestañas, moños ni labios).
// Su cara refleja, sutilmente, el último ánimo (nunca se ve "castigada").
import React from 'react';

const f = (v) => ({ fill: `var(--${v})` });

function Face({ x, y, s = 1, mood = 'bien', sleeping = false }) {
  const smile = mood === 'bien' ? `M${x - 7 * s} ${y + 6 * s} Q${x} ${y + 13 * s} ${x + 7 * s} ${y + 6 * s}`
    : mood === 'regular' ? `M${x - 6 * s} ${y + 8 * s} Q${x} ${y + 10 * s} ${x + 6 * s} ${y + 8 * s}`
    : `M${x - 4 * s} ${y + 8 * s} Q${x} ${y + 10 * s} ${x + 4 * s} ${y + 8 * s}`; // 'soft': pequeña sonrisa tranquila, nunca triste
  return (
    <g>
      {sleeping ? (
        <>
          <path d={`M${x - 11 * s} ${y - 2 * s} q4 ${4 * s} 8 0`} style={{ stroke: 'var(--creature-ink)', fill: 'none', strokeWidth: 2.4 * s, strokeLinecap: 'round' }} />
          <path d={`M${x + 3 * s} ${y - 2 * s} q4 ${4 * s} 8 0`} style={{ stroke: 'var(--creature-ink)', fill: 'none', strokeWidth: 2.4 * s, strokeLinecap: 'round' }} />
        </>
      ) : (
        <>
          <circle cx={x - 7 * s} cy={y - 2 * s} r={5 * s} style={f('white')} />
          <circle cx={x + 7 * s} cy={y - 2 * s} r={5 * s} style={f('white')} />
          <circle cx={x - 6 * s} cy={y - 1.5 * s} r={2.8 * s} style={f('creature-ink')} />
          <circle cx={x + 8 * s} cy={y - 1.5 * s} r={2.8 * s} style={f('creature-ink')} />
          <circle cx={x - 5 * s} cy={y - 3 * s} r={1 * s} style={f('white')} />
          <circle cx={x + 9 * s} cy={y - 3 * s} r={1 * s} style={f('white')} />
        </>
      )}
      <circle cx={x - 13 * s} cy={y + 6 * s} r={3.2 * s} style={{ fill: 'var(--coral)', opacity: 0.55 }} />
      <circle cx={x + 13 * s} cy={y + 6 * s} r={3.2 * s} style={{ fill: 'var(--coral)', opacity: 0.55 }} />
      <path d={smile} style={{ stroke: 'var(--creature-ink)', fill: 'none', strokeWidth: 2.4 * s, strokeLinecap: 'round' }} />
    </g>
  );
}

function Leaf() {
  return (
    <g>
      <path d="M22 172 Q120 118 218 172 Q120 204 22 172Z" style={f('leaf-soft')} />
      <path d="M30 172 Q120 160 212 172" style={{ stroke: 'var(--leaf)', strokeWidth: 2, fill: 'none', opacity: 0.6 }} />
    </g>
  );
}

function Caterpillar({ segs, head, mood }) {
  return (
    <g className="crawl">
      {segs.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} style={f(i % 2 ? 'leaf' : 'leaf-2')} />
          <circle cx={x - r * 0.25} cy={y - r * 0.35} r={r * 0.22} style={{ fill: 'var(--sun)', opacity: 0.9 }} />
          <ellipse cx={x} cy={y + r - 2} rx={r * 0.35} ry={3} style={f('leaf-deep')} />
        </g>
      ))}
      <path d={`M${head[0] - 8} ${head[1] - head[2] + 4} Q${head[0] - 14} ${head[1] - head[2] - 14} ${head[0] - 18} ${head[1] - head[2] - 16}`} style={{ stroke: 'var(--creature-ink)', strokeWidth: 2.4, fill: 'none', strokeLinecap: 'round' }} />
      <path d={`M${head[0] + 8} ${head[1] - head[2] + 4} Q${head[0] + 12} ${head[1] - head[2] - 14} ${head[0] + 18} ${head[1] - head[2] - 16}`} style={{ stroke: 'var(--creature-ink)', strokeWidth: 2.4, fill: 'none', strokeLinecap: 'round' }} />
      <circle cx={head[0] - 18} cy={head[1] - head[2] - 16} r={4} style={f('sun')} />
      <circle cx={head[0] + 18} cy={head[1] - head[2] - 16} r={4} style={f('sun')} />
      <circle cx={head[0]} cy={head[1]} r={head[2]} style={f('leaf')} />
      <Face x={head[0]} y={head[1]} s={head[2] / 22} mood={mood} />
    </g>
  );
}

function Chrysalis({ glow, mood }) {
  return (
    <g>
      {glow && (
        <>
          <circle cx="120" cy="110" r="78" style={{ fill: 'url(#glow)' }} className="pulse" />
          {[[52, 70], [188, 82], [60, 150], [180, 150], [120, 22]].map(([x, y], i) => (
            <path key={i} className="twinkle" style={{ fill: 'var(--sun)', animationDelay: `${i * 0.4}s` }} d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2}Z`} />
          ))}
        </>
      )}
      <path d="M40 26 Q120 14 200 30" style={{ stroke: 'var(--branch)', strokeWidth: 7, fill: 'none', strokeLinecap: 'round' }} />
      <path d="M150 24 q14 -12 26 -6 q-10 10 -26 6Z" style={f('leaf')} />
      <line x1="120" y1="22" x2="120" y2="40" style={{ stroke: 'var(--branch)', strokeWidth: 3 }} />
      <g className="sway">
        <path d="M120 38 C152 52 162 100 152 140 C144 172 96 172 88 140 C78 100 88 52 120 38Z" style={f('jade')} />
        <path d="M120 38 C104 50 96 90 100 130 C102 152 110 164 118 166 C100 160 90 140 90 120 C88 80 98 52 120 38Z" style={{ fill: 'var(--white)', opacity: 0.22 }} />
        {glow && (
          <g style={{ opacity: 0.85 }}>
            <path d="M100 118 Q120 100 140 118 L136 150 Q120 158 104 150Z" style={f('bud-1')} />
            <path d="M108 126 Q120 116 132 126 L130 144 Q120 150 110 144Z" style={f('bud-3')} />
          </g>
        )}
        {[96, 106, 116, 126, 136, 146].map((x, i) => <circle key={i} cx={x - 1} cy={70 + Math.abs(i - 2.5) * 1.4} r="2.6" style={f('gold')} />)}
        <Face x={120} y={92} s={0.9} mood={mood} sleeping />
      </g>
    </g>
  );
}

export function Butterfly({ open = 1, mood = 'bien', flap = true, scale = 1 }) {
  const wingStyle = (side) => ({
    transformBox: 'view-box', transformOrigin: '120px 112px',
    transform: `scaleX(${side * (0.18 + 0.82 * open)})`,
    transition: 'transform var(--breath-ms, 600ms) ease-in-out',
  });
  const Wing = () => (
    <g>
      <path d="M116 104 C82 34 18 30 26 84 C32 120 78 124 116 112Z" style={f('bud-1')} />
      <path d="M108 104 C84 58 44 52 46 86 C48 108 80 112 108 108Z" style={f('bud-2')} />
      <circle cx="56" cy="74" r="8" style={f('sun')} />
      <circle cx="78" cy="94" r="5" style={f('white')} />
      <path d="M116 116 C84 120 52 146 70 172 C86 190 112 154 118 124Z" style={f('bud-3')} />
      <circle cx="84" cy="156" r="5" style={f('bud-1')} />
    </g>
  );
  return (
    <g style={{ transform: `scale(${scale})`, transformOrigin: '120px 110px' }}>
      <g className={flap ? 'flap' : ''}>
        <g style={wingStyle(1)}><Wing /></g>
        <g style={wingStyle(-1)}><Wing /></g>
      </g>
      <ellipse cx="120" cy="122" rx="8" ry="36" style={f('creature-ink')} />
      <path d="M114 62 Q104 40 96 36" style={{ stroke: 'var(--creature-ink)', strokeWidth: 2.4, fill: 'none', strokeLinecap: 'round' }} />
      <path d="M126 62 Q136 40 144 36" style={{ stroke: 'var(--creature-ink)', strokeWidth: 2.4, fill: 'none', strokeLinecap: 'round' }} />
      <circle cx="96" cy="36" r="4" style={f('sun')} />
      <circle cx="144" cy="36" r="4" style={f('sun')} />
      <circle cx="120" cy="76" r="17" style={f('creature-ink')} />
      <g style={{ transform: 'scale(1)' }}>
        <circle cx="113" cy="74" r="4.5" style={f('white')} />
        <circle cx="127" cy="74" r="4.5" style={f('white')} />
        <circle cx="114" cy="74.5" r="2.4" style={f('creature-ink')} />
        <circle cx="128" cy="74.5" r="2.4" style={f('creature-ink')} />
        <path d={mood === 'bien' ? 'M113 82 Q120 88 127 82' : 'M114 84 Q120 86 126 84'} style={{ stroke: 'var(--white)', strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round' }} />
      </g>
    </g>
  );
}

export default function Creature({ stage = 'larvita', mood = 'bien', size = 200, celebrate = false, title }) {
  return (
    <svg viewBox="0 0 240 200" width={size} height={size * 200 / 240} role="img" aria-label={title || stage} className={'creature' + (celebrate ? ' celebrate' : '')}>
      <defs>
        <radialGradient id="glow"><stop offset="0" style={{ stopColor: 'var(--sun)', stopOpacity: 0.55 }} /><stop offset="1" style={{ stopColor: 'var(--sun)', stopOpacity: 0 }} /></radialGradient>
      </defs>
      {(stage === 'larvita' || stage === 'larva') && <Leaf />}
      {stage === 'larvita' && <g className="bob"><Caterpillar mood={mood} segs={[[78, 156, 13], [98, 152, 15], [120, 149, 16]]} head={[146, 136, 22]} /></g>}
      {stage === 'larva' && <g className="bob"><Caterpillar mood={mood} segs={[[46, 158, 13], [64, 152, 15], [84, 148, 17], [106, 146, 18], [128, 146, 18], [150, 144, 18]]} head={[176, 124, 25]} /></g>}
      {stage === 'capullo' && <Chrysalis mood={mood} />}
      {stage === 'capullo_luz' && <Chrysalis mood={mood} glow />}
      {stage === 'mariposa' && <g className="float"><Butterfly mood={mood} scale={0.95} /></g>}
      {celebrate && [[40, 40], [200, 50], [30, 120], [210, 130], [120, 14]].map(([x, y], i) => (
        <g key={i} className="confetti" style={{ animationDelay: `${i * 0.15}s` }}>
          {i % 2 === 0
            ? <path d={`M${x} ${y + 8} C${x - 2} ${y - 2} ${x + 6} ${y - 8} ${x + 14} ${y - 8} C${x + 14} ${y} ${x + 8} ${y + 8} ${x} ${y + 8}Z`} style={{ fill: 'var(--leaf)', stroke: 'var(--creature-ink)', strokeWidth: 1.5 }} />
            : <path d={`M${x} ${y - 9} L${x + 2.5} ${y - 2.5} L${x + 9} ${y} L${x + 2.5} ${y + 2.5} L${x} ${y + 9} L${x - 2.5} ${y + 2.5} L${x - 9} ${y} L${x - 2.5} ${y - 2.5}Z`} style={{ fill: 'var(--sun)', stroke: 'var(--creature-ink)', strokeWidth: 1.5 }} />}
        </g>
      ))}
    </svg>
  );
}
