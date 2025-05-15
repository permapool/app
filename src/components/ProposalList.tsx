import React, {useState} from "react";
import { Address } from "viem";
import { useAccount, useReadContract } from 'wagmi';
import { governanceAbi, governanceAddress } from "~/constants/abi-governance";
import { ProposalData } from "~/lib/data";

import Proposal from "./Proposal";
import CreateProposal from "./CreateProposal";

export default function ProposalList() {
  const account = useAccount();
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const { data: proposalsRes } = useReadContract({
    abi: governanceAbi,
    address: governanceAddress as Address,
    functionName: "getProposals",
    args: [],
  });
  const proposals = (proposalsRes || []) as ProposalData[];
  const { data: isMemberRes } = useReadContract({
    abi: governanceAbi,
    address: governanceAddress as Address,
    functionName: "isSquadMember",
    args: [account.address],
  });
  const isMember = (isMemberRes || false) as boolean;
  return (
    <div>
      <div className="flex" style={{ alignItems: 'center' }}>
        <div className="flex-grow">
          <h2>Proposals</h2>
        </div>
        <div className="flex-shrink">
          {
            showCreateProposal ? (
              <button onClick={() => setShowCreateProposal(false)}>Cancel</button>
            ) : (
              <button onClick={() => setShowCreateProposal(true)}>Create</button>
            )
          }
        </div>
      </div>
      {
        showCreateProposal ? (
          <CreateProposal />
        ) : null
      }
      <br />
      {
        proposals.map(p => <Proposal key={`prop-${p.expiration}`} proposal={p} isMember={isMember} />)
      }
    </div>
  )
}