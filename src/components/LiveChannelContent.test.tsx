// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./Live", () => ({
  default: () => <div data-testid="live-player" />,
}));
vi.mock("./Pipes", () => ({
  default: ({ onError }: { onError: () => void }) => (
    <div data-testid="pipes"><button onClick={onError}>fail-webgl</button></div>
  ),
}));

import LiveChannelContent from "./LiveChannelContent";

const props = { playbackId: "public-playback", isMuted: true, retryStatus: vi.fn() };

describe("LiveChannelContent", () => {
  it("does not flash the player or screensaver while checking", () => {
    render(<LiveChannelContent {...props} status="checking" />);
    expect(screen.getByRole("status", { name: "Checking broadcast status" })).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(screen.queryByTestId("live-player")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pipes")).not.toBeInTheDocument();
  });

  it("mounts the player only while live", () => {
    const { rerender } = render(<LiveChannelContent {...props} status="offline" />);
    expect(screen.getByTestId("pipes")).toBeInTheDocument();
    expect(screen.queryByTestId("live-player")).not.toBeInTheDocument();
    rerender(<LiveChannelContent {...props} status="live" />);
    expect(screen.getByTestId("live-player")).toBeInTheDocument();
    expect(screen.queryByTestId("pipes")).not.toBeInTheDocument();
  });

  it("shows a recoverable fallback for status and WebGL failures", () => {
    const retryStatus = vi.fn();
    const { rerender } = render(
      <LiveChannelContent {...props} retryStatus={retryStatus} status="error" />,
    );
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retryStatus).toHaveBeenCalledOnce();

    rerender(<LiveChannelContent {...props} retryStatus={retryStatus} status="offline" />);
    fireEvent.click(screen.getByRole("button", { name: "fail-webgl" }));
    expect(screen.getByText("Television signal unavailable")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.getByTestId("pipes")).toBeInTheDocument();
  });
});
