import { useState, useEffect } from 'react';
import { get, set, todayKey } from '../utils/storage';

const STORAGE_KEY = 'streak_data';

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

export const useStreak = (allDone) => {
  const [streak, setStreak] = useState(() => get(STORAGE_KEY, { current: 0, best: 0, lastDate: null }));

  // When allDone flips to true today, record it
  useEffect(() => {
    if (!allDone) return;
    const today = todayKey();
    setStreak(prev => {
      if (prev.lastDate === today) return prev; // already counted today
      const isConsecutive = prev.lastDate === yesterday();
      const current = isConsecutive ? prev.current + 1 : 1;
      const best = Math.max(current, prev.best);
      const next = { current, best, lastDate: today };
      set(STORAGE_KEY, next);
      return next;
    });
  }, [allDone]);

  // Check on mount if yesterday was missed (streak should reset)
  useEffect(() => {
    setStreak(prev => {
      const today = todayKey();
      if (!prev.lastDate || prev.lastDate === today || prev.lastDate === yesterday()) return prev;
      // Missed a day — current streak resets (best stays)
      const next = { ...prev, current: 0 };
      set(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return streak;
};
