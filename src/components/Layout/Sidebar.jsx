import { NavLink } from 'react-router-dom';
import { Timer, CheckSquare, Calendar, Target, Flame, BarChart2, Newspaper, Users, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { usePomodoroContext } from '../../context/PomodoroContext';
import { AuthButton } from '../Auth/AuthButton';
import './Sidebar.css';

const NAV = [
  { to: '/',        icon: Timer,       label: 'Pomodoro'      },
  { to: '/todos',   icon: CheckSquare, label: 'To-Do'         },
  { to: '/calendar',icon: Calendar,    label: 'Calendar'      },
  { to: '/goals',   icon: Target,      label: 'Daily Goals'   },
  { to: '/review',  icon: BarChart2,   label: 'Weekly Review' },
  { to: '/news',    icon: Newspaper,   label: 'News'          },
  { to: '/study',   icon: Users,       label: 'Study Together'},
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
          <span className="brand-name">LOC<span>KIN</span></span>
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
              {to === '/' && running && <span className="nav-indicator" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-streak">
          <Flame size={16} className="streak-flame" />
          <span className="streak-val">{streak.current}</span>
          <span className="streak-lbl">day streak</span>
        </div>

        <div className="sidebar-auth">
          <AuthButton />
        </div>
      </aside>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}
    </>
  );
};
