import { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import './News.css';

const R2J = 'https://api.rss2json.com/v1/api.json?count=16&rss_url=';

const CATEGORIES = [
  {
    id: 'top',
    label: '🔥 Top',
    sources: [
      { url: 'http://rss.cnn.com/rss/edition.rss',              name: 'CNN'         },
      { url: 'http://feeds.bbci.co.uk/news/rss.xml',            name: 'BBC News'    },
    ],
  },
  {
    id: 'world',
    label: '🌍 World',
    sources: [
      { url: 'http://rss.cnn.com/rss/edition_world.rss',        name: 'CNN World'   },
      { url: 'http://feeds.bbci.co.uk/news/world/rss.xml',      name: 'BBC World'   },
    ],
  },
  {
    id: 'tech',
    label: '💻 Tech',
    sources: [
      { url: 'https://techcrunch.com/feed/',                    name: 'TechCrunch'  },
      { url: 'https://www.theverge.com/rss/index.xml',          name: 'The Verge'   },
    ],
  },
  {
    id: 'racing',
    label: '🏎️ Racing',
    sources: [
      { url: 'https://www.autosport.com/rss/feed/all',          name: 'Autosport'   },
      { url: 'https://www.motorsport.com/rss/all/news/',        name: 'Motorsport'  },
    ],
  },
];

const SOURCE_COLORS = {
  'CNN':         '#cc0000',
  'CNN World':   '#cc0000',
  'BBC News':    '#bb1919',
  'BBC World':   '#bb1919',
  'TechCrunch':  '#22d3ee',
  'The Verge':   '#a855f7',
  'Autosport':   '#fbbf24',
  'Motorsport':  '#fbbf24',
};

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const getImage = (item) => {
  if (item.thumbnail && item.thumbnail.startsWith('http')) return item.thumbnail;
  if (item.enclosure?.link?.match(/\.(jpg|jpeg|png|webp)/i)) return item.enclosure.link;
  const match = (item.content || item.description || '').match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) return match[1];
  return null;
};

const FALLBACK_GRADIENTS = {
  top:    'linear-gradient(135deg,#0d0d0d,#1a1a2e)',
  world:  'linear-gradient(135deg,#1a0505,#3d0f0f)',
  tech:   'linear-gradient(135deg,#031520,#0a3a52)',
  racing: 'linear-gradient(135deg,#1a0e00,#4a2c00)',
};

const fetchFeed = async (url, name) => {
  const res = await fetch(R2J + encodeURIComponent(url));
  if (!res.ok) return [];
  const data = await res.json();
  if (data.status !== 'ok') return [];
  return (data.items ?? []).map(item => ({ ...item, _source: name }));
};

export const NewsView = () => {
  const [cat, setCat]           = useState('top');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const cache = useRef({});

  const load = async (catId, force = false) => {
    if (cache.current[catId] && !force) {
      setArticles(cache.current[catId]);
      setError(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setArticles([]);
    setError(false);
    const sources = CATEGORIES.find(c => c.id === catId)?.sources ?? [];
    try {
      const all = await Promise.all(sources.map(s => fetchFeed(s.url, s.name).catch(() => [])));
      const merged = [];
      const max = Math.max(...all.map(a => a.length));
      for (let i = 0; i < max && merged.length < 16; i++) {
        all.forEach(a => { if (a[i] && merged.length < 16) merged.push(a[i]); });
      }
      cache.current[catId] = merged;
      setArticles(merged);
      if (merged.length === 0) setError(true);
    } catch {
      setError(true);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(cat); }, [cat]);

  const refresh = () => {
    delete cache.current[cat];
    load(cat, true);
  };

  const fallback = FALLBACK_GRADIENTS[cat] ?? FALLBACK_GRADIENTS.top;

  return (
    <div className="news-page">
      <div className="page-header">
        <h1 className="page-title">News</h1>
        <button className={`icon-btn${loading ? ' spinning' : ''}`} onClick={refresh} disabled={loading} title="Refresh">
          <RefreshCw size={17} />
        </button>
      </div>

      {/* Tabs */}
      <div className="news-tabs">
        {CATEGORIES.map(c => (
          <button key={c.id} className={`news-tab${cat === c.id ? ' active' : ''}`} onClick={() => setCat(c.id)}>
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
              <div className="sk-line wide" />
              <div className="sk-line medium" />
              <div className="sk-line narrow" />
            </div>
          </div>
        ))}

        {!loading && articles.map((a, i) => {
          const img   = getImage(a);
          const color = SOURCE_COLORS[a._source] ?? '#8fa3b4';

          return (
            <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" className="news-card">
              <div className="news-img-wrap" style={{ background: img ? undefined : fallback }}>
                {img
                  ? <img src={img} alt="" className="news-img" loading="lazy" />
                  : <span className="news-img-label">{a._source}</span>
                }
              </div>
              <div className="news-card-body">
                <span className="news-source-badge" style={{ color, borderColor: color + '50', background: color + '18' }}>
                  {a._source}
                </span>
                <p className="news-title">{a.title}</p>
                <span className="news-time">{timeAgo(a.pubDate)}</span>
              </div>
            </a>
          );
        })}

        {!loading && articles.length === 0 && (
          <p className="news-empty">
            {error ? 'Could not load articles — try refreshing' : 'No articles found'}
          </p>
        )}
      </div>
    </div>
  );
};
