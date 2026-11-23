import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PublicEpisode } from "~/lib/episodes/public";
import { groupPublicEpisodes } from "~/lib/episodes/group";
import ScheduleContent from "./ScheduleContent";

function episode(id: string, state: PublicEpisode["state"], instant: string, join = "https://meet.example.com/room"): PublicEpisode {
  return {
    id, slug: id, title: id, shortDescription: "Come gather", scheduledStartAt: instant,
    timezone: "America/New_York", state, publicJoinUrl: join,
    show: { id: "show-id", slug: "show", title: "Community Hour" },
    hosts: [{ username: "host", displayName: "Host Name" }], path: `/episodes/${id}`,
  };
}

describe("ScheduleContent", () => {
  it("renders all sections, canonical links, host, Show, source time, and valid actions", () => {
    const groups = groupPublicEpisodes([
      episode("live", "LIVE", "2030-07-09T00:00:00.000Z"),
      episode("future", "SCHEDULED", "2030-07-11T00:00:00.000Z"),
      episode("no-join", "SCHEDULED", "2030-07-12T00:00:00.000Z", ""),
      episode("completed", "COMPLETED", "2030-07-08T00:00:00.000Z"),
      episode("stale", "SCHEDULED", "2030-07-07T00:00:00.000Z"),
      episode("cancelled-future", "CANCELLED", "2030-07-13T00:00:00.000Z"),
      episode("cancelled-past", "CANCELLED", "2030-07-06T00:00:00.000Z"),
    ], new Date("2030-07-10T00:00:00.000Z"));
    const html = renderToStaticMarkup(<ScheduleContent groups={groups} />);

    for (const heading of ["Live", "Upcoming", "Past"]) expect(html).toContain(`>${heading}</h2>`);
    for (const id of ["live", "future", "no-join", "completed", "stale", "cancelled-future", "cancelled-past"]) {
      expect(html).toContain(`href="/episodes/${id}"`);
    }
    expect(html).toContain("Host Name");
    expect(html).toContain("Community Hour");
    expect(html).toContain("America/New_York");
    expect(html).toContain("Come gather");
    expect(html).toContain('href="/episodes/future/calendar"');
    expect(html).not.toContain('href="/episodes/completed/calendar"');
    expect(html).not.toContain('href="/episodes/stale/calendar"');
    expect(html).not.toContain('href="/episodes/cancelled-future/calendar"');
    expect((html.match(/>Join<\/a>/g) || []).length).toBe(2);
    expect(html).toContain("cancelled-future");
    expect(html).toContain("CANCELLED");
  });

  it("renders quiet live/past empties and a public /me host invitation", () => {
    const html = renderToStaticMarkup(<ScheduleContent groups={{ live: [], upcoming: [], past: [] }} />);

    expect(html).toContain("Nothing live right now.");
    expect(html).toContain("No upcoming sessions yet.");
    expect(html).toContain('href="/me"');
    expect(html).toContain("Past sessions will appear here.");
  });
});
