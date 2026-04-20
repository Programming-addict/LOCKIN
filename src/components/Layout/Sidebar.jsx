import { NavLink } from 'react-router-dom';
import { Timer, CheckSquare, Calendar, Target, Flame, StickyNote, BarChart2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { usePomodoroContext } from '../../context/PomodoroContext';
import './Sidebar.css';

const NAV = [
  { to: '/',        icon: Timer,       label: 'Pomodoro'      },
  { to: '/todos',   icon: CheckSquare, label: 'To-Do'         },
  { to: '/calendar',icon: Calendar,    label: 'Calendar'      },
  { to: '/notes',   icon: StickyNote,  label: 'Notes'         },
  { to: '/goals',   icon: Target,      label: 'Daily Goals'   },
  { to: '/streak',  icon: Flame,       label: 'Streak'        },
  { to: '/review',  icon: BarChart2,   label: 'Weekly Review' },
];

export const Sidebar = ({ streak }) => {
  const [open, setOpen] = useState(false);
  const { running } = usePomodoroContext();

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setOpen(o => !o)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">⚡</div>
          <span className="brand-name">Focus<span>Flow</span></span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={17} />
              <span>{label}</span>
              {/* Live dot when pomodoro is running */}
              {to === '/' && running && <span className="nav-indicator" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-streak">
          <Flame size={16} className="streak-flame" />
          <span className="streak-val">{streak.current}</span>
          <span className="streak-lbl">day streak</span>
        </div>
      </aside>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}
    </>
  );
};
