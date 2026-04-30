import { useRef } from 'react';

export const CircularRing = ({ progress, mode, seconds, running }) => {
  const size   = 240;
  const stroke = 10;
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  const isWork    = mode === 'work';
  const color     = isWork ? '#0a84ff' : '#30d158';
  const glowColor = isWork ? 'rgba(10,132,255,0.65)'  : 'rgba(48,209,88,0.65)';
  const softColor = isWork ? 'rgba(10,132,255,0.18)'  : 'rgba(48,209,88,0.18)';

  // Endpoint dot — position on the arc's trailing edge
  const endAngle = -Math.PI / 2 + progress * 2 * Math.PI;
  const dotX = size / 2 + r * Math.cos(endAngle);
  const dotY = size / 2 + r * Math.sin(endAngle);
  const showDot = progress > 0.015 && progress < 0.985;

  // 60 tick marks (minor every second, major every 5)
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const outerR  = size / 2 - 3;
    const innerR  = outerR - (isMajor ? 9 : 4);
    return {
      x1: size / 2 + innerR * Math.cos(a),
      y1: size / 2 + innerR * Math.sin(a),
      x2: size / 2 + outerR * Math.cos(a),
      y2: size / 2 + outerR * Math.sin(a),
      major: isMajor,
    };
  });

  // Stable random floating particles (fixed per mount)
  const particlesRef = useRef(
    Array.from({ length: 6 }, (_, i) => ({
      angle:  (i / 6) * 360,
      radius: 90 + Math.random() * 40,
      size:   Math.random() * 3 + 2,
      delay:  i * 0.55,
      dur:    2.8 + Math.random() * 1.4,
    }))
  );

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  return (
    <div className={`ring-wrap ${running ? 'ring-running' : ''}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="ring-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="dot-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Tick marks ── */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.major ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}
            strokeWidth={t.major ? 1.5 : 0.75}
            strokeLinecap="round"
          />
        ))}

        {/* ── Track ring ── */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />

        {/* ── Soft glow halo behind arc ── */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={softColor}
          strokeWidth={stroke + 10}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s' }}
        />

        {/* ── Progress arc ── */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          filter="url(#ring-glow)"
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s' }}
        />

        {/* ── Endpoint glow dot ── */}
        {showDot && (
          <>
            <circle cx={dotX} cy={dotY} r={stroke / 2 + 5} fill={softColor} />
            <circle
              cx={dotX} cy={dotY} r={stroke / 2 + 1.5}
              fill={color}
              filter="url(#dot-glow)"
            />
          </>
        )}
      </svg>

      {/* ── Floating particles (only when running) ── */}
      {running && (
        <div className="ring-particles" aria-hidden="true">
          {particlesRef.current.map((p, i) => (
            <span
              key={i}
              className="ring-particle"
              style={{
                '--delay':  `${p.delay}s`,
                '--dur':    `${p.dur}s`,
                '--pcolor': color,
                '--px':     `${Math.cos((p.angle * Math.PI) / 180) * p.radius + size / 2}px`,
                '--py':     `${Math.sin((p.angle * Math.PI) / 180) * p.radius + size / 2}px`,
                width:  `${p.size}px`,
                height: `${p.size}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Center text ── */}
      <div className="ring-center">
        <div className="ring-time" style={{ color }}>{mins}:{secs}</div>
        <div className="ring-mode">{isWork ? 'FOCUS' : 'BREAK'}</div>
      </div>
    </div>
  );
};
