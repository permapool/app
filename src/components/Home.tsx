"use client";
import { useEffect, useState } from "react";

import sdk, { Context } from "@farcaster/frame-sdk";
import { motion, AnimatePresence } from "framer-motion";

import Squad from "./Squad";
import ProposalList from "./ProposalList";
import Permapool from "./Permapool";
import Television from "./Television";
import Clicker from "./ui/Clicker";

export default function Home() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [cacheBust, setCacheBust] = useState(0);
  const [frameAdded, setFrameAdded] = useState(false);

  const [showPermapool, setShowPermapool] = useState(false);
  const [showSquad, setShowSquad] = useState(false);
  const [showProposals, setShowProposals] = useState(false);
  const toggleSquad = () => setShowSquad((prev) => !prev);
  const toggleProposals = () => setShowProposals((prev) => !prev);
  const togglePermapool = () => setShowPermapool((prev) => !prev);

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

  const onFc = !!context;
  useEffect(() => {
    if (onFc && !added) {
      addFrame();
    }
  }, [onFc, added]);

  return (
    <div className="max-w-[1100px] mx-auto px-4 pb-20 pt-[7%]">
      <div className="mx-auto py-4">
        <AnimatePresence>
          {showPermapool && (
            <motion.div
              key="permapool"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <section>
                <ProposalList />
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Television />
      <Clicker togglePermapool={togglePermapool} toggleSquad={toggleSquad} toggleProposals={toggleProposals} />
    </div>
  );
}
