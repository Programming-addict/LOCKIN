import { useState } from 'react';
import { Palette, X, Lock } from 'lucide-react';
import { usePet, SHOP_ITEMS } from '../../hooks/usePet';
import { usePomodoroContext } from '../../context/PomodoroContext';
import './Pet.css';

/* ── Tiny SVG pet face ──────────────────────────────────────────── */
const MOUTHS = {
  happy:   'M 26 46 Q 40 58 54 46',
  focused: 'M 28 48 Q 40 53 52 48',
  sleepy:  'M 28 48 Q 40 44 52 48',
};

const PetFace = ({ equippedItem, mood, color }) => {
  const item = SHOP_ITEMS.find(i => i.id === equippedItem);
  return (
    <div className="pet-face-wrap">
      {item && <span className="pet-cosmetic" aria-hidden="true">{item.emoji}</span>}
      <svg width="72" height="72" viewBox="0 0 80 80" aria-hidden="true">
        {/* body */}
        <circle cx="40" cy="44" r="30" fill={color} />
        <circle cx="40" cy="44" r="30" fill="rgba(255,255,255,0.07)" />
        {/* eyes */}
        <ellipse cx="29" cy="40" rx="4"   ry="4.5" fill="rgba(255,255,255,0.92)" />
        <ellipse cx="51" cy="40" rx="4"   ry="4.5" fill="rgba(255,255,255,0.92)" />
        <ellipse cx="30" cy="41" rx="1.6" ry="1.8" fill="rgba(0,0,0,0.55)" />
        <ellipse cx="52" cy="41" rx="1.6" ry="1.8" fill="rgba(0,0,0,0.55)" />
        {/* mouth */}
        <path d={MOUTHS[mood]} fill="none"
          stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
};

/* ── Shop item card ─────────────────────────────────────────────── */
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
        title={!canAfford ? 'Not enough credits' : `Buy for ${item.cost} ⚡`}
      >
        {canAfford
          ? <>{item.cost} <span className="pet-credit-icon">⚡</span></>
          : <><Lock size={10} /> {item.cost}</>
        }
      </button>
    )}
  </div>
);

/* ── Main widget ────────────────────────────────────────────────── */
export const PetWidget = () => {
  const { running, mode } = usePomodoroContext();
  const { credits, ownedItems, equippedItem, unlockItem, equipItem } = usePet();
  const [shopOpen, setShopOpen] = useState(false);

  const mood  = running && mode === 'work'  ? 'focused'
              : running && mode === 'break' ? 'sleepy'
              : 'happy';
  const color = mode === 'break' ? '#22c55e' : '#3b82f6';

  return (
    <div className="pet-widget">
      <div className="pet-inner">
        <PetFace equippedItem={equippedItem} mood={mood} color={color} />
        {/* Shop button — hidden while session is active */}
        {!running && (
          <button
            className="pet-shop-trigger"
            onClick={() => setShopOpen(true)}
            title="Cosmetic shop"
          >
            <Palette size={13} />
          </button>
        )}
      </div>

      {/* ── Shop modal ──────────────────────────────────────────── */}
      {shopOpen && (
        <div className="modal-overlay" onClick={() => setShopOpen(false)}>
          <div className="modal pet-shop-modal" onClick={e => e.stopPropagation()}>

            <div className="pet-shop-header">
              <h2 className="modal-title" style={{ margin: 0 }}>Pet Shop</h2>
              <span className="pet-credit-balance">⚡ {credits} credits</span>
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
              Earn ⚡ credits by completing Pomodoro sessions
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
