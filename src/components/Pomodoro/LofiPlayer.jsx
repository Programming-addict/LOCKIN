import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronDown, ChevronUp, Music } from 'lucide-react';
import { usePomodoroContext } from '../../context/PomodoroContext';
import { get, set } from '../../utils/storage';
import './LofiPlayer.css';

const STATIONS = [
  { name: 'Lofi Girl',       sub: 'beats to relax / study to', id: 'jfKfPfyJRdk', emoji: '🌧️' },
  { name: 'Chillhop Radio',  sub: 'mellow hip-hop vibes',      id: '7NOSDKb0HlU', emoji: '🦝' },
  { name: 'Synthwave Radio', sub: 'retro-futuristic beats',     id: '4xDzrJKXOOY', emoji: '🌆' },
  { name: 'Jazz Vibes',      sub: 'smooth late-night jazz',     id: 'Dx5qFachd3A', emoji: '🎷' },
  { name: 'Study Beats',     sub: 'focus & concentration',      id: 'HuFYqnbVbzY', emoji: '📚' },
];

let ytApiLoaded    = false;
let ytApiCallbacks = [];

const loadYTApi = (cb) => {
  if (window.YT?.Player) { cb(); return; }
  ytApiCallbacks.push(cb);
  if (!ytApiLoaded) {
    ytApiLoaded = true;
    const tag    = document.createElement('script');
    tag.src      = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      ytApiCallbacks.forEach(fn => fn());
      ytApiCallbacks = [];
    };
  }
};

export const LofiPlayer = ({
  syncWithTimer = true,
  storageKey = 'lofi_player_state',
  title = 'Lofi Focus Music',
}) => {
  const { running } = usePomodoroContext();
  const saved = get(storageKey, null);

  const [expanded, setExpanded]   = useState(saved?.expanded ?? false);
  const [stationIdx, setStation]  = useState(saved?.stationIdx ?? 0);
  const [playing, setPlaying]     = useState(false);
  const [volume, setVolume]       = useState(saved?.volume ?? 60);
  const [muted, setMuted]         = useState(saved?.muted ?? false);
  const [ready, setReady]         = useState(false);
  const [loading, setLoading]     = useState(false);

  const playerRef       = useRef(null);
  const containerRef    = useRef(null);
  const playingRef      = useRef(false);
  const timerStartedRef = useRef(false);
  const volumeRef       = useRef(volume);
  const mutedRef        = useRef(muted);

  const station = STATIONS[stationIdx] ?? STATIONS[0];

  useEffect(() => {
    set(storageKey, { expanded, stationIdx, volume, muted });
  }, [expanded, stationIdx, volume, muted, storageKey]);

  // Keep playingRef in sync for use inside effects without stale closures
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Boot YouTube IFrame API once — containerRef must be in DOM at this point
  useEffect(() => {
    loadYTApi(() => {
      if (!containerRef.current || playerRef.current) return;
      setLoading(true);
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '1',
        width:  '1',
        videoId: STATIONS[0].id,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel:      0,
          modestbranding: 1,
        },
        events: {
          onReady: (e) => {
            const initialVolume = mutedRef.current ? 0 : volumeRef.current;
            e.target.setVolume(initialVolume);
            setReady(true);
            setLoading(false);
          },
          onStateChange: (e) => {
            const S = window.YT?.PlayerState;
            if (!S) return;
            setPlaying(e.data === S.PLAYING);
            if (e.data === S.BUFFERING) setLoading(true);
            else setLoading(false);
          },
          onError: () => setLoading(false),
        },
      });
    });
  }, []);

  // Sync music with timer: auto-play on start, auto-stop on end (only if timer started it)
  useEffect(() => {
    if (!syncWithTimer || !ready) return;
    if (running) {
      if (!playingRef.current) {
        playerRef.current?.playVideo();
        timerStartedRef.current = true;
      }
    } else {
      if (timerStartedRef.current) {
        playerRef.current?.pauseVideo();
        timerStartedRef.current = false;
      }
    }
  }, [running, ready, syncWithTimer]);

  const togglePlay = useCallback(() => {
    if (!ready || !playerRef.current) return;
    // User-initiated control clears timer ownership
    timerStartedRef.current = false;
    if (playingRef.current) playerRef.current.pauseVideo();
    else                    playerRef.current.playVideo();
  }, [ready]);

  const changeStation = useCallback((idx) => {
    setStation(idx);
    if (!playerRef.current) return;
    setLoading(true);
    playerRef.current.loadVideoById(STATIONS[idx].id);
  }, []);

  const prev = () => changeStation((stationIdx - 1 + STATIONS.length) % STATIONS.length);
  const next = () => changeStation((stationIdx + 1) % STATIONS.length);

  const handleVolume = (e) => {
    const v = +e.target.value;
    setVolume(v);
    setMuted(v === 0);
    playerRef.current?.setVolume(v);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (next) playerRef.current?.setVolume(0);
    else      playerRef.current?.setVolume(volume);
  };

  return (
    <div className={`lofi-player ${expanded ? 'expanded' : ''} ${playing ? 'active' : ''}`}>
      {/* Hidden YT player — always in DOM so the player initialises on mount */}
      <div
        ref={containerRef}
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
      />

      {/* Header row — always visible */}
      <div className="lofi-header" onClick={() => setExpanded(e => !e)}>
        <div className="lofi-header-left">
          <Music size={14} className={`lofi-music-icon ${playing ? 'spinning' : ''}`} />
            <span className="lofi-header-title">
            {playing ? `${station.emoji} ${station.name}` : title}
          </span>
          {playing && (
            <span className="lofi-live-badge">
              <span className="lofi-live-dot" />
              LIVE
            </span>
          )}
        </div>
        <div className="lofi-header-right">
          <button
            className="lofi-header-play-btn"
            onClick={e => { e.stopPropagation(); togglePlay(); }}
            disabled={!ready}
            title={playing ? 'Pause music' : 'Play music'}
          >
            {loading && !expanded
              ? <span className="lofi-spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
              : playing
                ? <Pause size={12} />
                : <Play  size={12} />
            }
          </button>
          <button className="lofi-collapse-btn" onClick={e => { e.stopPropagation(); setExpanded(o => !o); }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="lofi-body">
          {/* Waveform animation */}
          <div className={`lofi-waveform ${playing ? 'playing' : ''}`}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="lofi-bar" style={{ animationDelay: `${(i * 0.07).toFixed(2)}s` }} />
            ))}
          </div>

          {/* Station info */}
          <div className="lofi-station-info">
            <div className="lofi-station-emoji">{station.emoji}</div>
            <div className="lofi-station-text">
              <div className="lofi-station-name">{station.name}</div>
              <div className="lofi-station-sub">{station.sub}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="lofi-controls">
            <button className="lofi-ctrl-btn" onClick={prev} title="Previous station">
              <SkipBack size={16} />
            </button>
            <button
              className={`lofi-play-btn ${loading ? 'loading' : ''}`}
              onClick={togglePlay}
              disabled={!ready}
              title={playing ? 'Pause' : 'Play'}
            >
              {loading ? (
                <span className="lofi-spinner" />
              ) : playing ? (
                <Pause size={20} />
              ) : (
                <Play size={20} />
              )}
            </button>
            <button className="lofi-ctrl-btn" onClick={next} title="Next station">
              <SkipForward size={16} />
            </button>
          </div>

          {/* Station tabs */}
          <div className="lofi-stations">
            {STATIONS.map((s, i) => (
              <button
                key={s.id}
                className={`lofi-station-tab ${i === stationIdx ? 'active' : ''}`}
                onClick={() => changeStation(i)}
                title={s.name}
              >
                {s.emoji}
              </button>
            ))}
          </div>

          {/* Volume */}
          <div className="lofi-volume">
            <button className="lofi-ctrl-btn sm" onClick={toggleMute}>
              {muted || volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <input
              type="range"
              className="lofi-vol-slider"
              min={0} max={100}
              value={muted ? 0 : volume}
              onChange={handleVolume}
            />
            <span className="lofi-vol-val">{muted ? 0 : volume}</span>
          </div>
        </div>
      )}
    </div>
  );
};
