// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  dynamicCall: 0,
  toggleMute: vi.fn(),
  pathname: "/",
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
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
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
  beforeEach(() => {
    cleanup();
    mocks.toggleMute.mockReset();
    mocks.pathname = "/";
  });

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

  it("links to Schedule on desktop home and in the mobile menu", () => {
    const { container } = render(<Navigation />);
    expect(container.querySelector('.hidden.md\\:flex a[href="/schedule"]')?.textContent).toBe("Schedule");
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Schedule" }).getAttribute("href")).toBe("/schedule");
  });

  it("links to Schedule on desktop non-home routes", () => {
    mocks.pathname = "/episodes/example";
    const { container } = render(<Navigation />);
    expect(container.querySelector('.hidden.md\\:flex a[href="/schedule"]')?.textContent).toBe("Schedule");
    expect(container.querySelector('.hidden.md\\:flex a[href="/next"]')).toBeTruthy();
  });
});
