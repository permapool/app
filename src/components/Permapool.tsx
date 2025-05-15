import React, { useState, useEffect } from "react";
import { Address, formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi';
import { base } from "wagmi/chains";
import { rebaseAbi, rebaseAddress } from "~/constants/abi-rebase";
import { permapoolAbi, permapoolAddress } from "~/constants/abi-permapool";
import { governanceAbi, governanceAddress } from "~/constants/abi-governance";
import { switchChain } from '@wagmi/core'

import { config } from '~/components/providers/WagmiProvider';
export default function Permapool() {
  const account = useAccount();

  const [value, setValue] = useState('');
  const [donating, setDonating] = useState(false);
  const [cacheBust, setCacheBust] = useState(0);

  const { data: tokenIdRes } = useReadContract({
    abi: permapoolAbi,
    address: permapoolAddress as Address,
    functionName: "LP_TOKEN_ID",
    args: [],
  });
  const tokenId = (tokenIdRes || 0n) as bigint;

  const { data: underlyingAssetsRes } = useReadContract({
    abi: rebaseAbi,
    address: rebaseAddress,
    functionName: "getUnderlyingAssets",
    args: [tokenId],
  });
  // NOTE: the order may need to be switched depending on if the token address is < or > WETH (0x4200000000000000000000000000000000000006)
  // Higher is less, so it goes first
  const [lpToken, lpEth] = (underlyingAssetsRes || [0n, 0n]) as [bigint, bigint];

  const { data: totalFeesRes } = useReadContract({
    abi: permapoolAbi,
    address: permapoolAddress as Address,
    functionName: "getTotalEthAndTokenFees",
    args: [],
  });
  const [totalEthFees, totalTokenFees] = (totalFeesRes || [0n, 0n]) as [bigint, bigint];

  const { data: totalDonationsRes } = useReadContract({
    abi: permapoolAbi,
    address: permapoolAddress as Address,
    functionName: "getNumDonations",
    args: [],
  });
  const totalDonations = (totalDonationsRes || 0n) as bigint;

  const { writeContract, error: writeError, data: writeData } = useWriteContract();

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  useEffect(() => {
    if (writeError) {
      setDonating(false);
      // @ts-expect-error: TS2339
      setTimeout(() => window.alert(writeError.shortMessage), 1);
    } else if (isConfirmed) {
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
      abi: governanceAbi,
      address: governanceAddress as Address,
      functionName: "donate",
      args: [],
      chainId: base.id,
      value: parseUnits(value, 18)
    });
  };

  return (
    <div style={{ marginTop: '2em' }}>
      <h2>Permapool</h2>
      <div>
        <h3>Locked in LP</h3>
        <div>ETH: {formatUnits(lpEth, 18)}</div>
        <div>TOKEN: {formatUnits(lpToken, 18)}</div>
      </div>
      <br />
      <div>
        <h3>Fees Generated</h3>
        <div>ETH: {formatUnits(totalEthFees, 18)}</div>
        <div>TOKEN: {formatUnits(totalTokenFees, 18)}</div>
      </div>
      <br />
      <h3>Total Donations: {totalDonations}</h3>
      <br />
      <h3>Donate</h3>
      <div>
      ETH: <input type="text" value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <br />
      <button
        onClick={donate}
        disabled={donating}
      >
        donate
      </button>
    </div>
  )
}
