"use client";
import { useEffect, useState } from "react";

import sdk, { Context } from "@farcaster/frame-sdk";

import Squad from "./Squad";
import ProposalList from "./ProposalList";
import Permapool from "./Permapool";

export default function Home() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [cacheBust, setCacheBust] = useState(0);
  const [frameAdded, setFrameAdded] = useState(false);

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
      addFrame()
    }
  }, [onFc, added]);

  return (
    <div className="max-w-[400px] mx-auto px-4">
      <div className="mx-auto py-4">
        <h1 className="font-bold text-center mb-4 mt-4">Higher Permapool</h1>
        <Permapool />
        <br />
        <Squad />
        <br />
        <ProposalList />
        <br />
      </div>
    </div>
  );
}
