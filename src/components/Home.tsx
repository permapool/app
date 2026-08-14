"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef, useCallback } from "react";

import sdk, { Context } from "@farcaster/frame-sdk";
import { motion, AnimatePresence } from "framer-motion";

import NewClicker from "./ui/NewClicker";

import { useMinimize } from "./providers/MinimizeMenus";
import { useMute } from "./providers/MuteContext";
import { useToggle } from "./providers/ToggleContext";

import Toaster, { ToasterRef } from "./ui/Toast";
import Pipes from "./Pipes";
import { useLiveStreamStatus, type LiveVisualStatus } from "./useLiveStreamStatus";

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
const Chat = dynamic(() => import("./ui/Chat"), {
  ssr: false,
});

type VodChannel = { type: "vod"; src: string };
type LiveChannel = { type: "live" };
type Channel = VodChannel | LiveChannel;
type TelevisionMode = LiveVisualStatus | "tivo";

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

  const { isMuted, toggleMute } = useMute();

  useMinimize();

  const onFc = !!context;
  useEffect(() => {
    if (onFc && !added) {
      addFrame();
    }
  }, [onFc, added, addFrame]);

  const playbackId = process.env.NEXT_PUBLIC_LIVEPEER_PLAYBACK_ID as string;
  const current = channels[channelIdx];
  const liveStatus = useLiveStreamStatus(current.type === "live");
  const [screensaverFailed, setScreensaverFailed] = useState(false);
  const [screensaverKey, setScreensaverKey] = useState(0);
  const toasterRef = useRef<ToasterRef>(null);

  const televisionMode: TelevisionMode = liveStatus.status;
  const hasVideo =
    current.type === "vod" || (televisionMode === "live" && Boolean(playbackId));
  const handleScreensaverError = useCallback(() => setScreensaverFailed(true), []);

  useEffect(() => {
    if (televisionMode !== "offline") setScreensaverFailed(false);
  }, [televisionMode]);

  const renderLiveChannel = () => {
    if (televisionMode === "checking") {
      return <div className="h-full w-full bg-[#111]" aria-label="Checking broadcast status" />;
    }
    if (televisionMode === "live" && playbackId) {
      return (
        <div className="flex h-screen flex-col items-center justify-center md:block md:h-auto">
          <Live playbackId={playbackId} isMuted={isMuted} />
        </div>
      );
    }
    if (televisionMode === "offline" && !screensaverFailed) {
      return (
        <Pipes
          key={screensaverKey}
          onError={handleScreensaverError}
        />
      );
    }

    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        <div className="pointer-events-auto text-center text-sm uppercase">
          <p className="m-0 text-sm">Television signal unavailable</p>
          <button
            type="button"
            className="mt-4 rounded bg-green px-4 py-2 text-xs text-white"
            onClick={() => {
              if (screensaverFailed) {
                setScreensaverFailed(false);
                setScreensaverKey((value) => value + 1);
              } else {
                liveStatus.retry();
              }
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  };

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
            {current.type === "live" ? renderLiveChannel() : null}
          </Television>
        ) : (
          <div className="fixed top-0 left-0 w-screen h-screen -z-10 overflow-hidden bg-[#111]" />
        )}
        <NewClicker
          switchChannelUp={switchChannel}
          switchChannelDown={switchChannelDown}
          isMuted={isMuted}
          toggleMute={toggleMute}
          isPictureInPictureAvailable={hasVideo}
        />
      </div>
      <Chat />
      {/* <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 right-0 z-[10020] h-16 w-40 bg-black"
      /> */}
    </>
  );
}
