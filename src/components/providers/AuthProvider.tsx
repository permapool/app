"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
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

type CommittedAuthSnapshot = {
  version: number;
  ready: boolean;
  authenticated: boolean;
  identity: string | null;
};

type AuthPresentationStatus =
  | "not-ready"
  | "logged-out"
  | "syncing"
  | "settled"
  | "error";

type AuthPresentation = CommittedAuthSnapshot & {
  status: AuthPresentationStatus;
  user: AppUser | null;
  userGeneration: number | null;
};

const initialPresentation: AuthPresentation = {
  version: 0,
  ready: false,
  authenticated: false,
  identity: null,
  status: "not-ready",
  user: null,
  userGeneration: null,
};

function presentationFor(
  snapshot: CommittedAuthSnapshot,
  status: AuthPresentationStatus,
  user: AppUser | null = null,
): AuthPresentation {
  return {
    ...snapshot,
    status,
    user,
    userGeneration: status === "settled" ? snapshot.version : null,
  };
}

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
  const [presentation, setPresentation] = useState(initialPresentation);
  const mountedRef = useRef(false);
  const authSnapshotVersionRef = useRef(0);
  const committedAuthSnapshotRef = useRef<CommittedAuthSnapshot | null>(null);
  const operationRef = useRef(0);
  const activeRequestRef = useRef<AbortController | null>(null);
  const authIdentity = privyUser?.id ?? null;

  const synchronizeSnapshot = useCallback(async (snapshot: CommittedAuthSnapshot) => {
    const operationId = operationRef.current + 1;
    operationRef.current = operationId;
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;

    const ownsOperation = () => {
      const committedSnapshot = committedAuthSnapshotRef.current;

      return (
        mountedRef.current &&
        operationRef.current === operationId &&
        committedSnapshot === snapshot &&
        committedSnapshot.version === snapshot.version &&
        committedSnapshot.ready === snapshot.ready &&
        committedSnapshot.authenticated === snapshot.authenticated &&
        committedSnapshot.identity === snapshot.identity
      );
    };

    if (!snapshot.ready) {
      if (ownsOperation()) {
        setPresentation(presentationFor(snapshot, "not-ready"));
      }
      return;
    }

    if (!snapshot.authenticated) {
      if (ownsOperation()) {
        setPresentation(presentationFor(snapshot, "logged-out"));
      }
      return;
    }

    if (ownsOperation()) {
      setPresentation(presentationFor(snapshot, "syncing"));
    }

    const controller = new AbortController();
    activeRequestRef.current = controller;

    try {
      const accessToken = await getAccessToken();

      if (!ownsOperation() || controller.signal.aborted) return;

      if (!accessToken) {
        if (ownsOperation()) {
          setPresentation(presentationFor(snapshot, "settled"));
        }
        return;
      }

      const currentUser = await fetchCurrentUser(accessToken, controller.signal);
      if (ownsOperation() && !controller.signal.aborted) {
        setPresentation(presentationFor(snapshot, "settled", currentUser));
      }
    } catch {
      if (!ownsOperation() || controller.signal.aborted) return;
      setPresentation(presentationFor(snapshot, "error"));
      throw new Error("Failed to load current user");
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
      }
    }
  }, [getAccessToken]);

  const refreshUser = useCallback(async () => {
    const snapshot = committedAuthSnapshotRef.current;
    if (!snapshot) return;

    await synchronizeSnapshot(snapshot);
  }, [synchronizeSnapshot]);

  useLayoutEffect(() => {
    const snapshot: CommittedAuthSnapshot = {
      version: authSnapshotVersionRef.current + 1,
      ready,
      authenticated,
      identity: authIdentity,
    };
    authSnapshotVersionRef.current = snapshot.version;
    mountedRef.current = true;
    committedAuthSnapshotRef.current = snapshot;
    void synchronizeSnapshot(snapshot).catch(() => undefined);

    return () => {
      if (committedAuthSnapshotRef.current !== snapshot) return;

      mountedRef.current = false;
      committedAuthSnapshotRef.current = null;
      operationRef.current += 1;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
    };
  }, [authenticated, authIdentity, ready, synchronizeSnapshot]);

  const value = useMemo(
    () => {
      const tupleMatches =
        presentation.ready === ready &&
        presentation.authenticated === authenticated &&
        presentation.identity === authIdentity;

      if (!ready) return { user: null, loading: true, refreshUser };
      if (!authenticated) return { user: null, loading: false, refreshUser };
      if (!tupleMatches) return { user: null, loading: true, refreshUser };

      const settledForCurrentGeneration =
        presentation.status === "settled" &&
        presentation.userGeneration === presentation.version;

      return {
        user: settledForCurrentGeneration ? presentation.user : null,
        loading:
          presentation.status === "syncing" || presentation.status === "not-ready",
        refreshUser,
      };
    },
    [authenticated, authIdentity, presentation, ready, refreshUser],
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
