import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ExternalLink, MessageSquare, TrendingUp, Zap, Eye, Newspaper } from 'lucide-react';
import './News.css';

const FEEDS = [
  { id: 'topstories',  label: 'Top',   icon: TrendingUp },
  { id: 'newstories',  label: 'New',   icon: Zap        },
  { id: 'beststories', label: 'Best',  icon: Eye        },
  { id: 'askstories',  label: 'Ask',   icon: MessageSquare },
];

const BASE = 'https://hacker-news.firebaseio.com/v0';
const LIMIT = 20;

const getDomain = (url) => {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return 'news.ycombinator.com'; }
};

const timeAgo = (unixTime) => {
  const diff = Math.floor((Date.now() / 1000) - unixTime);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const SkeletonCard = () => (
  <div className="news-skeleton">
    <div className="sk-line wide" />
    <div className="sk-line medium" />
    <div className="sk-meta" />
  </div>
);

export const NewsView = () => {
  const [feed, setFeed]       = useState('topstories');
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStories = useCallback(async (feedId, isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setStories([]);
    try {
      const ids = await fetch(`${BASE}/${feedId}.json`).then(r => r.json());
      const top = ids.slice(0, LIMIT);
      const items = await Promise.all(
        top.map(id => fetch(`${BASE}/item/${id}.json`).then(r => r.json()))
      );
      setStories(items.filter(Boolean));
    } catch {
      setStories([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStories(feed);
  }, [feed, fetchStories]);

  const handleRefresh = () => fetchStories(feed, true);

  return (
    <div className="news-page">
      <div className="page-header">
        <h1 className="page-title">News</h1>
        <button
          className={`icon-btn ${refreshing ? 'spinning' : ''}`}
          onClick={handleRefresh}
          disabled={loading || refreshing}
          title="Refresh"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      <p className="news-source-label">
        <Newspaper size={12} />
        Powered by Hacker News
      </p>

      {/* Feed tabs */}
      <div className="news-tabs">
        {FEEDS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`news-tab ${feed === id ? 'active' : ''}`}
            onClick={() => setFeed(id)}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Stories */}
      <div className="news-list">
        {loading && Array.from({ length: LIMIT }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}

        {!loading && stories.length === 0 && (
          <div className="empty-state">Failed to load — check your connection</div>
        )}

        {!loading && stories.map((story, i) => (
          <a
            key={story.id}
            href={story.url || `https://news.ycombinator.com/item?id=${story.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card"
          >
            <div className="news-rank">{i + 1}</div>

            <div className="news-body">
              <div className="news-title">{story.title}</div>
              <div className="news-meta">
                <span className="news-domain">
                  <ExternalLink size={10} />
                  {getDomain(story.url)}
                </span>
                <span className="news-dot" />
                <span>▲ {story.score ?? 0}</span>
                <span className="news-dot" />
                <span>
                  <MessageSquare size={10} style={{ display:'inline', verticalAlign:'middle', marginRight:3 }} />
                  {story.descendants ?? 0}
                </span>
                <span className="news-dot" />
                <span>{timeAgo(story.time)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
