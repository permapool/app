"use client";
import { useEffect, useState, useRef, useCallback } from "react";

import sdk, { Context } from "@farcaster/frame-sdk";
import { motion, AnimatePresence } from "framer-motion";

import Squad from "./Squad";
import ProposalList from "./ProposalList";
import Permapool from "./Permapool";
import Manifesto from "./Manifesto";

import Television from "./Television";
import NewClicker from "./ui/NewClicker";

import { useMinimize } from "./providers/MinimizeMenus";
import { useToggle } from "./providers/ToggleContext";
import Live from "./Live";

import Toaster, { ToasterRef } from "./ui/Toast";

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

export default function Home() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [frameAdded, setFrameAdded] = useState(false);
  const [showChat, setShowChat] = useState(false);

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
  const fid = context?.user?.fid;
  console.log(fid);

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      sdk.actions.ready({});
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

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

  const ENABLE_TOAST = false; // flip to true when ready

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
        {
          showChat ? (
            <iframe
              src="https://basetrenches.com/room/0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe"
              style={{
                border: '1px solid #666',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'fixed',
                bottom: '3.5em',
                left: '1em',
                width: '280px',
                maxWidth: '90%',
                height: '350px',
                maxHeight: '80%'
              }}
            />
          ) : null
        }
        <button
          style={{
            position: 'fixed',
            bottom: '1em',
            left: '1em'
          }}
          onClick={() => setShowChat(!showChat)}
          className="text-white w-14 aspect-square rounded-full flex items-center justify-center text-lg font-semibold bg-green-600 hover:bg-[var(--amber)] transition-all duration-100 shadow-md select-none touch-manipulation"
        >
          {showChat ? '✕' : '🗯️'}
        </button>
        <NewClicker
          switchChannelUp={switchChannel}
          switchChannelDown={switchChannelDown}
          isMuted={isMuted}
          toggleMute={toggleMute}
        />
      </div>
    </>
  );
}
