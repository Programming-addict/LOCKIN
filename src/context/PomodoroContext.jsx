import { createContext, useContext } from 'react';
import { usePomodoro } from '../hooks/usePomodoro';

const PomodoroContext = createContext(null);

export const PomodoroProvider = ({ children, onSessionComplete }) => {
  // Hook lives here — never unmounts when routes change
  const pomodoro = usePomodoro(onSessionComplete);
  return (
    <PomodoroContext.Provider value={pomodoro}>
      {children}
    </PomodoroContext.Provider>
  );
};

export const usePomodoroContext = () => {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoroContext must be inside PomodoroProvider');
  return ctx;
};
