import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, arrayUnion, increment } from 'firebase/firestore';
import { db, firebaseEnabled } from '../firebase';
import { useAuth } from '../context/AuthContext';

/* ── Catalogue — max 5 items, cosmetic only ── */
export const SHOP_ITEMS = [
  { id: 'hat',     emoji: '🎩', label: 'Top Hat',      cost: 25 },
  { id: 'crown',   emoji: '👑', label: 'Crown',         cost: 60 },
  { id: 'flowers', emoji: '🌸', label: 'Flower Crown',  cost: 45 },
  { id: 'bolt',    emoji: '⚡', label: 'Spark',         cost: 30 },
  { id: 'shades',  emoji: '🕶️', label: 'Shades',        cost: 35 },
];

/* Firestore path: top-level users/{uid} document */
const petRef = (uid) => doc(db, 'users', uid);

export const usePet = () => {
  const { user } = useAuth();
  const [credits,      setCredits]      = useState(0);
  const [ownedItems,   setOwnedItems]   = useState([]);
  const [equippedItem, setEquippedItem] = useState(null);

  /* ── Live sync ── */
  useEffect(() => {
    if (!firebaseEnabled || !db || !user) return;
    const unsub = onSnapshot(petRef(user.uid), snap => {
      const d = snap.data() ?? {};
      setCredits(     d.focusCredits ?? 0);
      setOwnedItems(  d.ownedItems   ?? []);
      setEquippedItem(d.equippedItem ?? null);
    }, () => {});
    return unsub;
  }, [user]);

  /* ── Unlock + auto-equip (atomic) ── */
  const unlockItem = useCallback(async (item) => {
    if (!user || !firebaseEnabled || !db) return;
    if (credits < item.cost) return;
    await setDoc(petRef(user.uid), {
      focusCredits: increment(-item.cost),
      ownedItems:   arrayUnion(item.id),
      equippedItem: item.id,          // auto-equip on unlock
    }, { merge: true });
  }, [user, credits]);

  /* ── Equip / unequip ── */
  const equipItem = useCallback(async (itemId) => {
    if (!user || !firebaseEnabled || !db) return;
    await setDoc(petRef(user.uid), { equippedItem: itemId ?? null }, { merge: true });
  }, [user]);

  /* ── Award credits (called on session complete) ── */
  const awardCredits = useCallback(async (n = 25) => {
    if (!user || !firebaseEnabled || !db) return;
    await setDoc(petRef(user.uid), { focusCredits: increment(n) }, { merge: true });
  }, [user]);

  return { credits, ownedItems, equippedItem, unlockItem, equipItem, awardCredits };
};
