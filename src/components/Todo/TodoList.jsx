import { useState } from 'react';
import { Plus, Trash2, Check, RefreshCw } from 'lucide-react';
import { useTodos } from '../../hooks/useTodos';
import './Todo.css';

const PRIORITY = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
const FILTERS  = ['all', 'active', 'completed'];

export const TodoList = () => {
  const { todos, addTodo, toggleTodo, deleteTodo, nextResetLabel } = useTodos();
  const [text, setText]         = useState('');
  const [priority, setPriority] = useState('medium');
  const [date, setDate]         = useState('');
  const [filter, setFilter]     = useState('all');

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    addTodo(text.trim(), priority, date || null);
    setText('');
    setDate('');
  };

  const visible = todos.filter(t => {
    if (filter === 'active')    return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className="todo-page">
      <div className="page-header">
        <h1 className="page-title">To-Do List</h1>
        <span className="badge">{todos.filter(t => !t.completed).length} active</span>
      </div>

      {/* Weekly reset notice */}
      <div className="todo-reset-notice">
        <RefreshCw size={11} />
        Completed tasks auto-clear every Monday · Next reset: {nextResetLabel()}
      </div>

      {/* Add form */}
      <form className="todo-form" onSubmit={submit}>
        <input
          className="field-input"
          placeholder="Add a new task…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div className="todo-form-row">
          <select className="field-select" value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
          <input
            type="date" className="field-input date-input"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <button className="btn-primary add-btn" type="submit">
            <Plus size={18} />
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="filter-tabs">
        {FILTERS.map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'completed' && completedCount > 0 && (
              <span className="filter-count">{completedCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="todo-list">
        {visible.length === 0 && (
          <div className="empty-state">No {filter === 'all' ? '' : filter} tasks</div>
        )}
        {visible.map(todo => (
          <div key={todo.id} className={`todo-item ${todo.completed ? 'done' : ''}`}>
            <button
              className="todo-check"
              onClick={() => toggleTodo(todo.id)}
              style={{ borderColor: PRIORITY[todo.priority] }}
            >
              {todo.completed && <Check size={12} color={PRIORITY[todo.priority]} />}
            </button>
            <div className="todo-body">
              <span className="todo-text">{todo.text}</span>
              {todo.date && (
                <span className="todo-date">
                  📅 {new Date(todo.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            <div className="priority-dot" style={{ background: PRIORITY[todo.priority] }} title={todo.priority} />
            <button className="icon-btn danger" onClick={() => deleteTodo(todo.id)}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
