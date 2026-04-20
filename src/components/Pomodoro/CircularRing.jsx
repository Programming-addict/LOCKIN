export const CircularRing = ({ progress, mode, seconds }) => {
  const size   = 240;
  const stroke = 12;
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  const color  = mode === 'work' ? '#22d3ee' : '#4ade80';
  const glow   = mode === 'work' ? 'rgba(34,211,238,0.45)' : 'rgba(74,222,128,0.45)';

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  return (
    <div className="ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--surface-3)" strokeWidth={stroke}
        />

        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.9s linear', filter: `drop-shadow(0 0 8px ${glow})` }}
        />
      </svg>

      {/* Center text */}
      <div className="ring-center">
        <div className="ring-time" style={{ color }}>{mins}:{secs}</div>
        <div className="ring-mode">{mode === 'work' ? 'FOCUS' : 'BREAK'}</div>
      </div>
    </div>
  );
};
