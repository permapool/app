import React, { useState, useEffect } from "react";
import { Address, formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { base } from "wagmi/chains";
import { rebaseAbi, rebaseAddress } from "~/constants/abi-rebase";
import { earningsAbi, earningsAddress } from "~/constants/abi-earnings";
import { governanceAbi, governanceAddress } from "~/constants/abi-governance";
import { permapoolAbi, permapoolAddress } from "~/constants/abi-permapool";
import { switchChain } from "@wagmi/core";

import { config } from "~/components/providers/WagmiProvider";
export default function Permapool() {
  const account = useAccount();

  const [value, setValue] = useState("");
  const [donating, setDonating] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [cacheBust, setCacheBust] = useState(0);

  const { data: tokenIdRes } = useReadContract({
    abi: permapoolAbi,
    address: permapoolAddress as Address,
    functionName: "LP_TOKEN_ID",
    args: [],
  });
  const tokenId = (tokenIdRes || 0n) as bigint;

  // NOTE: the order of outputs depends on token address
  // i.e. if TOKEN < WETH (0x4200000000000000000000000000000000000006)
  // Higher is less, so it is the first result in both functions below
  const { data: underlyingAssetsRes } = useReadContract({
    abi: rebaseAbi,
    address: rebaseAddress,
    functionName: "getUnderlyingAssets",
    args: [tokenId],
    scopeKey: `permapool-${cacheBust}`,
  });
  const [lpToken, lpEth] = (underlyingAssetsRes || [0n, 0n]) as [
    bigint,
    bigint
  ];
  const { data: unclaimedFeesRes } = useReadContract({
    abi: earningsAbi,
    address: earningsAddress as Address,
    functionName: "getUnclaimedFees",
    args: [tokenId],
    scopeKey: `permapool-${cacheBust}`,
  });
  const [unclaimedEthFees, unclaimedTokenFees] = (unclaimedFeesRes || [
    0n,
    0n,
  ]) as [bigint, bigint];

  const { data: claimedFeesRes } = useReadContract({
    abi: permapoolAbi,
    address: permapoolAddress as Address,
    functionName: "getTotalEthAndTokenFees",
    args: [],
    scopeKey: `permapool-${cacheBust}`,
  });
  const [claimedEthFees, claimedTokenFees] = (claimedFeesRes || [0n, 0n]) as [
    bigint,
    bigint
  ];

  const { data: totalDonationsRes } = useReadContract({
    abi: permapoolAbi,
    address: permapoolAddress as Address,
    functionName: "getNumDonations",
    args: [],
    scopeKey: `permapool-${cacheBust}`,
  });
  const totalDonations = (totalDonationsRes || 0n) as bigint;

  const {
    writeContract,
    error: writeError,
    data: writeData,
  } = useWriteContract();

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  useEffect(() => {
    if (writeError) {
      setClaiming(false);
      setDonating(false);
      // @ts-expect-error: TS2339
      setTimeout(() => window.alert(writeError.shortMessage), 1);
    } else if (isConfirmed) {
      setClaiming(false);
      setDonating(false);
      setCacheBust(cacheBust + 1);
    }
  }, [writeError, isConfirmed]);

  const donate = async () => {
    setDonating(true);
    if (account.chainId != base.id) {
      await switchChain(config, { chainId: base.id });
    }
    writeContract({
      abi: permapoolAbi,
      address: permapoolAddress as Address,
      functionName: "donate",
      args: [],
      chainId: base.id,
      value: parseUnits(value, 18),
    });
  };

  const claim = async () => {
    setClaiming(true);
    if (account.chainId != base.id) {
      await switchChain(config, { chainId: base.id });
    }
    writeContract({
      abi: governanceAbi,
      address: governanceAddress as Address,
      functionName: "claimFees",
      args: [permapoolAddress],
      chainId: base.id,
    });
  };

  return (
    <div className="section-border" style={{ marginTop: "2em" }}>
      <h2>Support the Network</h2>
      <p className="subtitle">Become a higher.zip accomplice</p>
      <div className="flex flex-row justify-between border-t-[1px] border-t-dotted border-t-[#fffff8]">
        <p>Donate</p>
        <p>Total Donations: {totalDonations}</p>
      </div>
      <p>higher.zip runs on bandwidth and community coin.</p>
      <p>Tap in and help us keep the broadcast going.</p>
      <div className="flex">
        <div className="flex-shrink">ETH&nbsp;</div>
        <div className="flex-grow">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <div className="flex-shrink">
          <button onClick={donate} disabled={donating}>
            {donating ? "donating..." : "inject liquidity"}
          </button>
        </div>
      </div>
      <div>
      <div className="mt-[10px] flex flex-row gap-[10px] w-full">
          <button className="flex-grow" onClick={() => setValue("0.1")}>
            0.1 eth
          </button>
          <button className="flex-grow" onClick={() => setValue("0.5")}>
            0.5 eth
          </button>
          <button className="flex-grow" onClick={() => setValue("1")}>
            1 eth
          </button>
          <button className="flex-grow" onClick={() => setValue("5")}>
            5 eth
          </button>
        </div>
      </div>
      <br />
      <div className="flex flex-row justify-between">
        <div className="text-center">
          <h3>Locked in LP</h3>
          <div className="mb-[10px]">
            <div className="small-font">ETH</div>
            {formatUnits(lpEth, 18)}
          </div>
          <div className="mb-[10px]">
            <div className="small-font">HIGHER</div>
            {formatUnits(lpToken, 18)}
          </div>
        </div>

        <div className="text-center">
          <h3>Unclaimed Fees</h3>
          <div className="mb-[10px]">
            <div className="small-font">ETH</div>
            {formatUnits(unclaimedEthFees, 18)}
          </div>
          <div className="mb-[10px]">
            <div className="small-font">HIGHER</div>
            {formatUnits(unclaimedTokenFees, 18)}
          </div>
          <button className="w-full" onClick={claim} disabled={claiming}>
            {claiming ? "claiming..." : "claim"}
          </button>
        </div>

        <div className="text-center">
          <h3>Total Claimed Fees</h3>
          <div className="mb-[10px]">
            <div className="small-font">ETH</div>
            {formatUnits(claimedEthFees, 18)}
          </div>
          <div className="mb-[10px]">
            <div className="small-font">HIGHER</div>
            {formatUnits(claimedTokenFees, 18)}
          </div>
        </div>
      </div>
      <div className="border-t-[1px] border-t-dashed border-t-[#fffff8] p-[10px] mt-[100px] bg-neutral-800 text-[#fffff8]">
        <strong>
          <p>This Program is Made Possible by Contributors Like You</p>
        </strong>
        <p>
          higher.zip runs on the energy, attention, and contributions of our
          community.
        </p>
        <p>Powered by the Pool. Driven by You.</p>
        <strong>
          <p>Every contribution keeps the signal alive.</p>
          <p>Every contributor becomes part of the network.</p>
        </strong>
      </div>
    </div>
  );
}
