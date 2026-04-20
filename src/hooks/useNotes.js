import { useState, useCallback } from 'react';
import { get, set } from '../utils/storage';

let nextId = Date.now();

export const NOTE_COLORS = ['default', 'cyan', 'amber', 'rose', 'emerald'];

export const useNotes = () => {
  const [notes, setNotes] = useState(() => get('notes', []));

  const persist = (list) => { setNotes(list); set('notes', list); };

  const addNote = useCallback((title = '', body = '') => {
    const note = {
      id: ++nextId,
      title,
      body,
      color: 'default',
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const list = [note, ...get('notes', [])];
    persist(list);
    return note.id;
  }, []);

  const updateNote = useCallback((id, changes) => {
    persist(
      get('notes', []).map(n =>
        n.id === id ? { ...n, ...changes, updatedAt: new Date().toISOString() } : n
      )
    );
  }, []);

  const deleteNote = useCallback((id) => {
    persist(get('notes', []).filter(n => n.id !== id));
  }, []);

  const togglePin = useCallback((id) => {
    const list = get('notes', []).map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
    persist(list);
  }, []);

  // Sort: pinned first, then by updatedAt desc
  const sorted = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return { notes: sorted, addNote, updateNote, deleteNote, togglePin };
};
