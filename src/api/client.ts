import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { config } from '@/config/env';
import { getOrCreateDeviceId } from '@/utils/deviceId';
import { authState } from './authState';

/**
 * Central Axios instance for the iThesis Django REST API.
 *
 * Auth model (mirrors the web client, NOT JWT — the backend is session based):
 *  - `withCredentials` so the Django `sessionid` cookie (set by /auth/login and
 *    persisted automatically by React Native's networking layer) rides along.
 *  - Legacy header fallback: `X-User`, `X-User-Role`, `X-User-ID` from the
 *    logged-in profile authorise librarian/admin endpoints.
 *  - `X-CSRFToken` on unsafe methods, fetched from `/api/csrf/` (the backend
 *    returns the token in the response body for cross-origin clients).
 *  - `X-Device-Id` supports single-device enforcement for staff accounts.
 */

type SessionExpiredListener = (reason: 'expired') => void;

let onSessionExpired: SessionExpiredListener | null = null;
export function setSessionExpiredListener(listener: SessionExpiredListener | null) {
  onSessionExpired = listener;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.requestTimeoutMs,
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete']);

// ---- CSRF token (lazy, cached) ---------------------------------------------

let csrfToken: string | null = null;
let csrfInFlight: Promise<string | null> | null = null;

async function fetchCsrfToken(): Promise<string | null> {
  try {
    const res = await axios.get(config.csrfUrl, { withCredentials: true });
    csrfToken = (res.data as { csrftoken?: string })?.csrftoken ?? null;
    return csrfToken;
  } catch {
    return null;
  }
}

async function ensureCsrfToken(): Promise<string | null> {
  if (csrfToken) return csrfToken;
  if (!csrfInFlight) csrfInFlight = fetchCsrfToken();
  const token = await csrfInFlight;
  csrfInFlight = null;
  return token;
}

// ---- Request interceptor ----------------------------------------------------

apiClient.interceptors.request.use(async (request: InternalAxiosRequestConfig) => {
  const headers = AxiosHeaders.from(request.headers);

  // Staff/legacy header auth — sent for any signed-in user (harmless for guests).
  const user = authState.get();
  if (user) {
    headers.set('X-User', user.fullName || user.username);
    headers.set('X-User-Role', user.role);
    headers.set('X-User-ID', String(user.id));
  }

  headers.set('X-Device-Id', await getOrCreateDeviceId());

  // CSRF for unsafe methods (Django enforces it on session-authenticated writes).
  const method = (request.method ?? 'get').toLowerCase();
  if (UNSAFE_METHODS.has(method)) {
    const token = await ensureCsrfToken();
    if (token) headers.set('X-CSRFToken', token);
  }

  request.headers = headers;
  return request;
});

// ---- Response interceptor ---------------------------------------------------

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as
      | (InternalAxiosRequestConfig & { _csrfRetry?: boolean })
      | undefined;

    // A 403 on a write may mean a stale/missing CSRF token — refresh once & retry.
    const method = (original?.method ?? 'get').toLowerCase();
    if (status === 403 && original && !original._csrfRetry && UNSAFE_METHODS.has(method)) {
      original._csrfRetry = true;
      csrfToken = null;
      const token = await ensureCsrfToken();
      if (token) {
        const headers = AxiosHeaders.from(original.headers);
        headers.set('X-CSRFToken', token);
        original.headers = headers;
        return apiClient(original);
      }
    }

    // 401 on a non-auth route → the staff session is gone; force re-login.
    const isAuthRoute =
      typeof original?.url === 'string' && original.url.includes('/auth/');
    if (status === 401 && !isAuthRoute && authState.get()) {
      onSessionExpired?.('expired');
    }

    return Promise.reject(error);
  },
);

/** Reset the cached CSRF token (e.g. after logout). */
export function resetCsrfToken() {
  csrfToken = null;
}

/** Normalise an Axios error into a user-facing message. */
export function describeApiError(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: string; detail?: string; message?: string }
      | undefined;
    return (
      data?.error ||
      data?.detail ||
      data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'The request timed out. Check your connection.'
        : !error.response
          ? 'Unable to reach the server. Check your connection.'
          : fallback)
    );
  }
  return fallback;
}
