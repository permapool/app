import { describe, expect, it } from "vitest";
import type { PublicEpisode } from "./public";
import { groupPublicEpisodes } from "./group";

const now = new Date("2030-07-10T12:00:00.000Z");

function episode(id: string, state: PublicEpisode["state"], scheduledStartAt: string): PublicEpisode {
  return {
    id, slug: id, title: id, shortDescription: null, scheduledStartAt,
    timezone: "America/New_York", state, publicJoinUrl: null, show: null, hosts: [], path: `/episodes/${id}`,
  };
}

describe("groupPublicEpisodes", () => {
  it("groups by persisted state and temporal placement without changing lifecycle", () => {
    const input = [
      episode("live-later", "LIVE", "2030-07-12T00:00:00.000Z"),
      episode("live-earlier", "LIVE", "2030-07-01T00:00:00.000Z"),
      episode("upcoming-later", "SCHEDULED", "2030-07-12T00:00:00.000Z"),
      episode("upcoming-next", "SCHEDULED", "2030-07-10T12:00:00.000Z"),
      episode("cancelled-future", "CANCELLED", "2030-07-13T00:00:00.000Z"),
      episode("stale", "SCHEDULED", "2030-07-08T00:00:00.000Z"),
      episode("completed", "COMPLETED", "2030-07-09T00:00:00.000Z"),
      episode("cancelled-past", "CANCELLED", "2030-07-07T00:00:00.000Z"),
    ];

    const groups = groupPublicEpisodes(input, now);

    expect(groups.live.map(({ id }) => id)).toEqual(["live-earlier", "live-later"]);
    expect(groups.upcoming.map(({ id }) => id)).toEqual(["upcoming-next", "upcoming-later", "cancelled-future"]);
    expect(groups.past.map(({ id }) => id)).toEqual(["completed", "stale", "cancelled-past"]);
    expect(groups.past.find(({ id }) => id === "stale")?.state).toBe("SCHEDULED");
    expect(input.find(({ id }) => id === "stale")?.state).toBe("SCHEDULED");
  });

  it("uses ID as a deterministic tie breaker", () => {
    const groups = groupPublicEpisodes([
      episode("b", "SCHEDULED", "2030-07-11T00:00:00.000Z"),
      episode("a", "SCHEDULED", "2030-07-11T00:00:00.000Z"),
    ], now);

    expect(groups.upcoming.map(({ id }) => id)).toEqual(["a", "b"]);
  });
});
