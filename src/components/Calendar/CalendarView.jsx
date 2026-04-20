import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Plus, AlarmClock, Clock } from 'lucide-react';
import { useRemindersContext } from '../../context/RemindersContext';
import { get, set } from '../../utils/storage';
import './Calendar.css';

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const pad = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

const fmt12 = (time) => {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

export const CalendarView = () => {
  const today = new Date();
  const [year,  setYear]   = useState(today.getFullYear());
  const [month, setMonth]  = useState(today.getMonth());
  const [selected, setSelected] = useState(null);
  const [notes, setNotes]  = useState(() => get('cal_notes', {}));
  const [noteDraft, setNoteDraft] = useState('');

  // Reminder inputs
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderMsg,  setReminderMsg]  = useState('');

  const { addReminder, deleteReminder, getForDate, hasForDate } = useRemindersContext();

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMon = new Date(year, month+1, 0).getDate();
  const cells     = Array.from({ length: firstDay + daysInMon }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  const openDay = (day) => {
    const key = pad(year, month, day);
    setSelected(key);
    setNoteDraft(notes[key] || '');
    setReminderMsg('');
    setReminderTime('09:00');
  };

  const saveNote = () => {
    const updated = { ...notes, [selected]: noteDraft };
    setNotes(updated);
    set('cal_notes', updated);
  };

  const handleAddReminder = () => {
    if (!reminderMsg.trim()) return;
    addReminder(selected, reminderTime, reminderMsg.trim());
    setReminderMsg('');
    setReminderTime('09:00');
  };

  const todayStr = pad(today.getFullYear(), today.getMonth(), today.getDate());
  const dayReminders = selected ? getForDate(selected) : [];

  return (
    <div className="cal-page">
      <div className="page-header">
        <h1 className="page-title">Calendar</h1>
      </div>

      <div className="cal-wrap">
        {/* Header */}
        <div className="cal-header">
          <button className="icon-btn" onClick={prev}><ChevronLeft size={18}/></button>
          <span className="cal-month-label">{MONTHS[month]} {year}</span>
          <button className="icon-btn" onClick={next}><ChevronRight size={18}/></button>
        </div>

        {/* Day names */}
        <div className="cal-grid day-names">
          {DAYS.map(d => <div key={d} className="day-name">{d}</div>)}
        </div>

        {/* Cells */}
        <div className="cal-grid cal-cells">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="cal-cell empty" />;
            const key         = pad(year, month, day);
            const isToday     = key === todayStr;
            const hasReminder = hasForDate(key);
            const hasNote     = notes[key];

            return (
              <div
                key={i}
                className={`cal-cell ${isToday ? 'today' : ''} ${selected === key ? 'selected' : ''}`}
                onClick={() => openDay(day)}
              >
                <span className="cal-day-num">{day}</span>
                <div className="cal-indicators">
                  {hasReminder && <div className="ind reminder" />}
                  {hasNote     && <div className="ind note" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day detail panel */}
      {selected && (
        <div className="day-panel">
          <div className="day-panel-header">
            <span className="day-panel-title">
              {new Date(selected + 'T12:00:00').toLocaleDateString('en-US',
                { weekday:'long', month:'long', day:'numeric' })}
            </span>
            <button className="icon-btn" onClick={() => setSelected(null)}><X size={16}/></button>
          </div>

          {/* Note */}
          <div className="panel-section">
            <div className="panel-label">Notes</div>
            <textarea
              className="cal-note-input"
              placeholder="Add a note for this day…"
              value={noteDraft}
              onChange={e => setNoteDraft(e.target.value)}
              onBlur={saveNote}
              rows={3}
            />
          </div>

          {/* Reminders */}
          <div className="panel-section">
            <div className="panel-label">Reminders</div>
            <div className="cal-reminder-add">
              <input
                type="time"
                className="field-input time-input"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
              />
              <input
                className="field-input"
                placeholder="Reminder message…"
                value={reminderMsg}
                onChange={e => setReminderMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddReminder()}
              />
              <button className="btn-primary sm" onClick={handleAddReminder} title="Add reminder">
                <Plus size={15}/>
              </button>
            </div>

            <div className="cal-reminder-list">
              {dayReminders.length === 0 && (
                <div className="cal-reminder-empty">No reminders for this day</div>
              )}
              {dayReminders.map(r => (
                <div key={r.id} className={`cal-reminder-item ${r.triggered ? 'triggered' : 'upcoming'}`}>
                  <div className="cal-reminder-icon">
                    {r.triggered ? <AlarmClock size={13}/> : <Clock size={13}/>}
                  </div>
                  <div className="cal-reminder-body">
                    <span className="cal-reminder-msg">{r.message}</span>
                    <span className="cal-reminder-time">{fmt12(r.time)}</span>
                  </div>
                  <button
                    className="icon-btn danger sm"
                    onClick={() => deleteReminder(r.id)}
                    title="Delete reminder"
                  >
                    <X size={12}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
