import { useState, useEffect, useCallback } from 'react';
import { get, set, todayKey } from '../utils/storage';
import { playCelebration } from '../utils/sounds';

const STORAGE_KEY  = 'daily_goals';
const HISTORY_KEY  = 'goals_history'; // { 'YYYY-MM-DD': { goals, completed } }

const loadToday = () => {
  const data  = get(STORAGE_KEY, {});
  const today = todayKey();
  if (data.date === today) return data;
  return { date: today, goals: [], completed: [], set: true }; // Empty by default, no popup needed
};

const writeHistory = (date, goals, completed) => {
  const hist = get(HISTORY_KEY, {});
  hist[date]  = { goals, completed };
  set(HISTORY_KEY, hist);
};

export const useDailyGoals = () => {
  const [state, setState]       = useState(loadToday);
  const [celebrated, setCelebrated] = useState(false);

  // Midnight reset
  useEffect(() => {
    const iv = setInterval(() => {
      const loaded = loadToday();
      if (loaded.date !== state.date) { setState(loaded); setCelebrated(false); }
    }, 30_000);
    return () => clearInterval(iv);
  }, [state.date]);

  const persist = useCallback((next) => {
    setState(next);
    set(STORAGE_KEY, next);
    // Always keep history in sync
    writeHistory(next.date, next.goals, next.completed);
  }, []);

  const setGoals = useCallback((goals) => {
    persist({ ...state, goals, set: true });
  }, [state, persist]);

  const addGoal = useCallback(() => {
    const next = { ...state, goals: [...state.goals, ''], completed: [...state.completed, false] };
    persist(next);
  }, [state, persist]);

  const updateGoal = useCallback((index, text) => {
    const goals = [...state.goals];
    goals[index] = text;
    const next = { ...state, goals };
    persist(next);
  }, [state, persist]);

  const deleteGoal = useCallback((index) => {
    const goals = state.goals.filter((_, i) => i !== index);
    const completed = state.completed.filter((_, i) => i !== index);
    const next = { ...state, goals, completed };
    persist(next);
  }, [state, persist]);

  const toggleGoal = useCallback((index) => {
    const completed = [...state.completed];
    completed[index] = !completed[index];
    const next = { ...state, completed };
    persist(next);
    if (completed.every(Boolean) && !celebrated) {
      setCelebrated(true);
      playCelebration();
    }
  }, [state, celebrated, persist]);

  const filledGoals = state.goals.filter(g => g.trim().length > 0);
  const filledCount = filledGoals.length;
  const completedCount = state.completed.filter((c, i) => c && state.goals[i].trim().length > 0).length;
  const allDone = filledCount > 0 && completedCount === filledCount;

  return {
    goals:     state.goals,
    completed: state.completed,
    goalsSet:  state.set,
    setGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleGoal,
    completedCount,
    allDone,
    filledCount,
  };
};
