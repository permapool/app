import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PublicEpisode } from "~/lib/episodes/public";
import EpisodePageContent from "./EpisodePageContent";

function episode(state: PublicEpisode["state"]): PublicEpisode {
  return {
    id: "episode-id",
    slug: "community-gathering-uuid",
    title: "Community Gathering",
    shortDescription: "A place to gather.",
    scheduledStartAt: "2030-07-10T23:30:00.000Z",
    timezone: "America/New_York",
    state,
    publicJoinUrl: "https://meet.example.com/room",
    show: { id: "show-id", slug: "community-hour", title: "Community Hour" },
    hosts: [{ username: "host", displayName: "Host Name" }],
    path: "/episodes/community-gathering-uuid",
  };
}

describe("EpisodePageContent lifecycle", () => {
  it("renders a scheduled gathering with host, Show, time, join, calendar, and share", () => {
    const html = renderToStaticMarkup(
      <EpisodePageContent episode={episode("SCHEDULED")} canonicalUrl="https://higher.zip/episodes/community-gathering-uuid" />,
    );

    for (const text of ["Community Gathering", "Host Name", "Community Hour", "America/New_York", "Join session", "Add to calendar", "Share", "https://higher.zip/episodes/community-gathering-uuid"]) {
      expect(html).toContain(text);
    }
    expect(html).toContain('href="https://meet.example.com/room"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('href="/episodes/community-gathering-uuid/calendar"');
    expect(html).not.toContain("video");
  });

  it("keeps the join action primary for a live gathering without video", () => {
    const html = renderToStaticMarkup(
      <EpisodePageContent episode={episode("LIVE")} canonicalUrl="https://higher.zip/episodes/community-gathering-uuid" />,
    );

    expect(html).toContain("Live now");
    expect(html).toContain("Join session");
  });

  it("keeps a completed page and honestly describes replay availability", () => {
    const html = renderToStaticMarkup(
      <EpisodePageContent episode={episode("COMPLETED")} canonicalUrl="https://higher.zip/episodes/community-gathering-uuid" />,
    );

    expect(html).toContain("Completed");
    expect(html).toContain("No replay is available here yet.");
    expect(html).not.toContain("Join session");
  });

  it("keeps cancellation visible at the permanent URL", () => {
    const html = renderToStaticMarkup(
      <EpisodePageContent episode={episode("CANCELLED")} canonicalUrl="https://higher.zip/episodes/community-gathering-uuid" />,
    );

    expect(html).toContain("Cancelled");
    expect(html).toContain("This gathering was cancelled.");
    expect(html).toContain("https://higher.zip/episodes/community-gathering-uuid");
    expect(html).not.toContain("Join session");
  });

  it("renders a standalone no-join gathering without an empty player", () => {
    const standalone = { ...episode("SCHEDULED"), show: null, publicJoinUrl: null, hosts: [] };
    const html = renderToStaticMarkup(
      <EpisodePageContent episode={standalone} canonicalUrl="https://higher.zip/episodes/community-gathering-uuid" />,
    );

    expect(html).toContain("Hosts to be announced");
    expect(html).toContain("Join details will appear here when available.");
    expect(html).not.toContain("Join session");
    expect(html).not.toContain("video");
  });
});
