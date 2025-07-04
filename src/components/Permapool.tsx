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

import Tooltip from "./ui/Tooltip";

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
    functionName: "getTotalLpFees",
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

  const { data: lastClaimTimeRes } = useReadContract({
    abi: governanceAbi,
    address: governanceAddress as Address,
    functionName: "getLastFeeClaimTime",
    args: [],
    scopeKey: `permapool-last-claim-${cacheBust}`,
  });
  const lastClaimTime = (lastClaimTimeRes || 0n) as bigint;

  const { data: feeClaimDelayRes } = useReadContract({
    abi: governanceAbi,
    address: governanceAddress as Address,
    functionName: "FEE_CLAIM_DELAY",
    args: [],
    scopeKey: `permapool-fee-flaim-delay-${cacheBust}`,
  });
  const feeClaimDelay = (feeClaimDelayRes || 0n) as bigint;

  const [claimCountdown, setClaimCountdown] = useState(0);

  useEffect(() => {
    if (!lastClaimTime) return;
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const nextClaim = Number(lastClaimTime + feeClaimDelay);
      setClaimCountdown(Math.max(nextClaim - now, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastClaimTime, feeClaimDelay]);

  function formatCountdown(seconds: number) {
    if (seconds <= 0) return "Ready!";
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
  }

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
    <div className="section-border">
      <h2>Support the Network</h2>
      <div>
        <div className="max-w-full md:max-w-[66%] mx-auto">
          <p className="subtitle">Become a higher.zip accomplice</p>
          <div className="flex flex-row justify-between border-t-[1px] border-t-dotted border-t-[#fffff8]">
            <p>Donate</p>
            <p>Total Donations: {totalDonations}</p>
          </div>
          <p>higher.zip runs on bandwidth and community coin.</p>
          <p>Tap in and help us keep the broadcast going.</p>
          <div className="flex flex-col">
            <div className="flex flex-row">
              <div className="flex items-center mr-2">ETH</div>
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
          </div>
          <br />
          <div className="flex flex-col md:flex-row justify-between gap-[10px]">
            <div className="text-center w-full md:w-1/3 border-[0.5px] border-solid border-black">
              <h3>Locked in LP</h3>
              <br />
              <div className="flex flex-row justify-between gap-[10px] text-center mb-[10px] mx-[1rem] border-b-[0.5px] border-b-black">
                <Tooltip content={formatUnits(lpEth, 18)}>
                  <div>~ {Number(formatUnits(lpEth, 18)).toFixed(2)}</div>
                </Tooltip>
                <div className="small-font">ETH</div>
              </div>
              <div className="flex flex-row justify-between gap-[10px] text-center mb-[10px] mx-[1rem] border-b-[0.5px] border-b-black">
                <Tooltip content={formatUnits(lpToken, 18)}>
                  <div className="text-center">
                    ~ {Number(formatUnits(lpToken, 18)).toFixed(2)}
                  </div>
                </Tooltip>
                <div className="small-font">HIGHER</div>
              </div>
            </div>
            <div className="text-center w-full md:w-1/3 border-[0.5px] border-solid border-black">
              <h3>Unclaimed Fees</h3>
              <br />
              <div className="flex flex-row justify-between gap-[10px] text-center mb-[10px] mx-[1rem] border-b-[0.5px] border-b-black">
                <Tooltip content={formatUnits(unclaimedEthFees, 18)}>
                  <div className="text-center">
                    ~ {Number(formatUnits(unclaimedEthFees, 18)).toFixed(2)}
                  </div>
                </Tooltip>
                <div className="small-font">ETH</div>
              </div>
              <div className="flex flex-row justify-between gap-[10px] text-center mb-[10px] mx-[1rem] border-b-[0.5px] border-b-black">
                <Tooltip content={formatUnits(unclaimedTokenFees, 18)}>
                  <div className="text-center">
                    ~ {Number(formatUnits(unclaimedTokenFees, 18)).toFixed(2)}
                  </div>
                </Tooltip>
                <div className="small-font">HIGHER</div>
              </div>
              <button
                className="w-full"
                onClick={claim}
                disabled={claiming || claimCountdown > 0}
              >
                {claiming ? "claiming..." : "claim"}
              </button>
            </div>
            <div className="text-center w-full md:w-1/3 border-[0.5px] border-solid border-black">
              <h3>Total Claimed Fees</h3>
              <br />
              <div className="flex flex-row justify-between gap-[10px] text-center mb-[10px] mx-[1rem] border-b-[0.5px] border-b-black">
                <Tooltip content={formatUnits(claimedEthFees, 18)}>
                  <div className="text-center">
                    ~ {Number(formatUnits(claimedEthFees, 18)).toFixed(2)}
                  </div>
                </Tooltip>
                <div className="small-font">ETH</div>
              </div>
              <div className="flex flex-row justify-between gap-[10px] text-center mb-[10px] mx-[1rem] border-b-[0.5px] border-b-black">
                <Tooltip content={formatUnits(claimedTokenFees, 18)}>
                  <div className="text-center">
                    ~ {Number(formatUnits(claimedTokenFees, 18)).toFixed(2)}
                  </div>
                </Tooltip>
                <div className="small-font">HIGHER</div>
              </div>
            </div>
          </div>
          <div className="text-center mx-[1rem] my-[2rem]">
            <h3>Next claim</h3>
            <span>{formatCountdown(claimCountdown)}</span>
          </div>
        </div>
        <div>
          <div className="border-t-[1px] border-t-dotted border-t-black p-[10px] mt-[100px]">
            <h3>This Program is Made Possible by Contributors Like You</h3>
            <p className="fine-print">
              higher.zip runs on the energy, attention, and contributions of our
              community.
            </p>
            <p className="fine-print">Powered by the Pool. Driven by You.</p>

            <p className="fine-print">
              <strong>Every contribution keeps the signal alive.</strong>
            </p>
            <p className="fine-print">
              <strong>Every contributor becomes part of the network.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
