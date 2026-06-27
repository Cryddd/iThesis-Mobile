import type { AuthUser } from '@/types';

/**
 * In-memory mirror of the currently authenticated user.
 *
 * The web backend authenticates staff via a Django session cookie AND a legacy
 * header fallback (`X-User`, `X-User-Role`, `X-User-ID`). React Native persists
 * the session cookie automatically, and we additionally send the X-User headers
 * — exactly like the web client (`utils/api.ts`) — so librarian/admin endpoints
 * authorize whether or not the cookie survives.
 *
 * AuthContext is the source of truth; it pushes changes here so the Axios
 * request interceptor can read the current user without a React dependency.
 */
let currentUser: AuthUser | null = null;

export const authState = {
  get(): AuthUser | null {
    return currentUser;
  },
  set(user: AuthUser | null): void {
    currentUser = user;
  },
};
