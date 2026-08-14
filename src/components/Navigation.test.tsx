// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  dynamicCall: 0,
  toggleMute: vi.fn(),
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    const call = mocks.dynamicCall++;
    return call === 0
      ? ({ children }: { children: React.ReactNode }) => <>{children}</>
      : () => <div data-testid="nav-auth" />;
  },
}));
vi.mock("next/image", () => ({
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("./providers/MinimizeMenus", () => ({ useMinimize: () => ({ minimized: false }) }));
vi.mock("./providers/MuteContext", () => ({
  useMute: () => ({ isMuted: true, toggleMute: mocks.toggleMute }),
}));
vi.mock("./providers/ToggleContext", () => ({
  useToggle: () => ({
    toggleManifesto: vi.fn(),
    togglePermapool: vi.fn(),
    toggleSquad: vi.fn(),
    toggleProposals: vi.fn(),
  }),
}));
vi.mock("./ui/Logo", () => ({ default: () => <div>Logo</div> }));

import Navigation from "./Navigation";

describe("navigation mute button", () => {
  beforeEach(() => mocks.toggleMute.mockReset());

  it("removes the persistent black border while preserving focus and behavior", () => {
    render(<Navigation />);
    const button = screen.getByRole("button", { name: "Unmute audio" });

    expect(button).toHaveClass("border", "border-transparent");
    expect(button).not.toHaveClass("border-black");
    expect(button.className).toContain("focus-visible:outline-[var(--green)]");
    expect(button).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(button);
    expect(mocks.toggleMute).toHaveBeenCalledTimes(1);
  });
});
