import { createContext, useContext } from 'react';
import { useReminders } from '../hooks/useReminders';

const RemindersContext = createContext(null);

export const RemindersProvider = ({ children }) => {
  const reminders = useReminders();
  return (
    <RemindersContext.Provider value={reminders}>
      {children}
    </RemindersContext.Provider>
  );
};

export const useRemindersContext = () => {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error('useRemindersContext must be inside RemindersProvider');
  return ctx;
};
