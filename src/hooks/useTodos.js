import { useState, useEffect, useCallback } from 'react';
import { get, set } from '../utils/storage';

let nextId = Date.now();

const WEEK_RESET_KEY = 'todos_week_reset';

// Monday of the current week as 'YYYY-MM-DD'
export const currentMondayKey = () => {
  const today = new Date();
  const d = new Date(today);
  d.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

// Sunday of the current week as a readable string
const nextResetLabel = () => {
  const today = new Date();
  const sun = new Date(today);
  sun.setDate(today.getDate() + (7 - today.getDay()) % 7 || 7);
  return sun.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

// Returns true if a weekly reset was run
const runWeeklyReset = () => {
  const thisMon  = currentMondayKey();
  const lastReset = get(WEEK_RESET_KEY, null);
  if (lastReset === thisMon) return false; // already reset this week

  // New week — drop completed todos
  const active = get('todos', []).filter(t => !t.completed);
  set('todos', active);
  set(WEEK_RESET_KEY, thisMon);
  return true;
};

export const useTodos = () => {
  const [todos, setTodos] = useState(() => {
    runWeeklyReset();
    return get('todos', []);
  });

  // Periodic check so a long-lived session catches Monday rollover
  useEffect(() => {
    const iv = setInterval(() => {
      if (runWeeklyReset()) {
        setTodos(get('todos', []));
      }
    }, 30_000);
    return () => clearInterval(iv);
  }, []);

  const persist = (list) => { setTodos(list); set('todos', list); };

  const addTodo = useCallback((text, priority = 'medium', date = null) => {
    const todo = {
      id: ++nextId,
      text,
      priority,
      date,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    persist([todo, ...get('todos', [])]);
  }, []);

  const toggleTodo = useCallback((id) => {
    persist(
      get('todos', []).map(t =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null }
          : t
      )
    );
  }, []);

  const deleteTodo = useCallback((id) => {
    persist(get('todos', []).filter(t => t.id !== id));
  }, []);

  const getTodosForDate = useCallback((dateStr) => {
    return todos.filter(t => t.date === dateStr);
  }, [todos]);

  return { todos, addTodo, toggleTodo, deleteTodo, getTodosForDate, nextResetLabel };
};
