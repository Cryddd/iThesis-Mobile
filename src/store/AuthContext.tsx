import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { authApi } from '@/api/services';
import { resetCsrfToken, setSessionExpiredListener } from '@/api/client';
import { authState } from '@/api/authState';
import type { AuthUser } from '@/types';

const USER_KEY = 'ithesis_user';

interface AuthState {
  user: AuthUser | null;
  initializing: boolean;
  /** Set when a session ends unexpectedly so the UI can explain why. */
  sessionNotice: 'expired' | null;
  signIn: (usernameOrEmail: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  clearSessionNotice: () => void;
}

/** Thrown by signIn when staff are already active on another device (HTTP 409). */
export class DeviceConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeviceConflictError';
  }
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [sessionNotice, setSessionNotice] = useState<'expired' | null>(null);

  const applyUser = useCallback((next: AuthUser | null) => {
    authState.set(next);
    setUser(next);
  }, []);

  const finishSession = useCallback(
    async (notice: 'expired' | null) => {
      await SecureStore.deleteItemAsync(USER_KEY).catch(() => undefined);
      resetCsrfToken();
      applyUser(null);
      setSessionNotice(notice);
    },
    [applyUser],
  );

  // Wire the API client's forced-logout callback into context state.
  useEffect(() => {
    setSessionExpiredListener(() => {
      void finishSession('expired');
    });
    return () => setSessionExpiredListener(null);
  }, [finishSession]);

  // Restore a persisted profile on cold start. The Django session cookie is
  // persisted natively; if it has expired the first protected call triggers the
  // 401 → expired flow.
  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(USER_KEY);
        if (raw) applyUser(JSON.parse(raw) as AuthUser);
      } catch {
        // ignore — treat as logged out
      } finally {
        setInitializing(false);
      }
    })();
  }, [applyUser]);

  const signIn = useCallback(
    async (usernameOrEmail: string, password: string) => {
      try {
        const data = await authApi.login(usernameOrEmail, password);
        const authUser: AuthUser = {
          id: data.id,
          username: data.username,
          fullName: data.fullName,
          email: data.email,
          role: data.role,
        };
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(authUser));
        setSessionNotice(null);
        applyUser(authUser);
        return authUser;
      } catch (err) {
        // Single-device enforcement: 409 + code 'account_active_elsewhere'.
        if (axios.isAxiosError(err) && err.response?.status === 409) {
          const data = err.response.data as { error?: string; code?: string };
          throw new DeviceConflictError(
            data?.error ||
              'This account is currently active on another device. Sign out there first.',
          );
        }
        throw err;
      }
    },
    [applyUser],
  );

  const signOut = useCallback(async () => {
    await authApi.logout();
    await finishSession(null);
  }, [finishSession]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      initializing,
      sessionNotice,
      signIn,
      signOut,
      clearSessionNotice: () => setSessionNotice(null),
    }),
    [user, initializing, sessionNotice, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
