// Thin typed wrappers around window.localStorage for Club Management data.
// Mirrors the project convention used by other features (adminToken, etc).

export function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // localStorage may throw in private mode — ignore.
  }
}

export function remove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    // ignore
  }
}

export function clearAll() {
  try {
    const toDelete = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('club:')) toDelete.push(k);
    }
    toDelete.forEach((k) => window.localStorage.removeItem(k));
  } catch (err) {
    // ignore
  }
}