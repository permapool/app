"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type ClickerProps = {
  switchChannelUp: () => void;
  switchChannelDown: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  className?: string;
};

type RockerPos = "center" | "up" | "down";

export default function Clicker({
  switchChannelUp,
  switchChannelDown,
  isMuted,
  toggleMute,
  className,
}: ClickerProps) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState<number>(-1); // -1 = handle
  const [rockerPos, setRockerPos] = useState<RockerPos>("center");
  const [rockerLocked, setRockerLocked] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLButtonElement | null>(null);
  const actionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const toolbarId = useId();

  // Click-away
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (wrapRef.current.contains(e.target as Node)) return;
      setOpen(false);
      setFocusIndex(-1);
      handleRef.current?.focus();
    }
    if (open) {
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }
  }, [open]);

  // Focus on open/close
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setFocusIndex(0);
        actionRefs.current[0]?.focus();
      }, 0);
    } else {
      handleRef.current?.focus();
      setFocusIndex(-1);
    }
  }, [open]);

  // Keyboard nav within panel
  function onActionsKeyDown(e: React.KeyboardEvent) {
    const total = 3; // [Mute, Up, Down]
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (focusIndex + 1 + total) % total;
      setFocusIndex(next);
      actionRefs.current[next]?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (focusIndex - 1 + total) % total;
      setFocusIndex(prev);
      actionRefs.current[prev]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  // Rocker momentary press
  function pressRocker(dir: "up" | "down") {
    if (rockerLocked) return;
    setRockerLocked(true);
    setRockerPos(dir);
    if (dir === "up") switchChannelUp();
    else switchChannelDown();
    window.setTimeout(() => {
      setRockerPos("center");
      setRockerLocked(false);
    }, 160);
  }

  // Drawer motion
  const drawerVariants = {
    closed: { x: "100%", opacity: 0.95 },
    open: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 320, damping: 32 },
    },
  };

  const rockerVariants = {
    center: { y: 0 },
    up: { y: prefersReducedMotion ? 0 : -6 },
    down: { y: prefersReducedMotion ? 0 : 6 },
  };

  // ——— Look & feel (square, minimal) ———
  const panelBase =
    // sizes tuned to your mock; tweak as needed
    "bg-white text-black border border-black w-[200px] p-3 shadow-[0_2px_8px_rgba(0,0,0,.25)]";

  const handleTab =
    "w-[20px] h-[120px] p-1 rounded-tl-lg rounded-bl-lg bg-blue text-black border border-black " +
    "hover:none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black";

  const muteBtn =
    "inline-flex items-center justify-center w-[70px] h-[70px] bg-[var(--amber)] border border-black border-[3px] rounded-full";

  const hdBtn =
    "inline-flex items-center justify-center w-[50px] h-[50px] bg-red border border-black border-[3px] rounded-full";

  const rockerShell =
    "relative w-[70px] h-[140px] bg-neutral-300 border border-black";

  const rockerCell =
    "absolute bg-lghtgrey inset-x-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50";

  return (
    <AnimatePresence initial={false}>
      <motion.div
        ref={wrapRef}
        key="clicker"
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center ${
          className ?? ""
        }`}
        initial="closed"
        animate="open"
        exit="closed"
        variants={drawerVariants}
        aria-live="polite"
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 32,
        }}
      >
        {/* Handle (toggle) */}
        <div>
          <button
            ref={handleRef}
            type="button"
            className={handleTab}
            aria-expanded={open}
            aria-controls={toolbarId}
            onClick={() => setOpen((v) => !v)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !open) {
                e.preventDefault();
                setOpen(true);
              } else if (e.key === "Escape" && open) {
                e.preventDefault();
                setOpen(false);
              }
            }}
          >
            <img
              src="/icons/clicker.svg"
              alt=""
              aria-hidden
              className="w-6 h-20"
            />
          </button>
        </div>

        {/* Drawer */}
        {open && (
          <div
            key="drawer"
            role="toolbar"
            id={toolbarId}
            aria-label="Channel controls"
            className="inline-block align-middle"
            onKeyDown={onActionsKeyDown}
          >
            <div className={panelBase}>
              <div className="grid grid-cols-[1fr_1fr] gap-3 w-full h-full">
                <div className="flex flex-col items-start gap-3">
                  {/* Mute */}
                  <button
                    ref={(el) => {
                      actionRefs.current[0] = el;
                    }}
                    type="button"
                    className={`${muteBtn} relative flex items-center justify-center`}
                    aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                    aria-pressed={isMuted}
                    onClick={toggleMute}
                  >
                    <img
                      src={
                        isMuted ? "/icons/sound-off.svg" : "/icons/sound-on.svg"
                      }
                      alt=""
                      aria-hidden
                      className="w-6 h-6"
                    />
                  </button>

                  {/* PIP */}
                  <button
                    type="button"
                    className={`${hdBtn} relative flex items-center justify-center`}
                    aria-label="Enter Picture-in-Picture mode"
                    onClick={() => {
                      const video = document.getElementById(
                        "jumbotron"
                      ) as HTMLVideoElement | null;
                      if (
                        video &&
                        typeof video.requestPictureInPicture === "function"
                      ) {
                        video.requestPictureInPicture().catch((err) => {
                          console.error(
                            "Failed to enter Picture-in-Picture mode:",
                            err
                          );
                        });
                      }
                    }}
                  >
                    <img
                      src="/icons/picture-in-picture.svg"
                      alt=""
                      aria-hidden
                      className="w-6 h-6 min-w-[1.5rem] min-h-[1.5rem]"
                    />
                  </button>
                </div>

                {/* Rocker */}
                <div className="relative">
                  <div
                    className={rockerShell}
                    role="group"
                    aria-label="Channel rocker"
                  >
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-black/60 pointer-events-none" />
                    <motion.div
                      className="absolute inset-0"
                      variants={rockerVariants}
                      animate={rockerPos}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 32,
                      }}
                    />
                    <button
                      ref={(el) => {
                        actionRefs.current[1] = el;
                      }}
                      type="button"
                      className={`${rockerCell} top-0 h-1/2 border-b border-black p-2`}
                      aria-label="Channel up"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        pressRocker("up");
                      }}
                      onPointerUp={() => setRockerPos("center")}
                      onPointerLeave={() => setRockerPos("center")}
                      onPointerCancel={() => setRockerPos("center")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          pressRocker("up");
                        }
                      }}
                    >
                      <img
                        src="/icons/ch-up.svg"
                        alt=""
                        aria-hidden
                        className="w-20 h-20"
                      />
                    </button>
                    <button
                      ref={(el) => {
                        actionRefs.current[2] = el;
                      }}
                      type="button"
                      className={`${rockerCell} bottom-0 h-1/2 p-2`}
                      aria-label="Channel down"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        pressRocker("down");
                      }}
                      onPointerUp={() => setRockerPos("center")}
                      onPointerLeave={() => setRockerPos("center")}
                      onPointerCancel={() => setRockerPos("center")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          pressRocker("down");
                        }
                      }}
                    >
                      <img
                        src="/icons/ch-down.svg"
                        alt=""
                        aria-hidden
                        className="w-20 h-20"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
