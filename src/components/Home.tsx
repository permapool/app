"use client";
import { useEffect, useState } from "react";

import sdk, { Context } from "@farcaster/frame-sdk";
import { motion, AnimatePresence } from "framer-motion";

import Squad from "./Squad";
import ProposalList from "./ProposalList";
import Permapool from "./Permapool";
import Manifesto from "./Manifesto";

import Television from "./Television";
import Clicker from "./ui/Clicker";

import { useMinimize } from "./providers/MinimizeMenus";

const channels = ["/higher-horse.mp4", "/how-it-works.mp4", "/water-drop-loop.mp4", "/bench.mp4", "/runner.mp4", "higherstatuefinal-nograin.mov"];

export default function Home() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [cacheBust, setCacheBust] = useState(0);
  const [frameAdded, setFrameAdded] = useState(false);

  const [showPermapool, setShowPermapool] = useState(false);
  const [showSquad, setShowSquad] = useState(false);
  const [showProposals, setShowProposals] = useState(false);
  const [showManifesto, setShowManifesto] = useState(false);
  const toggleSquad = () => setShowSquad((prev) => !prev);
  const toggleProposals = () => setShowProposals((prev) => !prev);
  const togglePermapool = () => setShowPermapool((prev) => !prev);
  const toggleManifesto = () => setShowManifesto((prev) => !prev);

  const [channelIdx, setChannelIdx] = useState(0);
  const switchChannel = () => {
    setChannelIdx((idx) => {
      const newIdx = (idx + 1) % channels.length;
      console.log(
        `[CHANNEL UP] Switched to channel ${newIdx}: ${channels[newIdx]}`
      );
      return newIdx;
    });
  };

  const switchChannelDown = () => {
    setChannelIdx((idx) => {
      const newIdx = (idx - 1 + channels.length) % channels.length;
      console.log(
        `[CHANNEL DOWN] Switched to channel ${newIdx}: ${channels[newIdx]}`
      );
      return newIdx;
    });
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

  const addFrame = async () => {
    try {
      setFrameAdded(true);
      await sdk.actions.addFrame();
      setCacheBust(cacheBust + 1);
    } catch (e) {
      console.log(e);
    }
  };

  const [isMuted, setIsMuted] = useState(true);
  const toggleMute = () => setIsMuted((m) => !m);
  const { setMinimized } = useMinimize();

  const onFc = !!context;
  useEffect(() => {
    if (onFc && !added) {
      addFrame();
    }
  }, [onFc, added]);

  return (
    <>
  <div
    style={{
      position: "fixed",
      top: "10vh",
      left: 0,
      width: "100vw",
      height: "70vh",
      zIndex: 1,
      cursor: "pointer",
      background: "transparent"
    }}
    onClick={() => setMinimized((prev) => !prev)}
    aria-label="Minimize UI"
  />

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
                    setShowManifesto(false);
                    setChannelIdx(1);
                    }}
                  />
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <Television src={channels[channelIdx]} isMuted={isMuted} />
      <Clicker
        togglePermapool={togglePermapool}
        toggleSquad={toggleSquad}
        toggleProposals={toggleProposals}
        toggleManifesto={toggleManifesto}
        switchChannel={switchChannel}
        switchChannelDown={switchChannelDown}
        isMuted={isMuted}
        toggleMute={toggleMute}
      />
    </div>
    </>
  );
}
