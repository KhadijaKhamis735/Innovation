// ─────────────────────────────────────────────────────────────
// api/tokenStore.js
// ─────────────────────────────────────────────────────────────
// Thin async wrapper over `expo-secure-store` on native (iOS,
// Android, tvOS) and `localStorage` in the browser. Stores:
//   - mobile.accessToken     (Bearer JWT, short-lived)
//   - mobile.refreshToken    (rotating refresh token, 7-day TTL)
//
// Why SecureStore (not AsyncStorage) on native: tokens must not
// be readable by other apps or by backup tools. SecureStore uses
// the iOS Keychain / Android Keystore.
//
// On web (`npx expo start --web`), `expo-secure-store` is not
// supported and would throw. We fall back to `localStorage` —
// it's far less secure (any script on the page can read it), but
// the dev browser on the same laptop is the only "web" target we
// have, and tokens stored here are never used outside that
// browser. Production mobile builds do not hit this branch.
// ─────────────────────────────────────────────────────────────
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'mobile.accessToken';
const REFRESH_KEY = 'mobile.refreshToken';

const isWeb = Platform.OS === 'web';

// ── Web fallback ──────────────────────────────────────────────
function webGet(key) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function webSet(key, value) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, String(value));
  } catch {
    // Quota exceeded / private mode — ignore; the caller's
    // signIn/signOut will still return a usable response.
  }
}

function webDel(key) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ── Public API ────────────────────────────────────────────────

export async function getAccessToken() {
  if (isWeb) return webGet(ACCESS_KEY);
  try {
    return await SecureStore.getItemAsync(ACCESS_KEY);
  } catch {
    return null;
  }
}

export async function getRefreshToken() {
  if (isWeb) return webGet(REFRESH_KEY);
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    return null;
  }
}

export async function setTokens({ accessToken, refreshToken }) {
  if (isWeb) {
    if (accessToken != null) webSet(ACCESS_KEY, accessToken);
    if (refreshToken != null) webSet(REFRESH_KEY, refreshToken);
    return;
  }
  const writes = [];
  if (accessToken != null) {
    writes.push(SecureStore.setItemAsync(ACCESS_KEY, String(accessToken)));
  }
  if (refreshToken != null) {
    writes.push(SecureStore.setItemAsync(REFRESH_KEY, String(refreshToken)));
  }
  await Promise.all(writes);
}

export async function clearTokens() {
  if (isWeb) {
    webDel(ACCESS_KEY);
    webDel(REFRESH_KEY);
    return;
  }
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY).catch(() => {}),
    SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {}),
  ]);
}