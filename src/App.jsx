import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PomodoroProvider } from './context/PomodoroContext';
import { RemindersProvider } from './context/RemindersContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout/Layout';
import { PomodoroTimer } from './components/Pomodoro/PomodoroTimer';
import { TodoList } from './components/Todo/TodoList';
import { CalendarView } from './components/Calendar/CalendarView';
import { DailyGoalsView } from './components/DailyGoals/DailyGoalsView';
import { WeeklyReview } from './components/WeeklyReview/WeeklyReview';
import { NewsView } from './components/News/NewsView';
import { StudyView } from './components/Study/StudyView';
import { StudyProvider } from './context/StudyContext';
import { LoginPage } from './components/Auth/LoginPage';
import { useStreak } from './hooks/useStreak';
import { useDailyGoals } from './hooks/useDailyGoals';
import './components/shared.css';

const AppRoutes = () => {
  const { user } = useAuth();
  const { allDone } = useDailyGoals();
  const streak = useStreak(allDone);

  // Firebase still checking auth state
  if (user === undefined) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 16,
      }}>
        <span style={{ fontSize: 32 }}>⚡</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>
          Loading…
        </span>
      </div>
    );
  }

  // Not signed in → show login page
  if (!user) return <LoginPage />;

  // Signed in → show app (no popup, goals are added on the goals page)
  return (
    <BrowserRouter>
      <PomodoroProvider>
        <RemindersProvider>
          <StudyProvider>
            <Routes>
              <Route element={<Layout streak={streak} />}>
                <Route index           element={<PomodoroTimer />} />
                <Route path="todos"    element={<TodoList />} />
                <Route path="calendar" element={<CalendarView />} />
                <Route path="goals"    element={<DailyGoalsView />} />
                <Route path="review"   element={<WeeklyReview />} />
                <Route path="news"     element={<NewsView />} />
                <Route path="study"    element={<StudyView />} />
              </Route>
            </Routes>
          </StudyProvider>
        </RemindersProvider>
      </PomodoroProvider>
    </BrowserRouter>
  );
};

const AppInner = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default AppInner;
