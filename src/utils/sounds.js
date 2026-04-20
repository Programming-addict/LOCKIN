// Generate tones via Web Audio API — no external files needed
const ctx = () => {
  if (!window._audioCtx) window._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return window._audioCtx;
};

const tone = (frequency, duration, type = 'sine', volume = 0.3) => {
  try {
    const ac = ctx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch {
    // AudioContext not available
  }
};

export const playSessionEnd = () => {
  tone(880, 0.3, 'sine', 0.4);
  setTimeout(() => tone(1100, 0.3, 'sine', 0.4), 320);
  setTimeout(() => tone(1320, 0.5, 'sine', 0.35), 640);
};

export const playBreakEnd = () => {
  tone(660, 0.3, 'sine', 0.35);
  setTimeout(() => tone(550, 0.4, 'sine', 0.3), 300);
};

export const playCelebration = () => {
  [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => tone(f, 0.25, 'triangle', 0.35), i * 180)
  );
};
