import { useState } from 'react';
import { Target } from 'lucide-react';
import './DailyGoals.css';

export const GoalPopup = ({ onSave }) => {
  const [goals, setGoals] = useState(['', '', '']);

  const update = (i, val) => {
    const next = [...goals];
    next[i] = val;
    setGoals(next);
  };

  const allFilled = goals.every(g => g.trim().length > 0);

  const submit = (e) => {
    e.preventDefault();
    if (!allFilled) return;
    onSave(goals.map(g => g.trim()));
  };

  return (
    <div className="popup-overlay">
      <div className="popup-modal">
        <div className="popup-icon"><Target size={28} /></div>
        <h2 className="popup-title">Set Today's 3 Goals</h2>
        <p className="popup-sub">What are the 3 most important things you'll accomplish today?</p>

        <form onSubmit={submit} className="popup-form">
          {goals.map((g, i) => (
            <div key={i} className="popup-field">
              <span className="popup-num">{i + 1}</span>
              <input
                className="field-input"
                placeholder={`Goal ${i + 1}…`}
                value={g}
                onChange={e => update(i, e.target.value)}
                autoFocus={i === 0}
              />
            </div>
          ))}

          <button
            className={`btn-primary popup-submit ${!allFilled ? 'disabled' : ''}`}
            type="submit"
            disabled={!allFilled}
          >
            Start My Day →
          </button>

          {!allFilled && (
            <p className="popup-hint">All 3 goals are required to continue</p>
          )}
        </form>
      </div>
    </div>
  );
};
