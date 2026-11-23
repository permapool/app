// @vitest-environment jsdom

import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sourceTimeLabel } from "~/lib/episodes/time";
import EpisodeTime from "./EpisodeTime";

afterEach(() => vi.restoreAllMocks());

describe("EpisodeTime", () => {
  it("starts with deterministic source time and enhances with viewer-local time after hydration", async () => {
    const instant = "2030-07-10T23:30:00.000Z";
    const timezone = "America/New_York";
    const sourceLabel = sourceTimeLabel(instant, timezone);
    const element = <EpisodeTime instant={instant} timezone={timezone} sourceLabel={sourceLabel} />;
    const serverHtml = renderToString(element);
    const container = document.createElement("div");
    container.innerHTML = serverHtml;
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(serverHtml).toContain(sourceLabel);
    expect(serverHtml).toContain(timezone);
    expect(serverHtml).not.toContain("Your time:");

    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, element);
    });

    expect(container.textContent).toContain("Your time:");
    expect(errors.mock.calls.flat().join(" ")).not.toMatch(/hydration|did not match/i);
    await act(async () => root.unmount());
  });

  it("falls back safely for invalid timezone and invalid instant data", () => {
    expect(sourceTimeLabel("2030-07-10T23:30:00.000Z", "Invalid/Zone")).toContain("UTC");
    expect(sourceTimeLabel("bad instant", "UTC")).toBe("Schedule time unavailable");
  });
});
