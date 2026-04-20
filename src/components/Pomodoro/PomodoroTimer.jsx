import { useState } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { usePomodoroContext } from '../../context/PomodoroContext';
import { CircularRing } from './CircularRing';
import { LofiPlayer } from './LofiPlayer';
import './Pomodoro.css';

export const PomodoroTimer = () => {
  const { mode, seconds, running, toggle, reset, progress, sessionCount, settings, updateSettings } = usePomodoroContext();
  const [showSettings, setShowSettings] = useState(false);
  const [draft, setDraft] = useState(settings);

  const saveSettings = () => {
    const w = Math.max(1, Math.min(60, +draft.work || 25));
    const b = Math.max(1, Math.min(30, +draft.break || 5));
    updateSettings({ work: w, break: b });
    setShowSettings(false);
  };

  return (
    <div className="pomodoro-page">
      <div className="page-header">
        <h1 className="page-title">Pomodoro Timer</h1>
        <button className="icon-btn" onClick={() => { setDraft(settings); setShowSettings(true); }}>
          <Settings size={18} />
        </button>
      </div>

      <div className={`pomodoro-card mode-${mode}`}>
        <CircularRing progress={progress} mode={mode} seconds={seconds} />

        <div className="pomo-controls">
          <button className="icon-btn-lg" onClick={reset} title="Reset">
            <RotateCcw size={22} />
          </button>
          <button className={`pomo-play-btn ${mode === 'break' ? 'break-mode' : ''}`} onClick={toggle}>
            {running ? <Pause size={28} /> : <Play size={28} />}
          </button>
          <div style={{ width: 48 }} />
        </div>

        <div className="pomo-meta">
          <div className="pomo-stat">
            <span className="stat-val">{sessionCount}</span>
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
              <button className="btn-ghost" onClick={() => setShowSettings(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveSettings}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
