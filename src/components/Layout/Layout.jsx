import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationBell } from '../Notifications/NotificationBell';
import './Layout.css';

export const Layout = ({ streak }) => {
  const location = useLocation();

  return (
    <div className="app-layout">
      <Sidebar streak={streak} />
      <div className="app-content">
        <header className="app-topbar">
          <NotificationBell />
        </header>
        <main className="app-main">
          {/* key forces remount on route change → triggers page-slide-in */}
          <div key={location.pathname} className="page-transition">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
