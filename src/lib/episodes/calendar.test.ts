import { describe, expect, it } from "vitest";
import type { PublicEpisode } from "./public";
import { DEFAULT_EPISODE_DURATION_MINUTES, episodeCalendarIcs } from "./calendar";

const episode: PublicEpisode = {
  id: "episode-id",
  slug: "gathering-uuid",
  title: "Community, Gathering; Café",
  shortDescription: "Come together",
  scheduledStartAt: "2030-07-10T23:30:00.000Z",
  timezone: "America/New_York",
  state: "SCHEDULED",
  publicJoinUrl: "https://meet.example.com/room",
  show: null,
  hosts: [],
  path: "/episodes/gathering-uuid",
};

describe("episodeCalendarIcs", () => {
  it("returns a folded, UTC-based calendar event with join and canonical URLs", () => {
    const ics = episodeCalendarIcs(
      episode,
      "https://higher.zip/episodes/gathering-uuid",
      new Date("2026-11-23T12:00:00.000Z"),
    );
    const unfolded = ics.replace(/\r\n /g, "");

    expect(DEFAULT_EPISODE_DURATION_MINUTES).toBe(60);
    expect(unfolded).toContain("BEGIN:VCALENDAR\r\nVERSION:2.0");
    expect(unfolded).toContain("DTSTART:20300710T233000Z");
    expect(unfolded).toContain("DTEND:20300711T003000Z");
    expect(unfolded).toContain("SUMMARY:Community\\, Gathering\\; Café");
    expect(unfolded).toContain("Host timezone: America/New_York");
    expect(unfolded).toContain("Join: https://meet.example.com/room");
    expect(unfolded).toContain("LOCATION:https://meet.example.com/room");
    expect(unfolded).toContain("URL:https://higher.zip/episodes/gathering-uuid");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    for (const line of ics.split("\r\n")) {
      expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    }
  });

  it("marks cancelled sessions without removing the calendar event", () => {
    const ics = episodeCalendarIcs({ ...episode, state: "CANCELLED" }, "https://higher.zip/episodes/gathering-uuid");

    expect(ics).toContain("STATUS:CANCELLED");
  });
});
