// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Television from "./Television";

describe("Television", () => {
  it("preserves native VOD behavior", () => {
    const { container } = render(<Television src="/fixture.mp4" isMuted />);
    const video = container.querySelector("video");
    expect(video).toHaveAttribute("src", "/fixture.mp4");
    expect(video).toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("playsinline");
  });
});
