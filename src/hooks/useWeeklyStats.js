import { useState, useCallback } from 'react';
import { get, set } from '../utils/storage';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const fmt = (d) => d.toISOString().slice(0, 10);

const getWeekDates = (offset = 0) => {
  const today = new Date();
  const mon   = new Date(today);
  mon.setDate(today.getDate() - ((today.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
};

const REFLECTION_KEY = 'weekly_reflections'; // { 'YYYY-MM-DD': string } keyed by week Mon

const loadReflection = (weekKey) => get(REFLECTION_KEY, {})[weekKey] ?? '';

export const useWeeklyStats = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [reflection, setReflectionState] = useState(() => {
    const days = getWeekDates(0);
    return loadReflection(fmt(days[0]));
  });

  const days     = getWeekDates(weekOffset);
  const weekKey  = fmt(days[0]); // Monday as the unique week key
  const settings = get('pomo_settings', { work: 25, break: 5 });
  const sessions = get('pomo_sessions', {});
  const goalsHist = get('goals_history', {});
  const todos    = get('todos', []);
  const streak   = get('streak_data', { current: 0, best: 0 });

  const dayStats = days.map(date => {
    const key  = fmt(date);
    const sess = sessions[key] ?? 0;
    const mins = sess * settings.work;
    const gh   = goalsHist[key];
    const goalsCompleted = gh ? gh.completed.filter(Boolean).length : 0;
    const allGoalsDone   = goalsCompleted === 3;

    // Use completedAt (set when toggling) — falls back to createdAt for legacy todos
    const dayTodos = todos.filter(t => {
      if (!t.completed) return false;
      const ts = t.completedAt || t.createdAt;
      return fmt(new Date(ts)) === key;
    }).length;

    return {
      date, key,
      label: DAY_LABELS[date.getDay()],
      sessions: sess, mins,
      goalsCompleted, allGoalsDone,
      dayTodos,
    };
  });

  const totalSessions    = dayStats.reduce((s, d) => s + d.sessions, 0);
  const totalMins        = dayStats.reduce((s, d) => s + d.mins, 0);
  const totalTodos       = dayStats.reduce((s, d) => s + d.dayTodos, 0);
  const daysWithAllGoals = dayStats.filter(d => d.allGoalsDone).length;
  const maxSessions      = Math.max(...dayStats.map(d => d.sessions), 1);

  const today         = fmt(new Date());
  const isCurrentWeek = weekOffset === 0;
  const canGoNext     = weekOffset < 0;

  const saveReflection = useCallback((text) => {
    setReflectionState(text);
    const all = get(REFLECTION_KEY, {});
    all[weekKey] = text;
    set(REFLECTION_KEY, all);
  }, [weekKey]);

  const prevWeek = useCallback(() => {
    const nextOffset = weekOffset - 1;
    setWeekOffset(nextOffset);
    const newDays = getWeekDates(nextOffset);
    setReflectionState(loadReflection(fmt(newDays[0])));
  }, [weekOffset]);

  const nextWeek = useCallback(() => {
    if (!canGoNext) return;
    const nextOffset = weekOffset + 1;
    setWeekOffset(nextOffset);
    const newDays = getWeekDates(nextOffset);
    setReflectionState(loadReflection(fmt(newDays[0])));
  }, [weekOffset, canGoNext]);

  const weekLabel = (() => {
    const start = days[0];
    const end   = days[6];
    const opts  = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
  })();

  return {
    days, dayStats, today,
    totalSessions, totalMins, totalTodos, daysWithAllGoals,
    maxSessions, streak,
    isCurrentWeek, canGoNext,
    weekLabel, reflection, saveReflection,
    prevWeek, nextWeek,
  };
};
