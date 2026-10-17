import React from 'react';

function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

// Barras verticales con eje Y a escala y línea opcional (segunda serie).
export function Bars({ data, width = 460, height = 190, fmt = (v) => v, color = 'var(--wing)', line, lineColor = 'var(--coral)', labelEvery = 1, refLine, ariaLabel }) {
  const W = width, H = height, padL = 40, padB = 26, padT = 10, padR = 8;
  const max = niceMax(Math.max(...data.map((d) => d.value), ...(line ? data.map((d) => d[line]) : [0]), refLine || 0));
  const iw = W - padL - padR, ih = H - padT - padB;
  const bw = iw / data.length;
  const y = (v) => padT + ih - (v / max) * ih;
  const ticks = [0, max / 2, max];
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
      {ticks.map((t, i) => (
        <g key={i}><line className="grid" x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} /><text x={padL - 6} y={y(t) + 4} textAnchor="end">{fmt(t)}</text></g>
      ))}
      {refLine != null && <line x1={padL} x2={W - padR} y1={y(refLine)} y2={y(refLine)} style={{ stroke: 'var(--ink-2)', strokeDasharray: '4 4' }} />}
      {data.map((d, i) => (
        <g key={i}>
          <rect x={padL + i * bw + bw * 0.15} y={y(d.value)} width={bw * 0.7} height={Math.max(0, padT + ih - y(d.value))} rx={Math.min(4, bw * 0.2)} style={{ fill: d.color || color, opacity: d.dim ? 0.45 : 1 }}>
            <title>{`${d.label}: ${fmt(d.value)}`}</title>
          </rect>
          {i % labelEvery === 0 && <text x={padL + i * bw + bw / 2} y={H - 8} textAnchor="middle">{d.label}</text>}
        </g>
      ))}
      {line && (
        <>
          <polyline points={data.map((d, i) => `${padL + i * bw + bw / 2},${y(d[line])}`).join(' ')} style={{ fill: 'none', stroke: lineColor, strokeWidth: 2.5, strokeLinejoin: 'round' }} />
          {data.length > 0 && <circle cx={padL + (data.length - 1) * bw + bw / 2} cy={y(data[data.length - 1][line])} r="4" style={{ fill: lineColor }} />}
        </>
      )}
    </svg>
  );
}

export function HBars({ items, fmt = (v) => v, color }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="bars">
      {items.map((it) => (
        <div className="b" key={it.label}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.label}</span>
          <span className="t"><i style={{ width: `${(it.value / max) * 100}%`, background: it.color || color }} /></span>
          <span className="n">{fmt(it.value)}</span>
        </div>
      ))}
    </div>
  );
}

// Escala de color (un solo tono: violeta) para mapas de calor.
export function heatBg(t) {
  const a = Math.max(0, Math.min(1, t));
  return { background: `color-mix(in srgb, var(--wing) ${Math.round(a * 85)}%, var(--paper))`, color: a > 0.55 ? '#fff' : 'var(--ink)' };
}
