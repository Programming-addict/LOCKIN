import { useState, useEffect, useRef } from 'react';
import './SphereFace.css';

/* ─────────────────────────────────────────────────────
   EXPRESSIONS  — bold, Vegas-Sphere-scale face features
   ───────────────────────────────────────────────────── */
const EXPRS = {
  workIdle:  { eyeRy: 18, mouth: 'M 80 130 Q 130 150 180 130' }, // calm, ready
  workRun:   { eyeRy: 11, mouth: 'M 86 129 Q 130 143 174 129' }, // focused, determined
  breakIdle: { eyeRy: 22, mouth: 'M 75 124 Q 130 168 185 124' }, // happy, done!
  breakRun:  { eyeRy:  5, mouth: 'M 82 131 Q 130 145 178 131' }, // sleepy, resting
  alert:     { eyeRy: 25, mouth: 'M 72 121 Q 130 172 188 121' }, // wide-eyed, almost!
};

/* ─── Color palettes ─── */
const PAL = {
  work: {
    g0: '#93c5fd', g1: '#3b82f6', g2: '#1d4ed8', g3: '#1e3a8a', g4: '#0f1f5c',
    arc: '#0a84ff', glow: '#1a6bff',
    pulse: 'rgba(10,132,255,0.44)', pulseSoft: 'rgba(10,132,255,0.18)',
    rim: 'rgba(147,197,253,0.24)',
  },
  break: {
    g0: '#86efac', g1: '#22c55e', g2: '#15803d', g3: '#14532d', g4: '#052e16',
    arc: '#30d158', glow: '#20aa42',
    pulse: 'rgba(48,209,88,0.44)', pulseSoft: 'rgba(48,209,88,0.18)',
    rim: 'rgba(134,239,172,0.24)',
  },
};

export const SphereFace = ({ mode, seconds, running, progress }) => {
  const SIZE  = 260;
  const C     = SIZE / 2;  // 130 — sphere center
  const SR    = 98;        // sphere radius
  const PR    = 116;       // progress-arc radius
  const PCIRC = 2 * Math.PI * PR;
  const POFF  = PCIRC * (1 - progress);

  const isWork     = mode === 'work';
  const almostDone = seconds > 0 && seconds <= 10 && running;
  const pal        = isWork ? PAL.work : PAL.break;

  const exprKey =
    almostDone          ? 'alert'
    : isWork && running ? 'workRun'
    : isWork            ? 'workIdle'
    : running           ? 'breakRun'
    :                     'breakIdle';

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  /* ── Refs for zero-rerender RAF updates ── */
  const tiltRef   = useRef(null);  // div that gets rotateX/Y
  const faceRef   = useRef(null);  // <g> that shifts toward cursor
  const sheenRef  = useRef(null);  // radialGradient cx/cy
  const glowRef   = useRef(null);  // outer halo circle
  const mouseRef  = useRef({ x: 0.5, y: 0.5 });
  const posRef    = useRef({ x: 0.5, y: 0.5 });
  const rafRef    = useRef(null);

  /* ── Tick animation ── */
  const [tick, setTick] = useState(0);
  useEffect(() => { setTick(t => t + 1); }, [seconds]);

  /* ── Random blink ── */
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    let id;
    const schedule = () => {
      id = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => { setBlinking(false); schedule(); }, 140);
      }, 3200 + Math.random() * 4800);
    };
    schedule();
    return () => clearTimeout(id);
  }, []);

  /* ── Mouse tracking + RAF animation loop ── */
  useEffect(() => {
    const onMove = e => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const loop = () => {
      // Lerp toward mouse — snappy but cinematic
      posRef.current.x += (mouseRef.current.x - posRef.current.x) * 0.08;
      posRef.current.y += (mouseRef.current.y - posRef.current.y) * 0.08;

      const dx = (posRef.current.x - 0.5) * 2;  // –1 → +1
      const dy = (posRef.current.y - 0.5) * 2;

      /* 3-D sphere tilt — feels like a physical ball */
      if (tiltRef.current) {
        tiltRef.current.style.transform =
          `rotateY(${(dx * 16).toFixed(2)}deg) rotateX(${(-dy * 11).toFixed(2)}deg)`;
      }

      /* Face looks toward cursor */
      if (faceRef.current) {
        faceRef.current.setAttribute(
          'transform',
          `translate(${(dx * 9).toFixed(2)},${(dy * 6).toFixed(2)})`,
        );
      }

      /* Specular sheen follows mouse — simulates rotating light source */
      if (sheenRef.current) {
        sheenRef.current.setAttribute('cx', `${(30 - dx * 10).toFixed(1)}%`);
        sheenRef.current.setAttribute('cy', `${(24 - dy *  8).toFixed(1)}%`);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* Current eye Ry — collapsed to 0 when blinking */
  const eyeRy = blinking ? 0 : EXPRS[exprKey].eyeRy;

  return (
    <div
      className={`sf-wrap ${running ? 'sf-running' : ''}`}
      style={{
        '--sf-pulse':      pal.pulse,
        '--sf-pulse-soft': pal.pulseSoft,
        perspective: '700px',
      }}
    >
      {/* ── 3-D tilt wrapper ── */}
      <div className="sf-tilt" ref={tiltRef}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Main sphere gradient */}
            <radialGradient id="sf-g" cx="34%" cy="28%" r="66%">
              <stop offset="0%"   stopColor={pal.g0} />
              <stop offset="20%"  stopColor={pal.g1} />
              <stop offset="50%"  stopColor={pal.g2} />
              <stop offset="78%"  stopColor={pal.g3} />
              <stop offset="100%" stopColor={pal.g4} />
            </radialGradient>

            {/* Specular sheen — cx/cy driven by mouse via sheenRef */}
            <radialGradient id="sf-sheen" ref={sheenRef} cx="30%" cy="24%" r="46%">
              <stop offset="0%"   stopColor="rgba(255,255,255,0.34)" />
              <stop offset="55%"  stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)"    />
            </radialGradient>

            {/* Depth shadow at bottom */}
            <radialGradient id="sf-shadow" cx="50%" cy="88%" r="54%">
              <stop offset="0%"   stopColor="rgba(0,0,0,0.52)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)"    />
            </radialGradient>

            {/* LED dot grid */}
            <pattern id="sf-led" x="0" y="0" width="5.5" height="5.5"
              patternUnits="userSpaceOnUse">
              <circle cx="2.75" cy="2.75" r="1.35"
                fill="rgba(255,255,255,0.14)" />
            </pattern>

            {/* Face glow */}
            <filter id="sf-fg" x="-45%" y="-45%" width="190%" height="190%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Outer sphere halo */}
            <filter id="sf-halo" x="-28%" y="-28%" width="156%" height="156%">
              <feGaussianBlur stdDeviation="10" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Progress arc glow */}
            <filter id="sf-arc-glow" x="-30%" y="-30%" width="160%" height="160%">
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

          {/* ── Progress arc ── */}
          <circle cx={C} cy={C} r={PR} fill="none"
            stroke="rgba(255,255,255,0.07)" strokeWidth={5} />
          <circle cx={C} cy={C} r={PR} fill="none"
            stroke={pal.arc} strokeWidth={5} strokeLinecap="round"
            strokeDasharray={PCIRC} strokeDashoffset={POFF}
            transform={`rotate(-90 ${C} ${C})`}
            filter="url(#sf-arc-glow)"
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s' }}
          />

          {/* ── Outer halo glow ── */}
          <circle ref={glowRef} cx={C} cy={C} r={SR}
            fill={pal.glow} opacity="0.40"
            filter="url(#sf-halo)"
            style={{ transition: 'fill 0.5s' }}
          />

          {/* ── Sphere body ── */}
          <circle cx={C} cy={C} r={SR} fill="url(#sf-g)" />

          {/* ── LED texture ── */}
          <circle cx={C} cy={C} r={SR}
            fill="url(#sf-led)" clipPath="url(#sf-clip)" />

          {/* ── Depth shadow ── */}
          <circle cx={C} cy={C} r={SR} fill="url(#sf-shadow)" />

          {/* ── Specular sheen ── */}
          <circle cx={C} cy={C} r={SR} fill="url(#sf-sheen)" />

          {/* ── Rim edge ── */}
          <circle cx={C} cy={C} r={SR - 0.5} fill="none"
            stroke={pal.rim} strokeWidth="2.5"
            style={{ transition: 'stroke 0.5s' }}
          />

          {/* ── Face group — shifted toward cursor by RAF ── */}
          <g ref={faceRef}>

            {/* Crossfade between all expressions */}
            {Object.entries(EXPRS).map(([key, e]) => {
              const active = key === exprKey;
              /* Apply blink only to the visible expression */
              const ry = active ? eyeRy : e.eyeRy;
              return (
                <g
                  key={key}
                  style={{
                    opacity: active ? 1 : 0,
                    transition: 'opacity 0.55s cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  {/* Left eye */}
                  <ellipse cx={96} cy={102} rx={20} ry={ry}
                    fill="rgba(255,255,255,0.96)"
                    filter="url(#sf-fg)"
                    style={{ transition: 'ry 0.11s ease' }}
                  />
                  {/* Right eye */}
                  <ellipse cx={164} cy={102} rx={20} ry={ry}
                    fill="rgba(255,255,255,0.96)"
                    filter="url(#sf-fg)"
                    style={{ transition: 'ry 0.11s ease' }}
                  />
                  {/* Mouth */}
                  <path
                    d={e.mouth}
                    fill="none"
                    stroke="rgba(255,255,255,0.96)"
                    strokeWidth={8.5}
                    strokeLinecap="round"
                    filter="url(#sf-fg)"
                  />
                </g>
              );
            })}
          </g>

          {/* ── Timer digits ── */}
          <g
            key={tick}
            className="sf-tick"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          >
            <text
              x={C} y={157}
              textAnchor="middle"
              dominantBaseline="middle"
              className="sf-time"
            >
              {mins}:{secs}
            </text>
          </g>

          {/* ── Mode label ── */}
          <text
            x={C} y={175}
            textAnchor="middle"
            dominantBaseline="middle"
            className="sf-label"
          >
            {isWork ? 'FOCUS' : 'BREAK'}
          </text>
        </svg>
      </div>
    </div>
  );
};
