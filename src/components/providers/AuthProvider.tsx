"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

async function fetchCurrentUser(accessToken: string) {
  const response = await fetch("/api/auth/session", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load current user");
  }

  return (await response.json()) as AppUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!ready) {
      return;
    }

    if (!authenticated) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        setUser(null);
        return;
      }

      const currentUser = await fetchCurrentUser(accessToken);
      setUser(currentUser);
    } finally {
      setLoading(false);
    }
  }, [authenticated, getAccessToken, ready]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshUser,
    }),
    [loading, refreshUser, user],
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
