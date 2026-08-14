// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ ensNames: {} as Record<string, string | null> }));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: undefined, chainId: 8453 }),
  useReadContract: vi.fn(),
  useWriteContract: () => ({ writeContract: vi.fn() }),
  useWaitForTransactionReceipt: () => ({ isSuccess: false }),
}));
vi.mock("@wagmi/core", () => ({ switchChain: vi.fn() }));
vi.mock("~/components/providers/WagmiProvider", () => ({ config: {} }));
vi.mock("~/lib/auth/useRequireWallet", () => ({ useRequireWallet: () => vi.fn() }));
vi.mock("~/components/useEnsNames", () => ({ useEnsNames: () => mocks.ensNames }));

import { useReadContract } from "wagmi";
import Proposal from "./Proposal";
import Squad from "./Squad";

const MEMBER = "0x1234567890123456789012345678901234567890";

describe("ENS presentation fallback", () => {
  beforeEach(() => {
    vi.mocked(useReadContract).mockReset();
    mocks.ensNames = { [MEMBER]: null };
  });

  it("renders the abbreviated squad address when ENS is unavailable", () => {
    vi.mocked(useReadContract).mockReturnValue({ data: [[MEMBER], [1n]] } as never);
    render(<Squad />);
    expect(screen.getByText("0x1234...7890")).toBeInTheDocument();
  });

  it("keeps proposal addresses abbreviated independently of ENS", () => {
    vi.mocked(useReadContract).mockReturnValue({ data: false } as never);
    render(
      <Proposal
        proposal={{
          id: 1n,
          target: MEMBER,
          permapool: "0x0000000000000000000000000000000000000000",
          weight: 2n,
          expiration: BigInt(Math.floor(Date.now() / 1000) + 600),
          passed: false,
        }}
        isMember={false}
      />,
    );
    expect(screen.getByText(/0x1234\.\.\.7890/)).toBeInTheDocument();
  });
});
