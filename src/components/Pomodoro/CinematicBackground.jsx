import './CinematicBackground.css';

const STARS = [
  { x: '3%',  y: '5%',  s: 2, d: '0.0s', t: '3.2s' },
  { x: '9%',  y: '13%', s: 1, d: '0.8s', t: '2.5s' },
  { x: '17%', y: '4%',  s: 3, d: '1.6s', t: '2.9s' },
  { x: '25%', y: '18%', s: 1, d: '0.3s', t: '3.7s' },
  { x: '32%', y: '8%',  s: 2, d: '2.1s', t: '2.2s' },
  { x: '41%', y: '22%', s: 1, d: '1.0s', t: '4.1s' },
  { x: '50%', y: '10%', s: 2, d: '0.5s', t: '2.8s' },
  { x: '58%', y: '6%',  s: 1, d: '2.4s', t: '3.4s' },
  { x: '66%', y: '19%', s: 3, d: '1.2s', t: '2.4s' },
  { x: '74%', y: '8%',  s: 1, d: '0.7s', t: '3.9s' },
  { x: '81%', y: '15%', s: 2, d: '1.9s', t: '2.7s' },
  { x: '89%', y: '4%',  s: 1, d: '0.1s', t: '3.1s' },
  { x: '95%', y: '21%', s: 2, d: '2.7s', t: '2.3s' },
  { x: '6%',  y: '30%', s: 1, d: '1.4s', t: '4.6s' },
  { x: '22%', y: '35%', s: 1, d: '2.9s', t: '2.6s' },
  { x: '48%', y: '32%', s: 2, d: '0.6s', t: '3.5s' },
  { x: '71%', y: '28%', s: 1, d: '1.8s', t: '4.0s' },
  { x: '86%', y: '38%', s: 1, d: '3.2s', t: '2.9s' },
  { x: '38%', y: '42%', s: 2, d: '0.4s', t: '3.8s' },
  { x: '93%', y: '44%', s: 1, d: '2.3s', t: '2.4s' },
];

const DASH_DELAYS = ['0s','0.34s','0.68s','1.02s','1.36s','1.70s','2.04s','2.38s'];

export const CinematicBackground = () => (
  <div className="cinematic-bg" aria-hidden="true">

    {/* Night sky */}
    <div className="cin-sky" />

    {/* Stars */}
    <div className="cin-stars-layer">
      {STARS.map((s, i) => (
        <div
          key={i}
          className="cin-star"
          style={{
            left: s.x, top: s.y,
            width: s.s, height: s.s,
            animationDelay: s.d,
            animationDuration: s.t,
          }}
        />
      ))}
    </div>

    {/* City glow at horizon */}
    <div className="cin-horizon-glow" />
    <div className="cin-horizon-line" />

    {/* Road in perspective */}
    <div className="cin-road">
      <div className="cin-asphalt" />

      {/* Lane dashes rushing toward viewer */}
      <div className="cin-lane-dashes">
        {DASH_DELAYS.map((delay, i) => (
          <div key={i} className="cin-dash" style={{ animationDelay: delay }} />
        ))}
      </div>

      {/* Road edge lines */}
      <div className="cin-edge cin-edge-left" />
      <div className="cin-edge cin-edge-right" />
    </div>

    <div className="cin-vignette" />
    <div className="cin-overlay" />
  </div>
);
