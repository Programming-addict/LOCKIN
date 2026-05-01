import { useEffect, useRef, useState } from 'react';
import './CinematicBackground.css';

/* ─────────────────────────────────────────────
   Static data — generated once, never inside render
   ───────────────────────────────────────────── */
const STARS = [
  // [x%, y%, size_px, opacity_hi, delay_s, dur_s]
  [4,   3,  1.5, 0.75, 0.0,  3.2], [11,  8,  1.0, 0.50, 1.3,  2.6],
  [18,  4,  2.0, 0.85, 2.7,  4.1], [26, 14,  1.0, 0.40, 0.5,  3.5],
  [33,  7,  1.5, 0.65, 3.1,  2.8], [40, 18,  1.0, 0.50, 1.8,  4.6],
  [47,  5,  2.0, 0.90, 0.9,  3.0], [52, 22,  1.0, 0.40, 2.2,  2.4],
  [59, 11,  1.5, 0.60, 4.0,  3.7], [65,  6,  1.0, 0.55, 0.7,  2.9],
  [71, 19,  2.0, 0.70, 3.5,  4.3], [78,  8,  1.0, 0.40, 1.1,  3.1],
  [85, 13,  1.5, 0.65, 2.9,  2.7], [91,  4,  1.0, 0.80, 0.3,  3.8],
  [96, 21,  1.5, 0.50, 4.4,  2.5], [7,  28,  1.0, 0.38, 1.6,  4.2],
  [15, 33,  1.5, 0.55, 0.2,  3.4], [22, 26,  1.0, 0.45, 3.8,  2.6],
  [30, 38,  1.0, 0.30, 2.0,  4.8], [37, 30,  2.0, 0.70, 1.4,  3.3],
  [44, 42,  1.0, 0.35, 4.6,  2.9], [50, 35,  1.5, 0.50, 0.8,  3.6],
  [57, 28,  1.0, 0.60, 2.5,  4.0], [63, 40,  1.0, 0.30, 3.3,  2.8],
  [69, 32,  2.0, 0.80, 0.6,  3.9], [75, 25,  1.0, 0.50, 1.9,  2.5],
  [82, 37,  1.5, 0.55, 4.2,  4.4], [88, 29,  1.0, 0.42, 2.8,  3.2],
  [94, 43,  1.0, 0.70, 1.0,  2.6], [2,  48,  1.0, 0.28, 3.6,  3.7],
  [13, 44,  1.5, 0.50, 0.4,  2.4], [20, 50,  1.0, 0.38, 2.3,  4.5],
  [28, 46,  1.0, 0.30, 4.8,  3.1], [35, 52,  1.5, 0.55, 1.7,  2.7],
  [42, 48,  1.0, 0.45, 3.2,  4.1], [55, 53,  1.0, 0.38, 0.1,  3.5],
  [62, 46,  2.0, 0.68, 2.6,  2.8], [72, 51,  1.0, 0.30, 4.1,  4.3],
  [80, 45,  1.5, 0.50, 1.5,  3.0], [87, 50,  1.0, 0.40, 0.9,  2.9],
  [92, 47,  1.0, 0.60, 3.7,  3.6], [5,  16,  1.0, 0.45, 2.0,  3.8],
  [23, 10,  1.5, 0.60, 0.6,  2.5], [38, 24,  1.0, 0.35, 3.9,  4.0],
  [53, 17,  2.0, 0.75, 1.2,  3.3], [68, 23,  1.0, 0.42, 4.3,  2.7],
  [77, 10,  1.5, 0.65, 0.8,  3.9], [83, 20,  1.0, 0.38, 2.4,  4.5],
  [90, 14,  1.0, 0.50, 1.6,  3.1], [97, 30,  1.5, 0.55, 3.0,  2.6],
];

/* ── Glowing windows on skyline buildings ── */
const WINDOWS = [
  // Stratosphere shaft
  [277,202,0.70],[277,218,0.50],[277,234,0.80],[277,262,0.40],[277,282,0.55],
  // Wynn left tower
  [583,188,0.45],[597,188,0.30],[611,188,0.55],[624,188,0.35],
  [583,212,0.30],[597,212,0.50],[611,212,0.40],[624,212,0.28],
  [583,240,0.50],[597,240,0.28],[611,240,0.42],[624,240,0.30],
  [583,268,0.35],[611,268,0.30],
  // Wynn right tower
  [657,208,0.42],[671,208,0.30],[684,208,0.52],
  [657,230,0.28],[671,230,0.48],[684,230,0.32],
  [657,258,0.40],[671,258,0.25],[684,258,0.38],
  // Venetian left
  [1063,158,0.42],[1077,158,0.28],[1091,158,0.52],[1107,158,0.30],
  [1063,180,0.28],[1077,180,0.50],[1091,180,0.32],[1107,180,0.40],
  [1063,205,0.50],[1077,205,0.28],[1091,205,0.42],[1107,205,0.25],
  [1063,232,0.32],[1077,232,0.45],[1091,232,0.28],
  [1063,260,0.40],[1091,260,0.30],
  // Venetian right
  [1143,175,0.45],[1158,175,0.28],[1175,175,0.52],
  [1143,198,0.28],[1158,198,0.50],[1175,198,0.30],
  [1143,224,0.42],[1158,224,0.25],[1175,224,0.45],
  [1143,252,0.30],[1175,252,0.35],
  // Palazzo
  [1218,172,0.42],[1234,172,0.28],[1252,172,0.55],
  [1218,198,0.28],[1234,198,0.45],[1252,198,0.30],
  [1218,225,0.38],[1234,225,0.28],[1252,225,0.42],
  [1293,192,0.40],[1308,192,0.28],[1293,218,0.28],[1308,218,0.40],
  // Caesars
  [1352,218,0.42],[1369,218,0.28],[1384,218,0.52],[1399,218,0.30],
  [1352,244,0.28],[1369,244,0.45],[1384,244,0.28],[1399,244,0.35],
  [1352,270,0.38],[1384,270,0.28],
  [1436,235,0.40],[1450,235,0.28],[1436,258,0.28],[1450,258,0.38],
  // MGM / Aria
  [1548,192,0.42],[1564,192,0.28],[1578,192,0.52],
  [1548,218,0.28],[1564,218,0.45],[1578,218,0.30],
  [1548,248,0.40],[1564,248,0.25],[1578,248,0.42],
  [1616,212,0.42],[1632,212,0.28],[1648,212,0.52],
  [1616,238,0.28],[1632,238,0.40],[1616,265,0.35],
];

/* ── Sphere facial expressions ── */
const EXPRS = [
  // 0 — Happy: big eyes, wide arc smile
  { ry: 19, mouth: 'M 55 116 Q 100 160 145 116' },
  // 1 — Content: half-squint, gentle smile
  { ry: 11, mouth: 'M 62 121 Q 100 150 138 121' },
  // 2 — Sleepy: nearly closed, tiny uptick
  { ry: 4,  mouth: 'M 68 126 Q 100 140 132 126' },
  // 3 — Blissful: soft open, relaxed smile
  { ry: 15, mouth: 'M 58 119 Q 100 156 142 119' },
];

/* ═══════════════════════════════════════════
   LAS VEGAS SKYLINE SVG
   ViewBox 1920 × 560 — buildings fill bottom
   ═══════════════════════════════════════════ */
const SkylineSVG = () => (
  <svg
    viewBox="0 0 1920 560"
    preserveAspectRatio="xMidYMax meet"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      {/* Window glow filter */}
      <filter id="sk-wglow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="2" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      {/* Soft atmospheric blur for distant layer */}
      <filter id="sk-atm" x="-5%" y="-5%" width="110%" height="110%">
        <feGaussianBlur stdDeviation="1.8" />
      </filter>

      {/* Distance gradient: darker at bottom, fades top */}
      <linearGradient id="sk-g-far" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#1e1540" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#0e0a1e" stopOpacity="1"    />
      </linearGradient>
      <linearGradient id="sk-g-mid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#150e30" stopOpacity="0.78" />
        <stop offset="100%" stopColor="#0b0818" stopOpacity="1"    />
      </linearGradient>
      <linearGradient id="sk-g-near" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#0e0a22" stopOpacity="0.94" />
        <stop offset="100%" stopColor="#080614" stopOpacity="1"    />
      </linearGradient>
      {/* Purple sphere ambient on buildings */}
      <radialGradient id="sk-sphere-amb" cx="50%" cy="0%" r="60%">
        <stop offset="0%"   stopColor="rgba(147,51,234,0.12)" />
        <stop offset="100%" stopColor="rgba(147,51,234,0)"    />
      </radialGradient>
    </defs>

    {/* ─── DISTANT LAYER — hazy, filtered ─── */}
    <g filter="url(#sk-atm)" opacity="0.50">
      <rect x="20"   y="325" width="38" height="235" fill="url(#sk-g-far)" />
      <rect x="62"   y="298" width="25" height="262" fill="url(#sk-g-far)" />
      <rect x="91"   y="314" width="42" height="246" fill="url(#sk-g-far)" />
      <rect x="137"  y="288" width="30" height="272" fill="url(#sk-g-far)" />
      <rect x="1758" y="315" width="45" height="245" fill="url(#sk-g-far)" />
      <rect x="1808" y="295" width="32" height="265" fill="url(#sk-g-far)" />
      <rect x="1844" y="308" width="48" height="252" fill="url(#sk-g-far)" />
      <rect x="1896" y="322" width="24" height="238" fill="url(#sk-g-far)" />
    </g>

    {/* ─── MID LAYER ─── */}
    <g opacity="0.82">
      {/* Stratosphere-like tower */}
      <rect x="273" y="118" width="14"  height="442" fill="url(#sk-g-mid)" />
      {/* Observation deck */}
      <rect x="254" y="182" width="52"  height="24"  rx="4" fill="url(#sk-g-mid)" />
      <rect x="260" y="170" width="40"  height="18"  rx="3" fill="url(#sk-g-mid)" />
      <ellipse cx="280" cy="194" rx="24" ry="7" fill="#120a28" />
      {/* Antenna */}
      <rect x="279" y="88"  width="2"   height="32"  fill="#0e0924" opacity="0.9" />

      {/* Sahara / SLS cluster */}
      <rect x="315" y="252" width="46"  height="308" fill="url(#sk-g-mid)" />
      <rect x="364" y="238" width="62"  height="322" fill="url(#sk-g-mid)" />
      <rect x="430" y="268" width="40"  height="292" fill="url(#sk-g-mid)" />
      <rect x="474" y="248" width="54"  height="312" fill="url(#sk-g-mid)" />

      {/* Wynn — graceful curved towers */}
      <path d="M 572 178 Q 610 168 648 178 L 648 560 L 572 560 Z" fill="url(#sk-g-mid)" />
      <path d="M 654 200 Q 688 188 722 200 L 722 560 L 654 560 Z" fill="url(#sk-g-mid)" />
      <rect x="540" y="312" width="212" height="248" fill="url(#sk-g-mid)" />

      {/* Convention center / mid buildings */}
      <rect x="772" y="278" width="56"  height="282" fill="url(#sk-g-mid)" />
      <rect x="832" y="262" width="36"  height="298" fill="url(#sk-g-mid)" />

      {/* ────────── CENTER GAP — sphere sits here ────────── */}

      {/* Venetian */}
      <rect x="1052" y="145" width="80"  height="415" fill="url(#sk-g-mid)" />
      <rect x="1136" y="170" width="60"  height="390" fill="url(#sk-g-mid)" />
      <rect x="1042" y="342" width="165" height="218" fill="url(#sk-g-mid)" />

      {/* Palazzo */}
      <rect x="1208" y="162" width="72"  height="398" fill="url(#sk-g-mid)" />
      <rect x="1284" y="185" width="52"  height="375" fill="url(#sk-g-mid)" />

      {/* Caesars / Bellagio zone */}
      <rect x="1348" y="212" width="82"  height="348" fill="url(#sk-g-mid)" />
      <rect x="1434" y="228" width="54"  height="332" fill="url(#sk-g-mid)" />
      <rect x="1492" y="218" width="42"  height="342" fill="url(#sk-g-mid)" />

      {/* MGM / Aria cluster */}
      <rect x="1542" y="185" width="64"  height="375" fill="url(#sk-g-mid)" />
      <rect x="1610" y="208" width="56"  height="352" fill="url(#sk-g-mid)" />
      <rect x="1670" y="238" width="46"  height="322" fill="url(#sk-g-mid)" />
      <rect x="1720" y="256" width="42"  height="304" fill="url(#sk-g-mid)" />
    </g>

    {/* ─── NEAR LAYER — foreground, darkest ─── */}
    <g opacity="0.94">
      <rect x="0"    y="358" width="82"  height="202" fill="url(#sk-g-near)" />
      <rect x="80"   y="336" width="66"  height="224" fill="url(#sk-g-near)" />
      <rect x="144"  y="372" width="52"  height="188" fill="url(#sk-g-near)" />
      <rect x="194"  y="342" width="46"  height="218" fill="url(#sk-g-near)" />
      <rect x="238"  y="362" width="36"  height="198" fill="url(#sk-g-near)" />

      <rect x="1838" y="362" width="82"  height="198" fill="url(#sk-g-near)" />
      <rect x="1764" y="342" width="72"  height="218" fill="url(#sk-g-near)" />
      <rect x="1710" y="372" width="52"  height="188" fill="url(#sk-g-near)" />
      <rect x="1656" y="346" width="52"  height="214" fill="url(#sk-g-near)" />
    </g>

    {/* ─── PURPLE SPHERE AMBIENT on buildings ─── */}
    <rect x="0" y="0" width="1920" height="560" fill="url(#sk-sphere-amb)" />

    {/* ─── GLOWING WINDOWS ─── */}
    <g filter="url(#sk-wglow)">
      {WINDOWS.map(([x, y, op], i) => (
        <rect key={i} x={x} y={y} width={5} height={4} rx={1}
          fill="#ffc860" opacity={op} />
      ))}
      {/* A few blue-white windows for variety */}
      <rect x="594"  y="280" width={4} height={3} rx={1} fill="#c8e0ff" opacity="0.35" />
      <rect x="1082" y="288" width={4} height={3} rx={1} fill="#dceeff" opacity="0.30" />
      <rect x="1228" y="250" width={4} height={3} rx={1} fill="#c8e0ff" opacity="0.28" />
      <rect x="1560" y="275" width={4} height={3} rx={1} fill="#dceeff" opacity="0.32" />
    </g>

    {/* ─── GROUND BAND ─── */}
    <rect x="0" y="522" width="1920" height="38" fill="#05040d" />
  </svg>
);

/* ═══════════════════════════════════════════
   FLOATING SPHERE SVG
   ViewBox 200 × 200 — 500 px CSS size
   ═══════════════════════════════════════════ */
const SphereSVG = ({ exprIdx }) => (
  <svg
    className="cin-sphere-svg"
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      {/* Main sphere gradient — purple with bright top-left highlight */}
      <radialGradient id="cin-sg" cx="36%" cy="30%" r="68%">
        <stop offset="0%"   stopColor="#e9d5ff" />
        <stop offset="22%"  stopColor="#c084fc" />
        <stop offset="50%"  stopColor="#9333ea" />
        <stop offset="78%"  stopColor="#6d28d9" />
        <stop offset="100%" stopColor="#3b0764" />
      </radialGradient>

      {/* Sheen — specular highlight */}
      <radialGradient id="cin-sheen" cx="30%" cy="25%" r="45%">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.28)" />
        <stop offset="60%"  stopColor="rgba(255,255,255,0.06)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)"    />
      </radialGradient>

      {/* Bottom shadow — depth */}
      <radialGradient id="cin-shadow" cx="50%" cy="88%" r="55%">
        <stop offset="0%"   stopColor="rgba(0,0,0,0.42)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)"    />
      </radialGradient>

      {/* LED dot pattern */}
      <pattern id="cin-led" x="0" y="0" width="5.5" height="5.5"
        patternUnits="userSpaceOnUse">
        <circle cx="2.75" cy="2.75" r="1.1" fill="rgba(255,255,255,0.11)" />
      </pattern>

      {/* Face glow */}
      <filter id="cin-fg" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="2.8" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>

      {/* Outer sphere glow */}
      <filter id="cin-oglow" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur stdDeviation="10" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>

      {/* Clip to sphere */}
      <clipPath id="cin-clip">
        <circle cx="100" cy="100" r="96" />
      </clipPath>
    </defs>

    {/* Outer halo (blurred) */}
    <circle cx="100" cy="100" r="96"
      fill="rgba(139,92,246,0.35)"
      filter="url(#cin-oglow)" />

    {/* Main sphere body */}
    <circle cx="100" cy="100" r="96" fill="url(#cin-sg)" />

    {/* LED texture — clipped to sphere */}
    <circle cx="100" cy="100" r="96"
      fill="url(#cin-led)"
      clipPath="url(#cin-clip)" />

    {/* Bottom depth shadow */}
    <circle cx="100" cy="100" r="96" fill="url(#cin-shadow)" />

    {/* Specular sheen */}
    <circle cx="100" cy="100" r="96" fill="url(#cin-sheen)" />

    {/* Rim edge glow */}
    <circle cx="100" cy="100" r="95.5"
      fill="none"
      stroke="rgba(216,180,254,0.20)"
      strokeWidth="2.5" />

    {/* ── Animated facial expressions — opacity cross-fade ── */}
    {EXPRS.map((e, i) => (
      <g
        key={i}
        style={{
          opacity: i === exprIdx ? 1 : 0,
          transition: 'opacity 2.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Left eye */}
        <ellipse cx="72" cy="82" rx="15" ry={e.ry}
          fill="rgba(255,255,255,0.96)"
          filter="url(#cin-fg)" />
        {/* Right eye */}
        <ellipse cx="128" cy="82" rx="15" ry={e.ry}
          fill="rgba(255,255,255,0.96)"
          filter="url(#cin-fg)" />
        {/* Mouth */}
        <path d={e.mouth}
          fill="none"
          stroke="rgba(255,255,255,0.96)"
          strokeWidth="7.5"
          strokeLinecap="round"
          filter="url(#cin-fg)" />
      </g>
    ))}
  </svg>
);

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export const CinematicBackground = () => {
  const sphereRef  = useRef(null);
  const mouseRef   = useRef({ x: 0.5, y: 0.5 }); // normalised 0–1
  const posRef     = useRef({ x: 0, y: 0 });      // current lerped offset px
  const rafRef     = useRef(null);
  const tRef       = useRef(0);
  const [exprIdx, setExprIdx] = useState(0);

  /* ── Mouse position tracker ── */
  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  /* ── Animation loop: lerp toward mouse + float bob ── */
  useEffect(() => {
    const MAX = 38; // max pixel offset in each axis

    const loop = () => {
      tRef.current += 0.007;

      // Target offsets (mouse distance from centre)
      const tx = (mouseRef.current.x - 0.5) * 2 * MAX;
      const ty = (mouseRef.current.y - 0.5) * 2 * MAX;

      // Cinematic lerp — very slow (2.5 % per frame ≈ 60 fps → ~2 s settle)
      posRef.current.x += (tx - posRef.current.x) * 0.025;
      posRef.current.y += (ty - posRef.current.y) * 0.025;

      // Sinusoidal float
      const floatY = Math.sin(tRef.current) * 16;

      if (sphereRef.current) {
        const ox = posRef.current.x.toFixed(2);
        const oy = (posRef.current.y + floatY).toFixed(2);
        sphereRef.current.style.transform =
          `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  /* ── Expression cycling every 8 s ── */
  useEffect(() => {
    const id = setInterval(
      () => setExprIdx(i => (i + 1) % EXPRS.length),
      8000,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="cin-bg" aria-hidden="true">

      {/* 1 ── Night sky */}
      <div className="cin-sky" />

      {/* 2 ── Stars */}
      <div className="cin-stars-layer">
        {STARS.map(([x, y, s, op, del, dur], i) => (
          <div
            key={i}
            className="cin-star"
            style={{
              left:              `${x}%`,
              top:               `${y}%`,
              width:             s,
              height:            s,
              '--op-hi':         op,
              '--op-lo':         op * 0.12,
              animationDelay:    `${del}s`,
              animationDuration: `${dur}s`,
            }}
          />
        ))}
      </div>

      {/* 3 ── Las Vegas skyline */}
      <div className="cin-skyline-wrap">
        <SkylineSVG />
      </div>

      {/* 4 ── City horizon glow */}
      <div className="cin-city-glow" />

      {/* 5 ── Fog layers */}
      <div className="cin-fog cin-fog-1" />
      <div className="cin-fog cin-fog-2" />
      <div className="cin-fog cin-fog-3" />

      {/* 6 ── Floating sphere (mouse-followed) */}
      <div className="cin-sphere-orbit" ref={sphereRef}>
        {/* Outer pulsing aura */}
        <div className="cin-sphere-aura-outer" />
        <div className="cin-sphere-aura-inner" />
        {/* Sphere body */}
        <SphereSVG exprIdx={exprIdx} />
        {/* Ground shadow cast below sphere */}
        <div className="cin-sphere-cast" />
      </div>

      {/* 7 ── Ground / road */}
      <div className="cin-ground">
        {/* Wet-road sphere reflection */}
        <div className="cin-road-reflect" />
        {/* Horizon line */}
        <div className="cin-horizon-line" />
      </div>

      {/* 8 ── Vignette */}
      <div className="cin-vignette" />

      {/* 9 ── Final readability overlay */}
      <div className="cin-overlay" />
    </div>
  );
};
