import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, RotateCcw, ChevronDown } from 'lucide-react';
import { usePomodoroContext } from '../../context/PomodoroContext';
import './FocusCoach.css';

/* ── Quick-action chips ── */
const CHIPS = [
  { label: "I can't focus",      prompt: "I'm struggling to focus right now. What should I do?" },
  { label: 'Boost my motivation', prompt: 'I need a quick motivational boost to get back on track.' },
  { label: 'Plan my session',     prompt: 'Help me plan my next focused work session effectively.' },
  { label: 'I feel overwhelmed',  prompt: "I feel overwhelmed by everything I need to do. Help me cut through it." },
  { label: 'Best Pomodoro tips',  prompt: 'What are the most powerful Pomodoro technique tips you know?' },
  { label: 'Beat procrastination',prompt: 'Give me your best tactics for beating procrastination right now.' },
];

const WELCOME = `Hey! I'm your Focus Coach — here to help you do your best work.\n\nAsk me anything: staying focused, planning your sessions, beating procrastination, or just general help. I've got you.`;

/* ── Typewriter for welcome message ── */
const useTypewriter = (text, speed = 18) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { displayed, done };
};

/* ── Render text with newlines → <br> ── */
const MsgText = ({ text }) => (
  <span>
    {text.split('\n').map((line, i, arr) => (
      <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
    ))}
  </span>
);

export const FocusCoach = () => {
  const { mode, seconds, running, sessionCount } = usePomodoroContext();
  const [messages, setMessages]   = useState([]);  // { role, content }
  const [input, setInput]         = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showScroll, setShowScroll] = useState(false);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const listRef    = useRef(null);
  const abortRef   = useRef(null);

  const { displayed: welcomeText, done: welcomeDone } = useTypewriter(WELCOME);

  /* ── Build system context string ── */
  const buildContext = useCallback(() => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeLeft = `${mins}:${String(secs).padStart(2, '0')}`;
    return [
      `Current Pomodoro mode: ${mode === 'work' ? 'Work/Focus' : 'Break'}`,
      `Timer: ${running ? `running, ${timeLeft} remaining` : 'paused/stopped'}`,
      `Completed sessions today: ${sessionCount}`,
    ].join('\n');
  }, [mode, seconds, running, sessionCount]);

  /* ── Auto-scroll ── */
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  useEffect(() => {
    if (!streaming) scrollToBottom();
  }, [messages, streaming, scrollToBottom]);

  /* ── Scroll indicator ── */
  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScroll(distFromBottom > 120);
  };

  /* ── Send message ── */
  const send = useCallback(async (text) => {
    const content = text.trim();
    if (!content || streaming) return;

    const userMsg    = { role: 'user',      content };
    const assistantMsg = { role: 'assistant', content: '' };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setStreaming(true);

    const history = [...messages, userMsg].map(m => ({
      role: m.role, content: m.content,
    }));

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, systemContext: buildContext() }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.text) {
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  content: next[next.length - 1].content + parsed.text,
                };
                return next;
              });
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = {
            ...next[next.length - 1],
            content: "Sorry, I couldn't reach the server. Check your connection and try again.",
          };
          return next;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [messages, streaming, buildContext]);

  const onSubmit = (e) => { e.preventDefault(); send(input); };

  const onChip = (prompt) => { if (!streaming) send(prompt); };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming(false);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <div className="coach-page">
      {/* Header */}
      <div className="page-header">
        <div className="coach-title-wrap">
          <Sparkles size={18} className="coach-sparkle" />
          <h1 className="page-title">Focus Coach</h1>
        </div>
        {messages.length > 0 && (
          <button className="icon-btn" onClick={clearChat} title="Clear chat">
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      {/* Message list */}
      <div className="coach-messages" ref={listRef} onScroll={onScroll}>
        {/* Welcome bubble */}
        <div className="coach-msg coach-msg--ai coach-msg--welcome">
          <div className="coach-avatar">
            <Sparkles size={14} />
          </div>
          <div className="coach-bubble">
            <MsgText text={welcomeText} />
            {!welcomeDone && <span className="coach-cursor" />}
          </div>
        </div>

        {/* Chips — only when no messages */}
        {messages.length === 0 && welcomeDone && (
          <div className="coach-chips">
            {CHIPS.map(c => (
              <button key={c.label} className="coach-chip" onClick={() => onChip(c.prompt)}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Conversation */}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`coach-msg ${m.role === 'user' ? 'coach-msg--user' : 'coach-msg--ai'}`}
          >
            {m.role === 'assistant' && (
              <div className="coach-avatar"><Sparkles size={14} /></div>
            )}
            <div className="coach-bubble">
              {m.content
                ? <MsgText text={m.content} />
                : <span className="coach-typing"><span/><span/><span/></span>
              }
              {/* Streaming cursor on last assistant msg */}
              {streaming && i === messages.length - 1 && m.role === 'assistant' && m.content && (
                <span className="coach-cursor" />
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {showScroll && (
        <button className="coach-scroll-btn" onClick={() => scrollToBottom()}>
          <ChevronDown size={16} />
        </button>
      )}

      {/* Input */}
      <form className="coach-input-wrap" onSubmit={onSubmit}>
        <textarea
          ref={inputRef}
          className="coach-input"
          placeholder="Ask your coach anything…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={streaming}
        />
        <button
          type="submit"
          className={`coach-send ${input.trim() && !streaming ? 'active' : ''}`}
          disabled={!input.trim() || streaming}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
