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

const props = { playbackId: "public-playback", isMuted: true };

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

  it("shows a noninteractive, stable status for initial and WebGL failures", () => {
    const { rerender } = render(<LiveChannelContent {...props} status="error" />);
    const status = screen.getByRole("status", { name: "Broadcast status unavailable" });
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();

    rerender(<LiveChannelContent {...props} status="error" />);
    expect(screen.getByRole("status", { name: "Broadcast status unavailable" })).toBe(status);

    rerender(<LiveChannelContent {...props} status="offline" />);
    fireEvent.click(screen.getByRole("button", { name: "fail-webgl" }));
    expect(screen.getByText("Television signal unavailable")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restart animation" }));
    expect(screen.getByTestId("pipes")).toBeInTheDocument();
  });
});
