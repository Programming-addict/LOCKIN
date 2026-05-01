import { useState, useEffect } from 'react';
import './SphereFace.css';

/* ─── Expression set ─────────────────────────────────────────
   Each state gets its own face so the sphere always "feels"
   the moment — not just an idle loop.
   ─────────────────────────────────────────────────────────── */
const EXPRS = {
  workIdle:  { eyeRy: 14, mouth: 'M 84 132 Q 120 145 156 132' }, // calm, ready
  workRun:   { eyeRy: 9,  mouth: 'M 88 130 Q 120 140 152 130' }, // focused, determined
  breakIdle: { eyeRy: 17, mouth: 'M 80 124 Q 120 154 160 124' }, // happy, done!
  breakRun:  { eyeRy: 4,  mouth: 'M 86 131 Q 120 143 154 131' }, // sleepy, resting
  alert:     { eyeRy: 20, mouth: 'M 77 122 Q 120 156 163 122' }, // wide-eyed, almost!
};

/* ─── Color palettes (work = blue, break = green) ─────────── */
const PAL = {
  work: {
    g0: '#8ecfff', g1: '#3a9eff', g2: '#006de0', g3: '#003fa8', g4: '#001a5c',
    arc: '#0a84ff',
    pulse:     'rgba(10,132,255,0.40)',
    pulseSoft: 'rgba(10,132,255,0.18)',
    rim: 'rgba(140,200,255,0.20)',
  },
  break: {
    g0: '#8effc2', g1: '#30d158', g2: '#1a9e40', g3: '#0d6228', g4: '#042e14',
    arc: '#30d158',
    pulse:     'rgba(48,209,88,0.40)',
    pulseSoft: 'rgba(48,209,88,0.18)',
    rim: 'rgba(140,255,180,0.20)',
  },
};

export const SphereFace = ({ mode, seconds, running, progress }) => {
  const SIZE   = 240;
  const C      = SIZE / 2;   // 120 — sphere centre
  const SR     = 94;         // sphere radius
  const PR     = 111;        // progress-arc radius
  const PCIRC  = 2 * Math.PI * PR;
  const offset = PCIRC * (1 - progress);

  const isWork     = mode === 'work';
  const almostDone = seconds > 0 && seconds <= 10 && running;
  const pal        = isWork ? PAL.work : PAL.break;

  const exprKey = almostDone     ? 'alert'
    : isWork   && running        ? 'workRun'
    : isWork   && !running       ? 'workIdle'
    : !isWork  && running        ? 'breakRun'
    :                              'breakIdle';

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  /* ── Tick animation: flip class every second ── */
  const [tick, setTick] = useState(0);
  useEffect(() => { setTick(t => t + 1); }, [seconds]);

  return (
    <div
      className={`sf-wrap ${running ? 'sf-running' : ''}`}
      style={{
        '--sf-pulse':      pal.pulse,
        '--sf-pulse-soft': pal.pulseSoft,
      }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Sphere gradient */}
          <radialGradient id="sf-g" cx="34%" cy="28%" r="66%">
            <stop offset="0%"   stopColor={pal.g0} />
            <stop offset="22%"  stopColor={pal.g1} />
            <stop offset="52%"  stopColor={pal.g2} />
            <stop offset="78%"  stopColor={pal.g3} />
            <stop offset="100%" stopColor={pal.g4} />
          </radialGradient>

          {/* Sheen highlight */}
          <radialGradient id="sf-sheen" cx="29%" cy="24%" r="46%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.28)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)"    />
          </radialGradient>

          {/* Depth shadow at bottom */}
          <radialGradient id="sf-shadow" cx="50%" cy="88%" r="54%">
            <stop offset="0%"   stopColor="rgba(0,0,0,0.44)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)"    />
          </radialGradient>

          {/* LED dot texture */}
          <pattern id="sf-led" x="0" y="0" width="5.2" height="5.2"
            patternUnits="userSpaceOnUse">
            <circle cx="2.6" cy="2.6" r="0.95"
              fill="rgba(255,255,255,0.10)" />
          </pattern>

          {/* Face feature glow */}
          <filter id="sf-fg" x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="2.8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Outer sphere glow */}
          <filter id="sf-halo" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Arc glow */}
          <filter id="sf-arc" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <clipPath id="sf-clip">
            <circle cx={C} cy={C} r={SR} />
          </clipPath>
        </defs>

        {/* ── Progress arc track ── */}
        <circle cx={C} cy={C} r={PR}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={5} />

        {/* ── Progress arc fill ── */}
        <circle cx={C} cy={C} r={PR}
          fill="none"
          stroke={pal.arc}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={PCIRC}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${C} ${C})`}
          filter="url(#sf-arc)"
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s' }}
        />

        {/* ── Outer glow halo ── */}
        <circle cx={C} cy={C} r={SR}
          fill={pal.arc}
          opacity="0.32"
          filter="url(#sf-halo)"
          style={{ transition: 'fill 0.5s' }}
        />

        {/* ── Sphere body ── */}
        <circle cx={C} cy={C} r={SR}
          fill="url(#sf-g)"
          style={{ transition: 'fill 0.5s' }}
        />

        {/* ── LED dot overlay ── */}
        <circle cx={C} cy={C} r={SR}
          fill="url(#sf-led)"
          clipPath="url(#sf-clip)"
        />

        {/* ── Depth shadow ── */}
        <circle cx={C} cy={C} r={SR} fill="url(#sf-shadow)" />

        {/* ── Specular sheen ── */}
        <circle cx={C} cy={C} r={SR} fill="url(#sf-sheen)" />

        {/* ── Rim light ── */}
        <circle cx={C} cy={C} r={SR - 0.5}
          fill="none"
          stroke={pal.rim}
          strokeWidth="2"
          style={{ transition: 'stroke 0.5s' }}
        />

        {/* ── Facial expressions — opacity cross-fade ── */}
        {Object.entries(EXPRS).map(([key, e]) => (
          <g
            key={key}
            style={{
              opacity: key === exprKey ? 1 : 0,
              transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* Left eye */}
            <ellipse cx={94} cy={90} rx={14} ry={e.eyeRy}
              fill="rgba(255,255,255,0.95)"
              filter="url(#sf-fg)"
            />
            {/* Right eye */}
            <ellipse cx={146} cy={90} rx={14} ry={e.eyeRy}
              fill="rgba(255,255,255,0.95)"
              filter="url(#sf-fg)"
            />
            {/* Mouth */}
            <path
              d={e.mouth}
              fill="none"
              stroke="rgba(255,255,255,0.95)"
              strokeWidth={7}
              strokeLinecap="round"
              filter="url(#sf-fg)"
            />
          </g>
        ))}

        {/* ── Timer digits ── */}
        <g
          key={tick}
          className="sf-tick"
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          <text
            x={C} y={152}
            textAnchor="middle"
            dominantBaseline="middle"
            className="sf-time"
          >
            {mins}:{secs}
          </text>
        </g>

        {/* ── Mode label ── */}
        <text
          x={C} y={170}
          textAnchor="middle"
          dominantBaseline="middle"
          className="sf-label"
        >
          {isWork ? 'FOCUS' : 'BREAK'}
        </text>
      </svg>
    </div>
  );
};
