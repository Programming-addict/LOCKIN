import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import './News.css';

const CATEGORIES = [
  { id: 'all',    label: '🔥 Top',    subs: ['worldnews','technology','formula1','space'] },
  { id: 'world',  label: '🌍 World',  subs: ['worldnews','UkraineWarVideoReport','geopolitics'] },
  { id: 'tech',   label: '💻 Tech',   subs: ['technology','artificial','Futurology'] },
  { id: 'racing', label: '🏎️ Racing', subs: ['formula1','motorsports','NASCAR'] },
];

const CAT_COLORS = { world: '#fb7185', tech: '#22d3ee', racing: '#fbbf24', all: '#a78bfa' };
const CAT_LABELS = { worldnews: 'World', UkraineWarVideoReport: 'War', geopolitics: 'World',
                     technology: 'Tech', artificial: 'AI', Futurology: 'Future',
                     formula1: 'F1', motorsports: 'Racing', NASCAR: 'NASCAR', space: 'Space' };

const timeAgo = (unix) => {
  const s = Math.floor(Date.now() / 1000 - unix);
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const getImage = (post) => {
  // Try preview first (best quality)
  const res = post.preview?.images?.[0]?.resolutions;
  if (res?.length) return res[Math.min(2, res.length - 1)].url.replace(/&amp;/g, '&');
  // Fall back to thumbnail
  const t = post.thumbnail;
  if (t && !['self','default','nsfw','image','spoiler',''].includes(t)) return t;
  return null;
};

const CAT_GRADIENTS = {
  world:  'linear-gradient(135deg,#3b0d14,#7f1d3a)',
  UkraineWarVideoReport: 'linear-gradient(135deg,#3b0d14,#7f1d3a)',
  geopolitics: 'linear-gradient(135deg,#3b0d14,#7f1d3a)',
  technology: 'linear-gradient(135deg,#0c2236,#0e4a6e)',
  artificial: 'linear-gradient(135deg,#0c2236,#0e4a6e)',
  Futurology: 'linear-gradient(135deg,#0c2236,#0e4a6e)',
  formula1:   'linear-gradient(135deg,#2d1500,#7a3500)',
  motorsports:'linear-gradient(135deg,#2d1500,#7a3500)',
  NASCAR:     'linear-gradient(135deg,#2d1500,#7a3500)',
  space:      'linear-gradient(135deg,#0d0d2e,#1a1a5c)',
};

export const NewsView = () => {
  const [cat, setCat]         = useState('all');
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchNews = useCallback(async (catId) => {
    setLoading(true);
    setStories([]);
    const subs = CATEGORIES.find(c => c.id === catId)?.subs ?? ['worldnews'];
    try {
      const results = await Promise.all(
        subs.map(sub =>
          fetch(`https://www.reddit.com/r/${sub}/top.json?limit=8&t=day`)
            .then(r => r.json())
            .then(d => (d.data?.children ?? []).map(c => ({ ...c.data, _sub: sub })))
            .catch(() => [])
        )
      );
      // Interleave results and limit to 20
      const interleaved = [];
      const max = Math.max(...results.map(r => r.length));
      for (let i = 0; i < max && interleaved.length < 20; i++) {
        results.forEach(r => { if (r[i] && interleaved.length < 20) interleaved.push(r[i]); });
      }
      setStories(interleaved);
    } catch { setStories([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNews(cat); }, [cat, fetchNews, refreshKey]);

  return (
    <div className="news-page">

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">News</h1>
        <button
          className={`icon-btn${loading ? ' spinning' : ''}`}
          onClick={() => setRefreshKey(k => k + 1)}
          disabled={loading}
          title="Refresh"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      {/* Category tabs */}
      <div className="news-tabs">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            className={`news-tab${cat === c.id ? ' active' : ''}`}
            style={cat === c.id ? { color: CAT_COLORS[c.id], borderColor: CAT_COLORS[c.id] + '44' } : {}}
            onClick={() => setCat(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="news-grid">
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="news-card skeleton">
            <div className="news-img-wrap sk-img" />
            <div className="news-card-body">
              <div className="sk-line tall" />
              <div className="sk-line short" />
              <div className="sk-line tiny" />
            </div>
          </div>
        ))}

        {!loading && stories.map((s, i) => {
          const img = getImage(s);
          const subLabel = CAT_LABELS[s._sub] ?? s._sub;
          const color = Object.values(CAT_COLORS).find(
            (_, ci) => Object.keys(CAT_LABELS).filter(k => k === s._sub).length > 0
          ) ?? '#a78bfa';

          const catColor = s._sub.includes('war') || s._sub === 'worldnews' || s._sub === 'geopolitics' || s._sub === 'UkraineWarVideoReport'
            ? CAT_COLORS.world
            : s._sub === 'formula1' || s._sub === 'motorsports' || s._sub === 'NASCAR'
            ? CAT_COLORS.racing
            : s._sub === 'space'
            ? '#a78bfa'
            : CAT_COLORS.tech;

          return (
            <a
              key={s.id ?? i}
              href={s.url?.startsWith('http') ? s.url : `https://reddit.com${s.permalink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="news-card"
            >
              {/* Image */}
              <div
                className="news-img-wrap"
                style={{ background: CAT_GRADIENTS[s._sub] ?? 'var(--surface-3)' }}
              >
                {img && <img src={img} alt="" className="news-img" loading="lazy" />}
                {!img && <div className="news-img-label">{subLabel}</div>}
              </div>

              {/* Body */}
              <div className="news-card-body">
                <span className="news-badge" style={{ color: catColor, borderColor: catColor + '44', background: catColor + '15' }}>
                  {subLabel}
                </span>
                <p className="news-title">{s.title}</p>
                <span className="news-time">{timeAgo(s.created_utc)}</span>
              </div>
            </a>
          );
        })}

        {!loading && stories.length === 0 && (
          <div className="news-empty">No stories found — try refreshing</div>
        )}
      </div>
    </div>
  );
};
