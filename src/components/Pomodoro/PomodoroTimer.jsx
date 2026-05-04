import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, Settings, SkipForward, Users } from 'lucide-react';
import { usePomodoroContext } from '../../context/PomodoroContext';
import { useStudy }           from '../../context/StudyContext';
import { CircularRing }       from './CircularRing';
import { LofiPlayer }         from './LofiPlayer';
import { Confetti }           from '../Confetti';
import './Pomodoro.css';

export const PomodoroTimer = () => {
  const navigate = useNavigate();
  const {
    mode, seconds, running, toggle, reset, skipBreak,
    progress, sessionCount, settings, updateSettings,
  } = usePomodoroContext();

  const { inRoom, updatePresence } = useStudy();

  const [showSettings, setShowSettings] = useState(false);
  const [draft,        setDraft]        = useState(settings);

  /* ── Confetti on session complete ── */
  const prevSession = useRef(sessionCount);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (sessionCount > prevSession.current) {
      setBurst(false);
      setTimeout(() => setBurst(true), 30);
    }
    prevSession.current = sessionCount;
  }, [sessionCount]);

  /* ── Sync presence to study room when timer state changes ── */
  useEffect(() => {
    if (!inRoom) return;
    const status = running
      ? (mode === 'work' ? 'focusing' : 'break')
      : 'idle';
    updatePresence({ status }).catch(() => {});
  }, [running, mode, inRoom, updatePresence]);

  /* ── Magnetic play button ── */
  const playRef = useRef(null);

  const onPlayMouseMove = (e) => {
    const btn  = playRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x    = (e.clientX - rect.left - rect.width  / 2) * 0.35;
    const y    = (e.clientY - rect.top  - rect.height / 2) * 0.35;
    btn.style.transform = `translate(${x}px, ${y}px) scale(1.07)`;
  };

  const onPlayMouseLeave = () => {
    if (playRef.current) playRef.current.style.transform = '';
  };

  const saveSettings = () => {
    const w = Math.max(1, Math.min(60, +draft.work  || 25));
    const b = Math.max(1, Math.min(30, +draft.break || 5));
    updateSettings({ work: w, break: b });
    setShowSettings(false);
  };

  return (
    <div className="pomodoro-page">
      <Confetti trigger={burst} origin={{ x: 0.5, y: 0.35 }} />

      <div className="page-header">
        <h1 className="page-title">Pomodoro Timer</h1>
        {/* Study Together shortcut */}
        <button
          className={`icon-btn party-icon-btn ${inRoom ? 'party-active' : ''}`}
          onClick={() => navigate('/study')}
          title={inRoom ? 'Back to study room' : 'Study with friends'}
        >
          <Users size={18} />
          {inRoom && <span className="party-dot" />}
        </button>
        <button className="icon-btn" onClick={() => { setDraft(settings); setShowSettings(true); }}>
          <Settings size={18} />
        </button>
      </div>

      <div className={`pomodoro-card mode-${mode} ${running ? 'running' : ''}`}>
        <CircularRing progress={progress} mode={mode} seconds={seconds} running={running} />

        <div className="pomo-controls">
          <button className="icon-btn-lg" onClick={reset} title="Reset">
            <RotateCcw size={22} />
          </button>

          {/* Magnetic play button */}
          <button
            ref={playRef}
            className={`pomo-play-btn ${mode === 'break' ? 'break-mode' : ''} ${running ? 'running' : ''}`}
            onClick={toggle}
            onMouseMove={onPlayMouseMove}
            onMouseLeave={onPlayMouseLeave}
          >
            {running ? <Pause size={28} /> : <Play size={28} />}
          </button>

          {/* Skip break — only visible during break mode */}
          {mode === 'break' ? (
            <button className="icon-btn-lg skip-break-btn" onClick={skipBreak} title="Skip break">
              <SkipForward size={22} />
            </button>
          ) : (
            <div style={{ width: 48 }} />
          )}
        </div>

        <div className="pomo-meta">
          <div className="pomo-stat">
            {/* key re-mounts the span → triggers count-pop animation */}
            <span key={sessionCount} className="stat-val stat-pop">{sessionCount}</span>
            <span className="stat-lbl">sessions today</span>
          </div>
          <div className="pomo-divider" />
          <div className="pomo-stat">
            <span className="stat-val">{settings.work}m / {settings.break}m</span>
            <span className="stat-lbl">work / break</span>
          </div>
        </div>

        {/* Session dots */}
        <div className="session-dots">
          {Array.from({ length: Math.max(4, sessionCount) }).map((_, i) => (
            <div key={i} className={`dot ${i < sessionCount ? 'filled' : ''}`} />
          ))}
        </div>
      </div>

      <LofiPlayer />

      {/* Settings modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Timer Settings</h2>

            <label className="field-label">Work duration (minutes)</label>
            <input
              type="number" className="field-input" min={1} max={60}
              value={draft.work}
              onChange={e => setDraft(d => ({ ...d, work: e.target.value }))}
            />

            <label className="field-label" style={{ marginTop: 14 }}>Break duration (minutes)</label>
            <input
              type="number" className="field-input" min={1} max={30}
              value={draft.break}
              onChange={e => setDraft(d => ({ ...d, break: e.target.value }))}
            />

            <div className="modal-actions">
              <button className="btn-ghost"   onClick={() => setShowSettings(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveSettings}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
