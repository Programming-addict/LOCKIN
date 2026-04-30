import { useEffect, useRef, useState } from 'react';

/**
 * Canvas confetti burst.
 * Fires once every time `trigger` transitions from false → true.
 * Accepts an optional `origin` = { x, y } in 0–1 range (default center-top-ish).
 */
export const Confetti = ({ trigger, origin = { x: 0.5, y: 0.38 }, count = 110 }) => {
  const canvasRef  = useRef(null);
  const particles  = useRef([]);
  const rafRef     = useRef(null);
  const prevTrigger = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger && !prevTrigger.current) fire();
    prevTrigger.current = trigger;
  }, [trigger]); // eslint-disable-line

  const fire = () => {
    setVisible(true);

    // Wait one frame for canvas to mount
    requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');

      const colors = [
        '#0a84ff', '#30d158', '#ffd60a', '#ff453a',
        '#bf5af2', '#ff9f0a', '#ffffff', '#64d2ff',
      ];
      const shapes = ['circle', 'square', 'rect'];

      const ox = canvas.width  * origin.x;
      const oy = canvas.height * origin.y;

      particles.current = Array.from({ length: count }, () => {
        const angle  = (Math.random() * 2 - 1) * Math.PI; // full 360
        const speed  = Math.random() * 18 + 6;
        return {
          x:        ox + (Math.random() - 0.5) * 60,
          y:        oy,
          vx:       Math.cos(angle) * speed,
          vy:       Math.sin(angle) * speed - Math.random() * 8,
          color:    colors[Math.floor(Math.random() * colors.length)],
          shape:    shapes[Math.floor(Math.random() * shapes.length)],
          size:     Math.random() * 9 + 4,
          alpha:    1,
          gravity:  0.45,
          drag:     0.985,
          spin:     (Math.random() - 0.5) * 0.22,
          rotation: Math.random() * Math.PI * 2,
        };
      });

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;

        for (const p of particles.current) {
          if (p.alpha <= 0) continue;
          alive = true;

          p.x  += p.vx;
          p.y  += p.vy;
          p.vy += p.gravity;
          p.vx *= p.drag;
          p.vy *= p.drag;
          p.alpha    -= 0.007;
          p.rotation += p.spin;

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle   = p.color;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 'square') {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          } else {
            // wide confetti ribbon
            ctx.fillRect(-p.size, -p.size / 3.5, p.size * 2, p.size * 0.6);
          }
          ctx.restore();
        }

        if (alive) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setVisible(false);
        }
      };

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(animate);
    });
  };

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'fixed',
        inset:         0,
        width:         '100%',
        height:        '100%',
        pointerEvents: 'none',
        zIndex:        9999,
      }}
    />
  );
};
