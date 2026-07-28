// ─────────────────────────────────────────────────────────────
// api/config.js
// ─────────────────────────────────────────────────────────────
// Single source of truth for the backend origin and the mobile
// auth prefix. Override the origin at build time with
// EXPO_PUBLIC_API_URL=<https://api.example.com>.
//
// Defaults per runtime:
//   Android emulator  → http://10.0.2.2:8080
//   iOS simulator     → http://127.0.0.1:8080
//   Physical phone    → http://<your-LAN-ip>:8080   (set via .env.local)
//   Expo web (browser)→ http://127.0.0.1:8080       (laptop loopback)
//
// `localhost` on a physical phone points at the phone, not the
// development machine. `10.0.2.2` only exists inside the Android
// emulator — using it from the browser silently fails.
// ─────────────────────────────────────────────────────────────
import { Platform } from 'react-native';

const DEFAULT_DEV_URL = Platform.select({
  android: 'http://10.0.2.2:8080',
  ios: 'http://127.0.0.1:8080',
  // `web` here covers `npx expo start --web` (the browser on your
  // laptop). It defaults to localhost — same machine as the dev
  // server — which is what Expo Web actually needs.
  web: 'http://127.0.0.1:8080',
  default: 'http://127.0.0.1:8080',
});

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_DEV_URL;

export const MOBILE_AUTH_PREFIX = '/api/mobile/auth';

export function authUrl(path) {
  // path should begin with '/', e.g. '/login'
  return `${API_BASE_URL}${MOBILE_AUTH_PREFIX}${path}`;
}

export function apiUrl(path) {
  // path should begin with '/', e.g. '/opportunities'
  return `${API_BASE_URL}/api${path}`;
}