import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationBell } from '../Notifications/NotificationBell';
import './Layout.css';

export const Layout = ({ streak }) => (
  <div className="app-layout">
    <Sidebar streak={streak} />
    <div className="app-content">
      <header className="app-topbar">
        <NotificationBell />
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  </div>
);
