export const get = (key, fallback = null) => {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

export const set = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
};

export const remove = (key) => {
  try { localStorage.removeItem(key); } catch { /* noop */ }
};

export const todayKey = () => new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
