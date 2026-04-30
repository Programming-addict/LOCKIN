import { useRef } from 'react';

export const CircularRing = ({ progress, mode, seconds, running }) => {
  const size   = 240;
  const stroke = 10;
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  const isWork = mode === 'work';
  const color  = isWork ? '#0a84ff' : '#30d158';
  const glow   = isWork ? 'rgba(10,132,255,0.55)' : 'rgba(48,209,88,0.55)';
  const soft   = isWork ? 'rgba(10,132,255,0.12)' : 'rgba(48,209,88,0.12)';

  // Endpoint dot position
  const endAngle = -Math.PI / 2 + progress * 2 * Math.PI;
  const dotX     = size / 2 + r * Math.cos(endAngle);
  const dotY     = size / 2 + r * Math.sin(endAngle);
  const showDot  = progress > 0.015 && progress < 0.985;

  // 60 tick marks — major every 5
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a       = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const outerR  = size / 2 - 4;
    const innerR  = outerR - (isMajor ? 8 : 4);
    return {
      x1: size / 2 + innerR * Math.cos(a),
      y1: size / 2 + innerR * Math.sin(a),
      x2: size / 2 + outerR * Math.cos(a),
      y2: size / 2 + outerR * Math.sin(a),
      major: isMajor,
    };
  });

  // Fixed floating particles per mount
  const particlesRef = useRef(
    Array.from({ length: 5 }, (_, i) => ({
      angle: (i / 5) * 360 + 36,
      radius: 88 + (i % 3) * 14,
      size:   2 + (i % 3),
      delay:  i * 0.6,
      dur:    2.6 + (i % 2) * 1.2,
    }))
  );

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  return (
    <div className={`ring-wrap ${running ? 'ring-running' : ''}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        <defs>
          <filter id="arc-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="dot-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.major ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'}
            strokeWidth={t.major ? 1.5 : 0.75}
            strokeLinecap="round"
          />
        ))}

        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />

        {/* Progress arc */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          filter="url(#arc-glow)"
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s' }}
        />

        {/* Endpoint glow dot */}
        {showDot && (
          <>
            {/* Soft outer halo — only at the dot, not the whole arc */}
            <circle cx={dotX} cy={dotY} r={stroke / 2 + 4} fill={soft} />
            {/* Bright core dot */}
            <circle cx={dotX} cy={dotY} r={stroke / 2 + 1.5} fill={color} filter="url(#dot-glow)" />
          </>
        )}
      </svg>

      {/* Floating particles while running */}
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
                '--px': `${Math.cos((p.angle * Math.PI) / 180) * p.radius + size / 2}px`,
                '--py': `${Math.sin((p.angle * Math.PI) / 180) * p.radius + size / 2}px`,
                width:  `${p.size}px`,
                height: `${p.size}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Center text */}
      <div className="ring-center">
        <div className="ring-time" style={{ color }}>{mins}:{secs}</div>
        <div className="ring-mode">{isWork ? 'FOCUS' : 'BREAK'}</div>
      </div>
    </div>
  );
};
