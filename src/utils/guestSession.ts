import * as SecureStore from 'expo-secure-store';

/**
 * Guest "library access" session — mirrors the web app's `guest_session`
 * (localStorage) in `iThesis-web/src/pages/Main/LandingPageV2.tsx`.
 *
 * Before a visitor may browse the repository they must fill in the Library
 * Access modal (name, gender, category, optional course + RA-10173 consent).
 * The resulting session is persisted with a 30-minute expiry so the visitor
 * isn't re-prompted on every navigation, and is reported to the backend for
 * usage analytics via `POST /track/guest-session`.
 */

const GUEST_SESSION_KEY = 'ithesis_guest_session';

/** Session lifetime — matches the web (30 minutes). */
const SESSION_TTL_MS = 30 * 60 * 1000;

export type GuestAccessLevel = 'browse' | 'upload';

export interface GuestSession {
  name: string;
  email?: string;
  gender?: string;
  category?: string;
  course?: string;
  srCode?: string;
  code?: string;
  accessLevel: GuestAccessLevel;
  /** Stable id reused across writes within the same session window. */
  sessionId: string;
  /** Epoch ms after which the session is considered expired. */
  expiresAt: number;
}

let cached: GuestSession | null = null;

function newSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/** Returns the stored guest session if present and unexpired, else null. */
export async function readGuestSession(): Promise<GuestSession | null> {
  if (cached && Date.now() <= cached.expiresAt) return cached;
  try {
    const raw = await SecureStore.getItemAsync(GUEST_SESSION_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as GuestSession;
    if (!obj?.expiresAt || Date.now() > obj.expiresAt) {
      await SecureStore.deleteItemAsync(GUEST_SESSION_KEY).catch(() => undefined);
      cached = null;
      return null;
    }
    cached = obj;
    return obj;
  } catch {
    return null;
  }
}

/** True when the visitor currently holds a valid browse (or upload) session. */
export async function hasBrowseAccess(): Promise<boolean> {
  const s = await readGuestSession();
  return !!s && (s.accessLevel === 'browse' || s.accessLevel === 'upload');
}

/**
 * Persists a fresh guest session (refreshing the 30-minute window) and reuses
 * the previous unexpired sessionId when available, exactly like the web.
 */
export async function saveGuestSession(
  input: {
    name: string;
    email?: string;
    gender?: string;
    category?: string;
    course?: string;
    srCode?: string;
    code?: string;
  },
  accessLevel: GuestAccessLevel = 'browse',
): Promise<GuestSession> {
  let sessionId = newSessionId();
  const prev = await readGuestSession();
  if (prev?.sessionId && prev.sessionId.startsWith('guest_')) {
    sessionId = prev.sessionId;
  }

  const session: GuestSession = {
    ...input,
    accessLevel,
    sessionId,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  cached = session;
  try {
    await SecureStore.setItemAsync(GUEST_SESSION_KEY, JSON.stringify(session));
  } catch {
    // SecureStore unavailable — keep the in-memory copy for this run.
  }
  return session;
}

/** Clears the stored guest session (e.g. for testing / re-prompt). */
export async function clearGuestSession(): Promise<void> {
  cached = null;
  await SecureStore.deleteItemAsync(GUEST_SESSION_KEY).catch(() => undefined);
}
