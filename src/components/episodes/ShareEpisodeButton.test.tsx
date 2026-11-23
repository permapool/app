// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ShareEpisodeButton from "./ShareEpisodeButton";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ShareEpisodeButton", () => {
  it("copies the provided canonical URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<ShareEpisodeButton url="https://higher.zip/episodes/gathering-uuid" />);

    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("https://higher.zip/episodes/gathering-uuid"));
    expect(await screen.findByText("Link copied")).toBeTruthy();
  });
});
