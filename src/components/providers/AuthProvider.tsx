"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePrivy } from "@privy-io/react-auth";
import type { AppUser } from "~/types/auth";

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchCurrentUser(accessToken: string, signal: AbortSignal) {
  const response = await fetch("/api/auth/session", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("Failed to load current user");
  }

  return (await response.json()) as AppUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, getAccessToken, user: privyUser } = usePrivy();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const operationRef = useRef(0);
  const activeRequestRef = useRef<AbortController | null>(null);
  const committedIdentityRef = useRef<string | null>(null);
  const authIdentity = privyUser?.id ?? null;

  const refreshUser = useCallback(async () => {
    const operationId = operationRef.current + 1;
    operationRef.current = operationId;
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;

    const ownsOperation = () =>
      mountedRef.current && operationRef.current === operationId;

    if (!ready) {
      return;
    }

    if (!authenticated) {
      if (ownsOperation()) {
        committedIdentityRef.current = null;
        setUser(null);
        setLoading(false);
      }
      return;
    }

    if (ownsOperation()) setLoading(true);

    const controller = new AbortController();
    activeRequestRef.current = controller;

    try {
      const accessToken = await getAccessToken();

      if (!ownsOperation() || controller.signal.aborted) return;

      if (!accessToken) {
        committedIdentityRef.current = null;
        setUser(null);
        return;
      }

      const currentUser = await fetchCurrentUser(accessToken, controller.signal);
      if (ownsOperation() && !controller.signal.aborted) {
        committedIdentityRef.current = authIdentity;
        setUser(currentUser);
      }
    } catch {
      if (!ownsOperation() || controller.signal.aborted) return;
      throw new Error("Failed to load current user");
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
      }
      if (ownsOperation()) setLoading(false);
    }
  }, [authenticated, authIdentity, getAccessToken, ready]);

  useEffect(() => {
    mountedRef.current = true;
    void refreshUser().catch(() => undefined);

    return () => {
      mountedRef.current = false;
      operationRef.current += 1;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
    };
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      // Logout and authenticated identity changes hide stale application state
      // immediately; effect cleanup also invalidates the older operation.
      user:
        authenticated && committedIdentityRef.current === authIdentity
          ? user
          : null,
      loading: authenticated ? loading : !ready,
      refreshUser,
    }),
    [authenticated, authIdentity, loading, ready, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
