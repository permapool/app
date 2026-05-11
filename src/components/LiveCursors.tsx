"use client";

import {
  useBroadcastEvent,
  useEventListener,
  useOthersMapped,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const CURSOR_COLORS = ["var(--green)", "#ffcc00", "#ff4d4d", "#38bdf8", "#f472b6"];
const REACTIONS = ["↑", "🔥", "❤️", "😂", "✨"];
const LOCAL_CURSOR_PROFILE_KEY = "higher_live_cursor_profile";
const MAX_LABEL_LENGTH = 18;
const REACTION_LIFETIME_MS = 3200;

type CursorPoint = { x: number; y: number };
type CursorProfile = {
  color: string;
  label: string;
};
type RemoteCursor = {
  cursor: CursorPoint | null;
  profile: CursorProfile;
};
type FlyingReaction = {
  id: string;
  x: number;
  y: number;
  value: string;
  color: string;
  timestamp: number;
};

const DEFAULT_CURSOR_PROFILE: CursorProfile = {
  color: CURSOR_COLORS[0],
  label: "optimist",
};

function sanitizeProfile(profile: Partial<CursorProfile> | null): CursorProfile {
  const color =
    profile?.color && CURSOR_COLORS.includes(profile.color)
      ? profile.color
      : DEFAULT_CURSOR_PROFILE.color;
  const label = (profile?.label ?? DEFAULT_CURSOR_PROFILE.label)
    .trim()
    .slice(0, MAX_LABEL_LENGTH);

  return {
    color,
    label: label || DEFAULT_CURSOR_PROFILE.label,
  };
}

function loadLocalProfile() {
  try {
    const raw = window.localStorage.getItem(LOCAL_CURSOR_PROFILE_KEY);

    if (!raw) {
      return DEFAULT_CURSOR_PROFILE;
    }

    return sanitizeProfile(JSON.parse(raw) as Partial<CursorProfile>);
  } catch {
    return DEFAULT_CURSOR_PROFILE;
  }
}

function remoteCursorEquals(
  previous: RemoteCursor,
  next: RemoteCursor,
) {
  return (
    previous.cursor?.x === next.cursor?.x &&
    previous.cursor?.y === next.cursor?.y &&
    previous.profile.color === next.profile.color &&
    previous.profile.label === next.profile.label
  );
}

function CursorDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="block h-5 w-5 rounded-full border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,0.35)]"
      style={{ backgroundColor: color }}
    />
  );
}

function RemoteCursorView({
  color,
  label,
  x,
  y,
}: {
  color: string;
  label: string;
  x: number;
  y: number;
}) {
  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[10030] transition-transform duration-75 ease-linear"
      style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
    >
      <CursorDot color={color} />
      <div
        className="absolute left-4 top-4 max-w-[160px] truncate border border-black px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-black shadow-[2px_2px_0_rgba(0,0,0,0.35)]"
        style={{ backgroundColor: color }}
      >
        {label}
      </div>
    </div>
  );
}

function FlyingReactionView({ reaction }: { reaction: FlyingReaction }) {
  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[10035] select-none text-2xl font-bold"
      style={{
        "--reaction-x": `${reaction.x}px`,
        "--reaction-y": `${reaction.y}px`,
        color: reaction.color,
        textShadow: "0 1px 0 #000, 1px 0 0 #000, 0 -1px 0 #000, -1px 0 0 #000",
        animation: "higher-cursor-reaction 3.2s ease-out forwards",
      } as CSSProperties}
    >
      {reaction.value}
    </div>
  );
}

export default function LiveCursors() {
  const updateMyPresence = useUpdateMyPresence();
  const broadcast = useBroadcastEvent();
  const cursorRef = useRef<CursorPoint | null>(null);
  const frameRef = useRef<number | null>(null);
  const [profile, setProfile] = useState<CursorProfile>(DEFAULT_CURSOR_PROFILE);
  const [reactions, setReactions] = useState<FlyingReaction[]>([]);
  const others = useOthersMapped(
    (other) => ({
      cursor: other.presence.cursor,
      profile: sanitizeProfile(other.presence.cursorProfile),
    }),
    remoteCursorEquals,
  );

  useEffect(() => {
    const loadedProfile = loadLocalProfile();

    setProfile(loadedProfile);
    updateMyPresence({ cursorProfile: loadedProfile });
  }, [updateMyPresence]);

  useEffect(() => {
    window.localStorage.setItem(LOCAL_CURSOR_PROFILE_KEY, JSON.stringify(profile));
    updateMyPresence({ cursorProfile: profile });
  }, [profile, updateMyPresence]);

  useEffect(() => {
    const publishCursor = (point: CursorPoint) => {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        updateMyPresence({ cursor: point });
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      const nextCursor = {
        x: Math.round(event.clientX),
        y: Math.round(event.clientY),
      };

      cursorRef.current = nextCursor;
      publishCursor(nextCursor);
    };

    const clearCursor = () => {
      cursorRef.current = null;
      updateMyPresence({ cursor: null });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", clearCursor);
    document.addEventListener("visibilitychange", clearCursor);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", clearCursor);
      document.removeEventListener("visibilitychange", clearCursor);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      updateMyPresence({ cursor: null });
    };
  }, [updateMyPresence]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const oldestVisibleTimestamp = Date.now() - REACTION_LIFETIME_MS;

      setReactions((current) =>
        current.filter((reaction) => reaction.timestamp > oldestVisibleTimestamp),
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEventListener(({ event }) => {
    if (event.type !== "cursor_reaction") {
      return;
    }

    setReactions((current) =>
      current.concat({
        id: `${event.x}:${event.y}:${event.value}:${Date.now()}:${Math.random()}`,
        x: event.x,
        y: event.y,
        value: event.value,
        color: event.color,
        timestamp: Date.now(),
      }),
    );
  });

  const sendReaction = useCallback(
    (value: string) => {
      const cursor = cursorRef.current;

      if (!cursor) {
        return;
      }

      const reaction = {
        id: `${cursor.x}:${cursor.y}:${value}:${Date.now()}`,
        x: cursor.x,
        y: cursor.y,
        value,
        color: profile.color,
        timestamp: Date.now(),
      };

      setReactions((current) => current.concat(reaction));
      broadcast({
        type: "cursor_reaction",
        x: cursor.x,
        y: cursor.y,
        value,
        color: profile.color,
      });
    },
    [broadcast, profile.color],
  );

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[10030]">
        {others.map(([connectionId, remote]) => {
          if (!remote.cursor) {
            return null;
          }

          return (
            <RemoteCursorView
              key={connectionId}
              color={remote.profile.color}
              label={remote.profile.label}
              x={remote.cursor.x}
              y={remote.cursor.y}
            />
          );
        })}
        {reactions.map((reaction) => (
          <FlyingReactionView key={reaction.id} reaction={reaction} />
        ))}
      </div>

      <div className="fixed right-3 top-20 z-[10040] w-[min(280px,calc(100vw-24px))] border border-black bg-[var(--background)] p-3 shadow-[4px_4px_0_rgba(0,0,0,0.35)]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <CursorDot color={profile.color} />
            <input
              aria-label="Cursor label"
              className="min-w-0 flex-1 border border-black bg-white/70 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-black outline-none focus:bg-white"
              maxLength={MAX_LABEL_LENGTH}
              value={profile.label}
              onChange={(event) => {
                setProfile((current) =>
                  sanitizeProfile({
                    ...current,
                    label: event.target.value,
                  }),
                );
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {CURSOR_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Set cursor color ${color}`}
                className={`h-6 w-6 border ${
                  profile.color === color ? "border-black" : "border-black/25"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  setProfile((current) => sanitizeProfile({ ...current, color }));
                }}
              />
            ))}
          </div>

          <div className="flex gap-1">
            {REACTIONS.map((reaction) => (
              <button
                key={reaction}
                type="button"
                className="flex h-7 w-7 items-center justify-center border border-black bg-white/80 text-sm text-black hover:bg-[var(--amber)]"
                onClick={() => sendReaction(reaction)}
              >
                {reaction}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
