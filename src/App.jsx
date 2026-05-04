import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useCallback, useEffect } from 'react';
import { PomodoroProvider }  from './context/PomodoroContext';
import { RemindersProvider } from './context/RemindersContext';
import { AuthProvider }      from './context/AuthContext';
import { useAuth }           from './context/AuthContext';
import { Layout }            from './components/Layout/Layout';
import { PomodoroTimer }     from './components/Pomodoro/PomodoroTimer';
import { TodoList }          from './components/Todo/TodoList';
import { CalendarView }      from './components/Calendar/CalendarView';
import { DailyGoalsView }    from './components/DailyGoals/DailyGoalsView';
import { WeeklyReview }      from './components/WeeklyReview/WeeklyReview';
import { NewsView }          from './components/News/NewsView';
import { LeaderboardView }   from './components/Leaderboard/LeaderboardView';
import { LoginPage }         from './components/Auth/LoginPage';
import { useStreak }         from './hooks/useStreak';
import { useDailyGoals }     from './hooks/useDailyGoals';
import { useLeaderboard }    from './hooks/useLeaderboard';
import './components/shared.css';

const AppRoutes = () => {
  const { user }         = useAuth();
  const { allDone }      = useDailyGoals();
  const streak           = useStreak(allDone);
  const { publishStats } = useLeaderboard();

  // Publish global leaderboard stats on sign-in and after each pomodoro session
  useEffect(() => { if (user) publishStats(user); }, [user]);  // eslint-disable-line react-hooks/exhaustive-deps
  const handleSessionComplete = useCallback(() => {
    if (user) publishStats(user);
  }, [user, publishStats]);

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

  if (!user) return <LoginPage />;

  return (
    <BrowserRouter>
      <PomodoroProvider onSessionComplete={handleSessionComplete}>
        <RemindersProvider>
          <Routes>
            <Route element={<Layout streak={streak} />}>
              <Route index                  element={<PomodoroTimer />} />
              <Route path="todos"           element={<TodoList />} />
              <Route path="calendar"        element={<CalendarView />} />
              <Route path="goals"           element={<DailyGoalsView />} />
              <Route path="review"          element={<WeeklyReview />} />
              <Route path="news"            element={<NewsView />} />
              <Route path="leaderboard"     element={<LeaderboardView />} />
            </Route>
          </Routes>
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
