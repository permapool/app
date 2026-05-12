"use client";

import {
  useBroadcastEvent,
  useEventListener,
  useOthersMapped,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense";
import { motion, AnimatePresence } from "framer-motion";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import CursorReactionPanel from "~/components/live-cursors/CursorReactionPanel";

const REACTION_LIFETIME_MS = 3200;
const CURSOR_COLOR = "var(--green)";

type CursorPoint = { x: number; y: number };
type PeerCursor = {
  cursor: CursorPoint | null;
};
type FlyingReaction = {
  id: string;
  x: number;
  y: number;
  value: string;
  timestamp: number;
};

function remoteCursorEquals(
  previous: PeerCursor,
  next: PeerCursor,
) {
  return (
    previous.cursor?.x === next.cursor?.x &&
    previous.cursor?.y === next.cursor?.y
  );
}

function CursorDot() {
  return (
    <span
      aria-hidden="true"
      className="block h-5 w-5 rounded-full border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,0.35)]"
      style={{ backgroundColor: CURSOR_COLOR }}
    />
  );
}

function PeerCursorView({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[10030] transition-transform duration-75 ease-linear"
      style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
    >
      <CursorDot />
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
        color: CURSOR_COLOR,
        textShadow: "0 1px 0 #000, 1px 0 0 #000, 0 -1px 0 #000, -1px 0 0 #000",
        animation: "higher-cursor-reaction 3.2s ease-out forwards",
      } as CSSProperties}
    >
      {reaction.value}
    </div>
  );
}

type LiveCursorsProps = {
  showControls: boolean;
};

export default function LiveCursors({ showControls }: LiveCursorsProps) {
  const updateMyPresence = useUpdateMyPresence();
  const broadcast = useBroadcastEvent();
  const cursorRef = useRef<CursorPoint | null>(null);
  const frameRef = useRef<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [reactions, setReactions] = useState<FlyingReaction[]>([]);
  const controlsVisible = showControls || panelOpen;
  const others = useOthersMapped(
    (other) => ({
      cursor: other.presence.cursor,
    }),
    remoteCursorEquals,
  );

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (isTyping || event.key.toLowerCase() !== "e") {
        return;
      }

      event.preventDefault();
      setPanelOpen((current) => !current);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
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
        timestamp: Date.now(),
      };

      setReactions((current) => current.concat(reaction));
      broadcast({
        type: "cursor_reaction",
        x: cursor.x,
        y: cursor.y,
        value,
      });
    },
    [broadcast],
  );

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[10030]">
        {others.map(([connectionId, remote]) => {
          if (!remote.cursor) {
            return null;
          }

          return (
            <PeerCursorView
              key={connectionId}
              x={remote.cursor.x}
              y={remote.cursor.y}
            />
          );
        })}
        {reactions.map((reaction) => (
          <FlyingReactionView key={reaction.id} reaction={reaction} />
        ))}
      </div>

      <AnimatePresence>
        {controlsVisible ? (
          <motion.div
            key="cursor-reaction-controls"
            className="absolute left-14 top-1 z-40"
            initial={{ opacity: 0, scale: 0.9, x: -6 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.92, x: -6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <button
              type="button"
              aria-label={panelOpen ? "Close cursor reactions" : "Open cursor reactions"}
              aria-pressed={panelOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black bg-[var(--green)] p-0 text-black shadow-solid transition-transform hover:scale-105"
              onClick={() => setPanelOpen((current) => !current)}
            >
              <span className="h-3 w-3 rounded-full border border-black bg-[var(--background)]" />
            </button>

            <AnimatePresence>
              {panelOpen ? (
                <motion.div
                  key="cursor-reaction-panel"
                  className="absolute bottom-12 left-0 w-[190px] border border-black bg-[var(--background)] p-3 shadow-solid"
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                >
                  <CursorReactionPanel onReaction={sendReaction} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
