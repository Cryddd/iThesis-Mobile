import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolve the Django REST API base URL.
 *
 * Priority:
 *   1. `EXPO_PUBLIC_API_BASE_URL` env (set this to the deployed server /
 *      ngrok tunnel — e.g. https://ithesis.batstate-u.edu.ph/api/v1).
 *   2. `expo.extra.apiBaseUrl` from app.json.
 *   3. Sensible local dev defaults:
 *        - Android emulator reaches host localhost via 10.0.2.2
 *        - iOS simulator can use 127.0.0.1
 *
 * The mobile app NEVER talks to PostgreSQL directly — only this REST API.
 */
function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.replace(/\/+$/, '');
  }

  const fromExtra = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)
    ?.apiBaseUrl;
  if (fromExtra && fromExtra.trim().length > 0) {
    return fromExtra.replace(/\/+$/, '');
  }

  const host = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
  return `http://${host}:8000/api/v1`;
}

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Server origin (scheme + host), derived from the API base by stripping the
 * `/api/v1` suffix. Used to build the CSRF endpoint (`/api/csrf/`) and to
 * absolutise the relative media URLs the backend returns (documents,
 * thumbnails, executive summaries — all `/api/theses/{id}/…`).
 */
export const API_ORIGIN = API_BASE_URL.replace(/\/api(\/v1)?$/, '');

/** Backend CSRF token endpoint (returns `{ csrftoken }` in the body). */
export const CSRF_URL = `${API_ORIGIN}/api/csrf/`;

/** Prefix a backend-relative media path with the server origin. */
export function absoluteMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

export const config = {
  apiBaseUrl: API_BASE_URL,
  apiOrigin: API_ORIGIN,
  csrfUrl: CSRF_URL,
  // Guest browse access TTL mirrors the web (30 minutes).
  guestSessionTtlMs: 30 * 60 * 1000,
  requestTimeoutMs: 20000,
} as const;
