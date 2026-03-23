"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  useOthers,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense";

import sdk, { Context } from "@farcaster/frame-sdk";
import { motion, AnimatePresence } from "framer-motion";

import NewClicker from "./ui/NewClicker";

import { useMinimize } from "./providers/MinimizeMenus";
import { useToggle } from "./providers/ToggleContext";

import Toaster, { ToasterRef } from "./ui/Toast";

const Permapool = dynamic(() => import("./Permapool"), {
  loading: () => <div className="p-4 text-xs uppercase">Loading permapool...</div>,
});
const Squad = dynamic(() => import("./Squad"), {
  loading: () => <div className="p-4 text-xs uppercase">Loading squad...</div>,
});
const ProposalList = dynamic(() => import("./ProposalList"), {
  loading: () => <div className="p-4 text-xs uppercase">Loading proposals...</div>,
});
const Manifesto = dynamic(() => import("./Manifesto"), {
  loading: () => <div className="p-4 text-xs uppercase">Loading manifesto...</div>,
});
const Television = dynamic(() => import("./Television"));
const Live = dynamic(() => import("./Live"));

type VodChannel = { type: "vod"; src: string };
type LiveChannel = { type: "live" };
type Channel = VodChannel | LiveChannel;

const channels: Channel[] = [
  { type: "live" },
  { type: "vod", src: "/how-it-works.mp4" },
  { type: "vod", src: "/higher-horse.mp4" },
  { type: "vod", src: "/bench.mp4" },
  { type: "vod", src: "/runner-01.mp4" },
  { type: "vod", src: "/flag.mp4" },
  { type: "vod", src: "/pegasus-billboard.mp4" },
];
const ENABLE_TOAST = false;

export default function Home() {
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();
  const remoteCursors = others.filter((other) => other.presence.cursor !== null);
  const [hasPainted, setHasPainted] = useState(false);

  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [frameAdded, setFrameAdded] = useState(false);

  const {
    showPermapool,
    showSquad,
    showProposals,
    showManifesto,
    toggleManifesto,
  } = useToggle();

  const [channelIdx, setChannelIdx] = useState(0);
  const switchChannel = () => {
    setChannelIdx((idx) => (idx + 1) % channels.length);
  };

  const switchChannelDown = () => {
    setChannelIdx((idx) => (idx - 1 + channels.length) % channels.length);
  };

  const added = frameAdded || context?.client?.added || false;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHasPainted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      sdk.actions.ready({});
    };

    if (hasPainted && sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [hasPainted, isSDKLoaded]);

  const addFrame = useCallback(async () => {
    try {
      setFrameAdded(true);
      await sdk.actions.addFrame();
    } catch (e) {
      console.log(e);
    }
  }, []);

  const [isMuted, setIsMuted] = useState(true);
  const toggleMute = () => setIsMuted((m) => !m);

  useMinimize();

  const onFc = !!context;
  useEffect(() => {
    if (onFc && !added) {
      addFrame();
    }
  }, [onFc, added, addFrame]);

  const playbackId = process.env.NEXT_PUBLIC_LIVEPEER_PLAYBACK_ID as string;
  const current = channels[channelIdx];
  const toasterRef = useRef<ToasterRef>(null);

  useEffect(() => {
    if (!ENABLE_TOAST) return;
    const timer = setTimeout(() => {
      toasterRef.current?.show({
        title: "Clicker Available",
        message:
          "Use the clicker to change channels and unmute the video feed.",
        variant: "default",
        position: "top-right",
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasPainted) {
      return;
    }

    let frame: number | null = null;

    const clearCursor = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }

      updateMyPresence({ cursor: null });
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(() => {
        updateMyPresence({
          cursor: { x: event.clientX, y: event.clientY },
        });
        frame = null;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearCursor();
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("blur", clearCursor);
    document.addEventListener("mouseleave", clearCursor);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", clearCursor);
      document.removeEventListener("mouseleave", clearCursor);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      updateMyPresence({ cursor: null });
    };
  }, [hasPainted, updateMyPresence]);

  return (
    <>
      <Toaster ref={toasterRef} />

      <div className="max-w-[1100px] mx-auto px-4 pb-20 pt-[7%]">
        <div className="mx-auto py-4">
          <motion.div layout>
            <AnimatePresence>
              {showPermapool && (
                <motion.div
                  key="permapool"
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ overflow: "hidden" }}
                >
                  <section>
                    <Permapool />
                  </section>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showSquad && (
                <motion.div
                  key="squad"
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ overflow: "hidden" }}
                >
                  <section>
                    <Squad />
                  </section>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showProposals && (
                <motion.div
                  key="proposals"
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ overflow: "hidden" }}
                >
                  <section>
                    <ProposalList />
                  </section>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showManifesto && (
                <motion.div
                  key="manifesto"
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ overflow: "hidden" }}
                >
                  <section>
                    <Manifesto
                      onClose={() => {
                        toggleManifesto();
                        setChannelIdx(1);
                      }}
                    />
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {hasPainted ? (
          <Television
            isMuted={isMuted}
            src={current.type === "vod" ? current.src : undefined}
          >
            {current.type === "live" && playbackId ? (
              <div className="flex flex-col justify-center items-center h-screen md:h-auto md:block">
                <Live playbackId={playbackId} isMuted={isMuted} />
              </div>
            ) : null}
          </Television>
        ) : (
          <div className="fixed top-0 left-0 w-screen h-screen -z-10 overflow-hidden bg-[#111]" />
        )}
        <NewClicker
          switchChannelUp={switchChannel}
          switchChannelDown={switchChannelDown}
          isMuted={isMuted}
          toggleMute={toggleMute}
        />
      </div>
      <div className="pointer-events-none fixed inset-0 z-[10010]">
        {hasPainted &&
          remoteCursors.map((other) => {
          const cursor = other.presence.cursor;

          if (!cursor) {
            return null;
          }

          return (
            <div
              key={other.connectionId}
              className="absolute"
              style={{
                transform: `translate(${cursor.x}px, ${cursor.y}px)`,
              }}
            >
              <div className="relative">
                <div
                  className="h-0 w-0"
                  style={{
                    borderTop: "10px solid green",
                    borderRight: "10px solid green",
                    borderRadius: "50%",
                  }}
                />
                <div className="absolute left-3 top-3 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-black shadow-solid">
                  anon {other.connectionId}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 right-0 z-[10020] h-16 w-40 bg-black"
      />
    </>
  );
}
