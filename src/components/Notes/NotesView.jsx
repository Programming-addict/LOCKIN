import { useState, useRef, useEffect } from 'react';
import { Plus, Pin, Trash2, Search, X } from 'lucide-react';
import { useNotes, NOTE_COLORS } from '../../hooks/useNotes';
import './Notes.css';

const COLOR_MAP = {
  default: { bg: 'var(--surface-2)',  border: 'var(--border)',        label: 'Default' },
  cyan:    { bg: 'rgba(34,211,238,.06)', border: 'rgba(34,211,238,.25)',  label: 'Cyan'    },
  amber:   { bg: 'rgba(251,191,36,.06)', border: 'rgba(251,191,36,.25)',  label: 'Amber'   },
  rose:    { bg: 'rgba(251,113,133,.06)',border: 'rgba(251,113,133,.25)', label: 'Rose'    },
  emerald: { bg: 'rgba(52,211,153,.06)', border: 'rgba(52,211,153,.25)',  label: 'Emerald' },
};

const NoteCard = ({ note, onUpdate, onDelete, onTogglePin }) => {
  const [editing, setEditing]     = useState(!note.title && !note.body);
  const [title, setTitle]         = useState(note.title);
  const [body, setBody]           = useState(note.body);
  const [showColors, setShowColors] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => { if (editing && bodyRef.current) bodyRef.current.focus(); }, [editing]);

  const save = () => {
    onUpdate(note.id, { title: title.trim(), body: body.trim() });
    setEditing(false);
    setShowColors(false);
  };

  const colors = COLOR_MAP[note.color] || COLOR_MAP.default;
  const relTime = (() => {
    const diff = Date.now() - new Date(note.updatedAt).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return 'just now';
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  })();

  return (
    <div
      className={`note-card ${editing ? 'editing' : ''} ${note.pinned ? 'pinned' : ''}`}
      style={{ background: colors.bg, borderColor: colors.border }}
      onClick={() => !editing && setEditing(true)}
    >
      {editing ? (
        <>
          <input
            className="note-title-input"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Tab' && (e.preventDefault(), bodyRef.current?.focus())}
          />
          <textarea
            ref={bodyRef}
            className="note-body-input"
            placeholder="Write something…"
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={5}
          />
          <div className="note-edit-actions">
            {/* Color picker */}
            <div className="color-picker-wrap">
              <button className="note-action-btn" onClick={() => setShowColors(s => !s)} title="Color">
                <span className="color-dot" style={{ background: colors.border }} />
              </button>
              {showColors && (
                <div className="color-picker">
                  {NOTE_COLORS.map(c => (
                    <button
                      key={c}
                      className={`color-swatch ${note.color === c ? 'active' : ''}`}
                      style={{ background: COLOR_MAP[c].border }}
                      onClick={(e) => { e.stopPropagation(); onUpdate(note.id, { color: c }); setShowColors(false); }}
                      title={COLOR_MAP[c].label}
                    />
                  ))}
                </div>
              )}
            </div>
            <button className="note-action-btn" onClick={(e) => { e.stopPropagation(); onTogglePin(note.id); }} title={note.pinned ? 'Unpin' : 'Pin'}>
              <Pin size={14} className={note.pinned ? 'pinned-icon' : ''} />
            </button>
            <button className="note-action-btn danger" onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} title="Delete">
              <Trash2 size={14} />
            </button>
            <button className="note-save-btn" onClick={(e) => { e.stopPropagation(); save(); }}>
              Done
            </button>
          </div>
        </>
      ) : (
        <>
          {note.pinned && <Pin size={11} className="pin-badge" />}
          {note.title && <div className="note-title">{note.title}</div>}
          {note.body  && <div className="note-body">{note.body}</div>}
          <div className="note-meta">{relTime}</div>
          <div className="note-hover-actions">
            <button className="note-action-btn" onClick={e => { e.stopPropagation(); onTogglePin(note.id); }} title={note.pinned ? 'Unpin' : 'Pin'}>
              <Pin size={13} />
            </button>
            <button className="note-action-btn danger" onClick={e => { e.stopPropagation(); onDelete(note.id); }} title="Delete">
              <Trash2 size={13} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const NotesView = () => {
  const { notes, addNote, updateNote, deleteNote, togglePin } = useNotes();
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? notes.filter(n =>
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        n.body.toLowerCase().includes(query.toLowerCase())
      )
    : notes;

  const handleAdd = () => addNote();

  return (
    <div className="notes-page">
      <div className="page-header">
        <h1 className="page-title">Notes</h1>
        <span className="badge">{notes.length}</span>
        <button className="btn-primary notes-add-btn" onClick={handleAdd}>
          <Plus size={16} /> New Note
        </button>
      </div>

      {notes.length > 2 && (
        <div className="notes-search-wrap">
          <Search size={15} className="search-icon" />
          <input
            className="notes-search"
            placeholder="Search notes…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="notes-empty">
          {query ? 'No notes match your search' : (
            <>
              <div className="notes-empty-icon">📝</div>
              <div className="notes-empty-title">No notes yet</div>
              <div className="notes-empty-sub">Click "New Note" to get started</div>
            </>
          )}
        </div>
      )}

      <div className="notes-grid">
        {filtered.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            onUpdate={updateNote}
            onDelete={deleteNote}
            onTogglePin={togglePin}
          />
        ))}
      </div>
    </div>
  );
};
