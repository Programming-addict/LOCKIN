import { useState, useEffect, useRef } from 'react';
import { Lock, Palette, X } from 'lucide-react';
import { usePet, SHOP_ITEMS } from '../../hooks/usePet';
import { usePomodoroContext } from '../../context/PomodoroContext';
import './Pet.css';

/* ── Color palettes per mode ── */
const PAL = {
  work: {
    body: '#4f8ef7', dark: '#1d4ed8', belly: '#bfdbfe',
    ear: '#fda4af', paw: '#3b82f6', glow: '59,130,246',
  },
  break: {
    body: '#34d472', dark: '#15803d', belly: '#bbf7d0',
    ear: '#fda4af', paw: '#22c55e', glow: '34,197,94',
  },
};

const MOUTHS = {
  happy:   'M 50 73 Q 60 82 70 73',
  focused: 'M 51 74 Q 60 77 69 74',
  sleepy:  'M 52 73 Q 60 79 68 73',
};

/* ══════════════════════════════════════════
   CAT CHARACTER
══════════════════════════════════════════ */
const PetCharacter = ({ mood, mode, equippedItem, onPet }) => {
  const [blink,    setBlink]    = useState(false);
  const [reacting, setReacting] = useState(false);
  const timerRef = useRef(null);

  const pal  = PAL[mode] || PAL.work;
  const item = SHOP_ITEMS.find(i => i.id === equippedItem);

  /* ── Random blink ── */
  useEffect(() => {
    const schedule = () => {
      timerRef.current = setTimeout(() => {
        setBlink(true);
        setTimeout(() => { setBlink(false); schedule(); }, 130);
      }, 2400 + Math.random() * 3600);
    };
    schedule();
    return () => clearTimeout(timerRef.current);
  }, []);

  /* ── Click reaction ── */
  const handleClick = () => {
    if (reacting) return;
    setReacting(true);
    setTimeout(() => setReacting(false), 650);
    onPet?.();
  };

  /* Eye scale: blink → shut, focused → squint, sleepy → half, happy → open */
  const eyeScale = blink ? 0.04
    : mood === 'focused' ? 0.33
    : mood === 'sleepy'  ? 0.48
    : 1;
  const pupilY = mood === 'sleepy' ? 55 : 53;

  return (
    <div
      className={`pet-character pet-mood--${mood} ${reacting ? 'pet-reacting' : ''}`}
      onClick={handleClick}
      style={{ '--glow': pal.glow }}
      title="Click to pet!"
    >
      {/* Cosmetic item above head */}
      {item && (
        <span className="pet-cosmetic" aria-hidden="true">{item.emoji}</span>
      )}

      {/* Sparkle burst on click */}
      {reacting && (
        <div className="pet-sparkles" aria-hidden="true">
          {['✨', '⭐', '💫', '✨'].map((s, i) => (
            <span key={i} className="pet-spark" style={{ '--i': i }}>{s}</span>
          ))}
        </div>
      )}

      {/* Floating Z's when sleepy */}
      {mood === 'sleepy' && (
        <div className="pet-zzz" aria-hidden="true">
          {['z', 'z', 'Z'].map((z, i) => (
            <span key={i} className="pet-z" style={{ '--i': i }}>{z}</span>
          ))}
        </div>
      )}

      <svg width="124" height="150" viewBox="0 0 120 148" style={{ overflow: 'visible' }}>

        {/* Ground shadow */}
        <ellipse cx="60" cy="144" rx="30" ry="5.5" fill="rgba(0,0,0,0.14)" />

        {/* ── Tail (CSS-animated group) ── */}
        <g className={`pet-tail ${mood === 'focused' ? 'pet-tail--paused' : ''}`}
           style={{ transformOrigin: '84px 103px' }}>
          <path
            d="M 86 103 C 110 93 118 70 105 55 C 97 43 82 50 89 67 C 95 81 82 93 82 103"
            fill="none" stroke={pal.body} strokeWidth="13" strokeLinecap="round"
          />
          <path
            d="M 86 103 C 110 93 118 70 105 55 C 97 43 82 50 89 67 C 95 81 82 93 82 103"
            fill="none" stroke={pal.belly} strokeWidth="5.5" strokeLinecap="round" opacity="0.75"
          />
        </g>

        {/* ── Body ── */}
        <path
          d="M 33 84 Q 33 69 60 69 Q 87 69 87 84 L 87 118 Q 87 134 60 134 Q 33 134 33 118 Z"
          fill={pal.body}
        />

        {/* Belly patch */}
        <ellipse cx="60" cy="107" rx="18" ry="21" fill={pal.belly} opacity="0.88" />

        {/* ── Paws ── */}
        <ellipse cx="42" cy="132" rx="14" ry="8"  fill={pal.paw} />
        <ellipse cx="78" cy="132" rx="14" ry="8"  fill={pal.paw} />
        {[37,42,47].map((x, i) => <circle key={i} cx={x} cy="135" r="2.2" fill="rgba(0,0,0,0.18)" />)}
        {[73,78,83].map((x, i) => <circle key={i} cx={x} cy="135" r="2.2" fill="rgba(0,0,0,0.18)" />)}

        {/* ── Left ear ── */}
        <polygon points="26,42 36,4 57,36" fill={pal.body} />
        <polygon points="30,39 37,10 53,33" fill={pal.ear} />

        {/* ── Right ear ── */}
        <polygon points="94,42 84,4 63,36" fill={pal.body} />
        <polygon points="90,39 83,10 67,33" fill={pal.ear} />

        {/* ── Head ── */}
        <ellipse cx="60" cy="52" rx="35" ry="33" fill={pal.body} />

        {/* ── Focused brows ── */}
        {mood === 'focused' && (<>
          <path d="M 30 40 Q 40 35 50 39" stroke="rgba(0,0,0,0.22)"
            strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d="M 90 40 Q 80 35 70 39" stroke="rgba(0,0,0,0.22)"
            strokeWidth="2.8" strokeLinecap="round" fill="none" />
        </>)}

        {/* ── Left eye ── */}
        <g style={{
          transform: `scaleY(${eyeScale})`,
          transformOrigin: '45px 52px',
          transition: 'transform 0.09s ease',
        }}>
          <ellipse cx="45" cy="52" rx="12.5" ry="13" fill="white" />
          <ellipse cx="46" cy={pupilY} rx="7.5" ry="7.5" fill="#18181b" />
          <circle  cx="41" cy="48"    r="3"               fill="white" />
        </g>

        {/* ── Right eye ── */}
        <g style={{
          transform: `scaleY(${eyeScale})`,
          transformOrigin: '75px 52px',
          transition: 'transform 0.09s ease',
        }}>
          <ellipse cx="75" cy="52" rx="12.5" ry="13" fill="white" />
          <ellipse cx="76" cy={pupilY} rx="7.5" ry="7.5" fill="#18181b" />
          <circle  cx="71" cy="48"    r="3"               fill="white" />
        </g>

        {/* Cheek blush */}
        <ellipse cx="31" cy="65" rx="10" ry="5.5" fill="rgba(255,140,140,0.38)" />
        <ellipse cx="89" cy="65" rx="10" ry="5.5" fill="rgba(255,140,140,0.38)" />

        {/* Nose */}
        <ellipse cx="60" cy="68" rx="4.5" ry="3" fill={pal.ear} />
        <ellipse cx="60" cy="68" rx="2"   ry="1.4" fill="rgba(0,0,0,0.18)" />

        {/* Mouth */}
        <path d={MOUTHS[mood]} fill="none"
          stroke="rgba(60,20,20,0.52)" strokeWidth="2.6" strokeLinecap="round" />

        {/* Whiskers */}
        <line x1="24" y1="63" x2="48" y2="67" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="24" y1="68" x2="48" y2="69" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="72" y1="67" x2="96" y2="63" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="72" y1="69" x2="96" y2="68" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" strokeLinecap="round" />

      </svg>
    </div>
  );
};

/* ══════════════════════════════════════════
   SHOP ITEM ROW
══════════════════════════════════════════ */
const ShopItem = ({ item, owned, equipped, canAfford, onUnlock, onEquip }) => (
  <div className={`pet-shop-item ${equipped ? 'pet-shop-item--equipped' : ''}`}>
    <span className="pet-item-emoji">{item.emoji}</span>
    <span className="pet-item-label">{item.label}</span>
    {owned ? (
      <button
        className={`pet-item-btn ${equipped ? 'pet-item-btn--equipped' : 'pet-item-btn--equip'}`}
        onClick={() => onEquip(equipped ? null : item.id)}
      >
        {equipped ? 'Unequip' : 'Equip'}
      </button>
    ) : (
      <button
        className="pet-item-btn pet-item-btn--buy"
        onClick={() => onUnlock(item)}
        disabled={!canAfford}
        title={!canAfford ? 'Not enough credits' : undefined}
      >
        {canAfford ? `${item.cost} cr` : <><Lock size={10} /> {item.cost}</>}
      </button>
    )}
  </div>
);

/* ══════════════════════════════════════════
   PET WIDGET (card + shop modal)
══════════════════════════════════════════ */
export const PetWidget = () => {
  const { running, mode }  = usePomodoroContext();
  const { credits, ownedItems, equippedItem, unlockItem, equipItem } = usePet();
  const [shopOpen, setShopOpen] = useState(false);
  const [petCount, setPetCount] = useState(0);

  const mood = running && mode === 'work'  ? 'focused'
             : running && mode === 'break' ? 'sleepy'
             : 'happy';

  const modeLabel = running
    ? (mode === 'work' ? 'Working session' : 'Break time')
    : 'Ready to focus';

  const moodLabel = mood === 'focused' ? 'Focused 🎯'
                  : mood === 'sleepy'  ? 'Cooling down 😴'
                  : 'Happy 😊';

  const glowRgb = mode === 'break' ? '34,197,94' : '59,130,246';

  return (
    <div className="pet-widget">
      <div className={`pet-card pet-card--${mood}`} style={{ '--glow-rgb': glowRgb }}>

        {/* Header */}
        <div className="pet-card-top">
          <div className="pet-copy">
            <span className="pet-kicker">Focus Companion</span>
            <h3 className="pet-name">Pixel Pal</h3>
            <p className="pet-mode">{modeLabel}</p>
          </div>
          <div className="pet-credit-pill">
            <span className="pet-credit-bolt">⚡</span>
            <span>{credits}</span>
          </div>
        </div>

        {/* Character stage */}
        <div className="pet-stage">
          <div className="pet-aura" />
          <PetCharacter
            mood={mood}
            mode={mode}
            equippedItem={equippedItem}
            onPet={() => setPetCount(n => n + 1)}
          />
        </div>

        {/* Status stats */}
        <div className="pet-status-row">
          <div className="pet-status-block">
            <span className="pet-status-label">Mood</span>
            <span className="pet-status-value">{moodLabel}</span>
          </div>
          <div className="pet-status-block">
            <span className="pet-status-label">Pats given</span>
            <span className="pet-status-value">{petCount}</span>
          </div>
        </div>

        {/* Shop button — hidden during sessions */}
        {!running && (
          <button className="pet-shop-trigger" onClick={() => setShopOpen(true)}>
            <Palette size={14} />
            <span>Customize</span>
          </button>
        )}
      </div>

      {/* ── Shop modal ── */}
      {shopOpen && (
        <div className="modal-overlay" onClick={() => setShopOpen(false)}>
          <div className="modal pet-shop-modal" onClick={e => e.stopPropagation()}>
            <div className="pet-shop-header">
              <div>
                <h2 className="modal-title" style={{ margin: 0 }}>Pet Shop</h2>
                <p className="pet-shop-subtitle">Spend credits on cosmetics.</p>
              </div>
              <span className="pet-credit-balance">{credits} cr</span>
              <button className="icon-btn" onClick={() => setShopOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="pet-shop-grid">
              {SHOP_ITEMS.map(item => (
                <ShopItem
                  key={item.id}
                  item={item}
                  owned={ownedItems.includes(item.id)}
                  equipped={equippedItem === item.id}
                  canAfford={credits >= item.cost}
                  onUnlock={unlockItem}
                  onEquip={equipItem}
                />
              ))}
            </div>

            <p className="pet-shop-hint">
              Complete Pomodoro sessions to earn credits ⚡
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
