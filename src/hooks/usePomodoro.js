import { useState, useEffect, useRef, useCallback } from 'react';
import { get, set, todayKey } from '../utils/storage';
import { playSessionEnd, playBreakEnd } from '../utils/sounds';

const DEFAULTS  = { work: 25, break: 5 };
const STATE_KEY = 'pomo_state';

const loadPersistedState = (settings) => {
  const saved = get(STATE_KEY, null);
  if (!saved) return { mode: 'work', seconds: settings.work * 60, total: settings.work * 60 };
  if (saved.running && saved.startedAt) {
    const elapsed   = Math.floor((Date.now() - saved.startedAt) / 1000);
    const remaining = Math.max(0, saved.seconds - elapsed);
    return { mode: saved.mode, seconds: remaining, total: saved.total };
  }
  return { mode: saved.mode, seconds: saved.seconds, total: saved.total };
};

export const usePomodoro = () => {
  const [settings, setSettings] = useState(() => get('pomo_settings', DEFAULTS));
  const initState = loadPersistedState(get('pomo_settings', DEFAULTS));
  const [mode, setMode]         = useState(initState.mode);
  const [seconds, setSeconds]   = useState(initState.seconds);
  const [running, setRunning]   = useState(false);
  const [sessionCount, setSCount] = useState(() => {
    const data = get('pomo_sessions', {});
    return data[todayKey()] ?? 0;
  });

  const intervalRef  = useRef(null);
  const totalRef     = useRef(initState.total);
  const secondsRef   = useRef(initState.seconds);
  const startedAtRef = useRef(null); // wall-clock when current run began

  useEffect(() => { secondsRef.current = seconds; }, [seconds]);

  const persistState = useCallback((isRunning, startedAt = null) => {
    set(STATE_KEY, {
      mode,
      seconds:   secondsRef.current,
      total:     totalRef.current,
      running:   isRunning,
      startedAt,
    });
  }, [mode]);

  const bumpSession = useCallback(() => {
    setSCount(prev => {
      const next = prev + 1;
      const data = get('pomo_sessions', {});
      data[todayKey()] = next;
      set('pomo_sessions', data);
      return next;
    });
  }, []);

  // Shared end-of-phase logic
  const handlePhaseEnd = useCallback((currentMode) => {
    clearInterval(intervalRef.current);
    setRunning(false);
    startedAtRef.current = null;
    if (currentMode === 'work') {
      bumpSession();
      playSessionEnd();
      const secs = get('pomo_settings', DEFAULTS).break * 60;
      totalRef.current   = secs;
      secondsRef.current = secs;
      setSeconds(secs);
      setMode('break');
      set(STATE_KEY, { mode: 'break', seconds: secs, total: secs, running: false });
    } else {
      playBreakEnd();
      const secs = get('pomo_settings', DEFAULTS).work * 60;
      totalRef.current   = secs;
      secondsRef.current = secs;
      setSeconds(secs);
      setMode('work');
      set(STATE_KEY, { mode: 'work', seconds: secs, total: secs, running: false });
    }
  }, [bumpSession]);

  const tick = useCallback(() => {
    setSeconds(prev => {
      if (prev <= 1) {
        // Use mode ref via closure—read current mode at call time
        setMode(m => { handlePhaseEnd(m); return m; });
        return 0;
      }
      return prev - 1;
    });
  }, [handlePhaseEnd]);

  // Start / stop interval
  useEffect(() => {
    if (running) {
      const startedAt = Date.now();
      startedAtRef.current = startedAt;
      persistState(true, startedAt);
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(intervalRef.current);
      persistState(false);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, tick, persistState]);

  // ── Key fix: resync timer after browser throttles background tab ──
  useEffect(() => {
    if (!running) return;

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const saved = get(STATE_KEY, null);
      if (!saved?.running || !saved?.startedAt) return;

      const elapsed   = Math.floor((Date.now() - saved.startedAt) / 1000);
      const remaining = Math.max(0, saved.seconds - elapsed);

      if (remaining === 0) {
        // Timer finished while tab was hidden — trigger phase end
        clearInterval(intervalRef.current);
        setMode(m => { handlePhaseEnd(m); return m; });
        setSeconds(0);
      } else {
        // Snap to correct value, then restart interval cleanly
        clearInterval(intervalRef.current);
        setSeconds(remaining);
        secondsRef.current = remaining;
        intervalRef.current = setInterval(tick, 1000);
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [running, tick, handlePhaseEnd]);

  const toggle = () => setRunning(r => !r);

  const reset = useCallback(() => {
    setRunning(false);
    clearInterval(intervalRef.current);
    startedAtRef.current = null;
    const secs = (mode === 'work' ? settings.work : settings.break) * 60;
    setSeconds(secs);
    totalRef.current   = secs;
    secondsRef.current = secs;
    set(STATE_KEY, { mode, seconds: secs, total: secs, running: false });
  }, [mode, settings]);

  const updateSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    set('pomo_settings', newSettings);
    setRunning(false);
    clearInterval(intervalRef.current);
    startedAtRef.current = null;
    const secs = newSettings.work * 60;
    setSeconds(secs);
    totalRef.current   = secs;
    secondsRef.current = secs;
    setMode('work');
    set(STATE_KEY, { mode: 'work', seconds: secs, total: secs, running: false });
  }, []);

  const progress = totalRef.current > 0 ? 1 - seconds / totalRef.current : 0;

  return { mode, seconds, running, toggle, reset, progress, sessionCount, settings, updateSettings };
};
