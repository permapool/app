"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type MuteContextValue = {
  isMuted: boolean;
  toggleMute: () => void;
};

const MuteContext = createContext<MuteContextValue | undefined>(undefined);

export function MuteProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(true);
  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);

  const value = useMemo(
    () => ({ isMuted, toggleMute }),
    [isMuted, toggleMute],
  );

  return <MuteContext.Provider value={value}>{children}</MuteContext.Provider>;
}

export function useMute() {
  const ctx = useContext(MuteContext);
  if (!ctx) {
    throw new Error("useMute must be used within MuteProvider");
  }
  return ctx;
}
