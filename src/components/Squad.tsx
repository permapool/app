import React, { useState, useEffect } from "react";
import { Address } from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { base } from "wagmi/chains";
import { shortAddress } from "~/lib/formatting";
import { governanceAbi, governanceAddress } from "~/constants/abi-governance";
import { switchChain } from "@wagmi/core";
import { config } from "~/components/providers/WagmiProvider";

export default function Squad() {
  const account = useAccount();
  const [cacheBust, setCacheBust] = useState(0);
  const [decreasing, setDecreasing] = useState(false);

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
      setDecreasing(false);
      // @ts-expect-error: TS2339
      setTimeout(() => window.alert(writeError.shortMessage), 1);
    } else if (isConfirmed) {
      setDecreasing(false);
      setCacheBust(cacheBust + 1);
    }
  }, [writeError, isConfirmed]);

  const { data: squadRes } = useReadContract({
    abi: governanceAbi,
    address: governanceAddress as Address,
    functionName: "getSquadMembersAndWeights",
    args: [],
    scopeKey: `squad-${cacheBust}`,
  });
  const [members, weights] = (squadRes || [[], []]) as [string[], bigint[]];
  let totalWeight = 0n;
  weights.forEach((w) => (totalWeight += w));

  const decrease = async (newWeight: bigint) => {
    setDecreasing(true);
    if (account.chainId != base.id) {
      await switchChain(config, { chainId: base.id });
    }
    writeContract({
      abi: governanceAbi,
      address: governanceAddress as Address,
      functionName: "decreaseWeight",
      args: [newWeight],
      chainId: base.id,
    });
  };

  return (
    <div className="section-border" style={{ marginTop: "2em" }}>
      <h2>Squad</h2>
      <h3>Members in squad: {weights.length}</h3>
      <h3>Total weight: {totalWeight}</h3>
      <br />
      <div className="flex flex-row w-55 items-center justify-between">
        <div>ID</div>
        <div>WEIGHT</div>
      </div>
      {members.map((m, i) => (
        <div
          key={`member-${m}`}
          className="flex flex-row w-55 items-center justify-between border-t-[1px] border-t-dotted border-t-[#fff] pt-[10px] pb-[10px] hover:bg-neutral-800 transition-colors duration-200"
        >
          <div>
            ENS.eth <br />
            {shortAddress(m)}
          </div>
          <div className="small-font">
            {weights[i]}&nbsp;
            {m == account.address ? (
              <button
                onClick={() => decrease(weights[i] - 1n)}
                disabled={decreasing}
              >
                {decreasing ? "decreasing..." : "decrease"}
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
