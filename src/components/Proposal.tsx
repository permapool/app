import React, { useState, useEffect} from "react";
import { Address } from "viem";
import { shortAddress, getDuration } from '~/lib/formatting';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi';
import { base } from "wagmi/chains";
import { switchChain } from '@wagmi/core'

import { governanceAbi, governanceAddress } from "~/constants/abi-governance";
import { ProposalData, getNullAddress } from "~/lib/data";
import { config } from '~/components/providers/WagmiProvider';

export default function ProposalList({ proposal, isMember }: { proposal: ProposalData, isMember: boolean }) {
  const account = useAccount();

  const [voting, setVoting] = useState(false);
  const [cacheBust, setCacheBust] = useState(0);

  const { writeContract, error: writeError, data: writeData } = useWriteContract();

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  useEffect(() => {
    if (writeError) {
      setVoting(false);
      // @ts-expect-error: TS2339
      setTimeout(() => window.alert(writeError.shortMessage), 1);
    } else if (isConfirmed) {
      setVoting(false);
      setCacheBust(cacheBust + 1);
    }
  }, [writeError, isConfirmed]);

  const { data: hasVotedRes } = useReadContract({
    abi: governanceAbi,
    address: governanceAddress as Address,
    functionName: "hasVoted",
    args: [account.address, proposal.id || 0],
    scopeKey: `proposal-${cacheBust}`
  });
  const hasVoted = (hasVotedRes || false) as boolean;
  const now = BigInt(Math.floor(new Date().getTime() / 1000));
  const expired = now > proposal.expiration;

  const vote = async () => {
    setVoting(true);
    if (account.chainId != base.id) {
      await switchChain(config, { chainId: base.id });
    }
    writeContract({
      abi: governanceAbi,
      address: governanceAddress as Address,
      functionName: "vote",
      args: [proposal.id],
      chainId: base.id,
    });
  };
  return (
    <div>
      {
        proposal.permapool == getNullAddress() ? (
          <div>
            Set {shortAddress(proposal.target)} weight to {proposal.weight}
          </div>
        ) : (
          <div>
            Upgrade governance of {shortAddress(proposal.permapool)} to {shortAddress(proposal.target)}
          </div>
        )
      }
      <div className="small-font">
        {
          proposal.passed ? 'Passed ✅' : (
            <span>{expired ? 'Expired' : `Expires in ${getDuration(Number(proposal.expiration - now))}`}</span>
          )
        }
        {
          isMember ? (
            <div>
              {
                hasVoted ? 'You Voted ✅' : (
                  <span>
                    {
                      !expired ? (
                        <button
                          onClick={vote}
                          disabled={voting}
                        >
                          vote
                        </button>
                      ) : null
                    }
                  </span>
                )
              }
            </div>
          ) : null
        }
      </div>
    </div>
  )
}