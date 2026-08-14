// @vitest-environment jsdom

import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewClicker from "./NewClicker";

describe("NewClicker picture-in-picture availability", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      media: "(pointer: coarse)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
  });

  it("omits PiP whenever no video element is available", () => {
    const common = {
      switchChannelUp: vi.fn(),
      switchChannelDown: vi.fn(),
      isMuted: true,
      toggleMute: vi.fn(),
    };
    const { rerender } = render(
      <NewClicker {...common} isPictureInPictureAvailable={false} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "↑" }));
    act(() => vi.advanceTimersByTime(150));
    expect(screen.queryByText("◲")).not.toBeInTheDocument();

    rerender(<NewClicker {...common} isPictureInPictureAvailable />);
    expect(screen.getByText("◲")).toBeInTheDocument();
  });
});
