import React, { useState, useEffect } from "react";
import { Address } from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi';
import { base } from "wagmi/chains";
import { governanceAbi, governanceAddress } from "~/constants/abi-governance";
import { switchChain } from '@wagmi/core'
import { config } from '~/components/providers/WagmiProvider';

export default function CreateProposal() {
  const account = useAccount();

  const [address, setAddress] = useState('');
  const [weight, setWeight] = useState('');
  const [proposing, setProposing] = useState(false);
  const [cacheBust, setCacheBust] = useState(0);


  const { data: weightRes } = useReadContract({
    abi: governanceAbi,
    address: governanceAddress as Address,
    functionName: "getSquadMemberWeight",
    args: [address],
  });
  const currentWeight = (weightRes || 0n) as bigint;
  console.log(currentWeight);

  const { writeContract, error: writeError, data: writeData } = useWriteContract();

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  useEffect(() => {
    if (writeError) {
      setProposing(false);
      // @ts-expect-error: TS2339
      setTimeout(() => window.alert(writeError.shortMessage), 1);
    } else if (isConfirmed) {
      setProposing(false);
      setCacheBust(cacheBust + 1);
    }
  }, [writeError, isConfirmed]);


  const propose = async () => {
    setProposing(true);
    if (account.chainId != base.id) {
      await switchChain(config, { chainId: base.id });
    }
    writeContract({
      abi: governanceAbi,
      address: governanceAddress as Address,
      functionName: "proposeWeightChange",
      args: [address, weight],
      chainId: base.id,
    });
  };

  let invalidInputs = true;
  if (
    parseInt(weight) >= 0 &&
    parseInt(weight) < 4 &&
    /^0x[a-fA-F0-9]{40}$/.test(address)
  ) {
    invalidInputs = false;
  }

  return (
    <div style={{ marginTop: '2em' }}>
      <h2>Propose Squad Adjustments</h2>
      <div>
      Address: <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
      Weight: <input type="text" value={weight} onChange={(e) => setWeight(e.target.value)} />
      </div>
      <br />
      <button
        onClick={propose}
        disabled={proposing || invalidInputs}
      >
        propose
      </button>
    </div>
  )
}
