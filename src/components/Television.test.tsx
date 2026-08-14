// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Television from "./Television";

describe("Television", () => {
  it("extends offline content to every edge of the viewport shell", () => {
    const { container } = render(
      <Television isMuted contentMode="offline">
        <div data-testid="pipes-content" />
      </Television>,
    );
    const shell = container.firstElementChild;
    const wrapper = shell?.firstElementChild;

    expect(shell).toHaveClass("fixed", "h-screen", "w-screen", "overflow-hidden", "-z-10");
    expect(wrapper).toHaveClass(
      "absolute",
      "inset-0",
      "h-full",
      "w-full",
      "pointer-events-none",
      "z-10",
    );
    expect(wrapper).not.toHaveClass("object-contain", "object-cover", "object-fill");
    expect(wrapper).not.toHaveStyle({ top: "5%", height: "90%" });
    expect(wrapper).not.toHaveAttribute("style");
  });

  it("retains the existing live-content boundary outside offline mode", () => {
    const { container } = render(
      <Television isMuted contentMode="default">
        <div data-testid="live-content" />
      </Television>,
    );
    const wrapper = container.firstElementChild?.firstElementChild;

    expect(wrapper).toHaveStyle({ top: "5%", left: "0%", width: "100%", height: "90%" });
    expect(wrapper).not.toHaveClass("inset-0", "h-full", "w-full");
  });

  it("preserves native VOD behavior and geometry", () => {
    const { container } = render(<Television src="/fixture.mp4" isMuted />);
    const video = container.querySelector("video");
    expect(video).toHaveAttribute("src", "/fixture.mp4");
    expect(video).toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveStyle({ top: "5%", left: "0%", width: "100%", height: "90%" });
    expect(video).toHaveClass("object-contain", "pointer-events-none", "z-10");
    expect(video).not.toHaveClass("inset-0", "h-full", "w-full");
  });
});
