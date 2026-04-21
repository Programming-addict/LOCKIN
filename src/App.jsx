import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PomodoroProvider } from './context/PomodoroContext';
import { RemindersProvider } from './context/RemindersContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout/Layout';
import { PomodoroTimer } from './components/Pomodoro/PomodoroTimer';
import { TodoList } from './components/Todo/TodoList';
import { CalendarView } from './components/Calendar/CalendarView';
import { DailyGoalsView } from './components/DailyGoals/DailyGoalsView';
import { WeeklyReview } from './components/WeeklyReview/WeeklyReview';
import { NewsView } from './components/News/NewsView';
import { GoalPopup } from './components/DailyGoals/GoalPopup';
import { useDailyGoals } from './hooks/useDailyGoals';
import { useStreak } from './hooks/useStreak';
import './components/shared.css';

const AppInner = () => {
  const { goalsSet, setGoals, allDone } = useDailyGoals();
  const streak = useStreak(allDone);

  return (
    <AuthProvider>
    <BrowserRouter>
      <PomodoroProvider>
        <RemindersProvider>
          {!goalsSet && <GoalPopup onSave={setGoals} />}
          <Routes>
            <Route element={<Layout streak={streak} />}>
              <Route index           element={<PomodoroTimer />} />
              <Route path="todos"    element={<TodoList />} />
              <Route path="calendar" element={<CalendarView />} />
              <Route path="goals"    element={<DailyGoalsView />} />
              <Route path="review"   element={<WeeklyReview />} />
              <Route path="news"     element={<NewsView />} />
            </Route>
          </Routes>
        </RemindersProvider>
      </PomodoroProvider>
    </BrowserRouter>
    </AuthProvider>
  );
};

export default AppInner;
