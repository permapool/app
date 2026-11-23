import { describe, expect, it } from "vitest";
import { parseScheduledStart } from "./schedule";

const now = new Date("2026-11-23T12:00:00.000Z");

describe("parseScheduledStart", () => {
  it("converts a local time to an instant while preserving the caller's timezone separately", () => {
    const instant = parseScheduledStart(
      { date: "2030-07-10", time: "19:30", timezone: "America/New_York" },
      now,
    );

    expect(instant.toISOString()).toBe("2030-07-10T23:30:00.000Z");
  });

  it.each([
    { date: "2030-02-30", time: "19:30", timezone: "UTC" },
    { date: "2030-07-10", time: "25:00", timezone: "UTC" },
    { date: "07/10/2030", time: "19:30", timezone: "UTC" },
  ])("rejects malformed date or time (%j)", (input) => {
    expect(() => parseScheduledStart(input, now)).toThrow("Enter a valid date and time.");
  });

  it("rejects invalid timezones", () => {
    expect(() => parseScheduledStart(
      { date: "2030-07-10", time: "19:30", timezone: "Not/A_Zone" },
      now,
    )).toThrow("Enter a valid IANA timezone.");
  });

  it("rejects past scheduling times", () => {
    expect(() => parseScheduledStart(
      { date: "2026-11-22", time: "19:30", timezone: "UTC" },
      now,
    )).toThrow("Choose a future start time.");
  });

  it("rejects nonexistent and repeated daylight-saving local times", () => {
    expect(() => parseScheduledStart(
      { date: "2030-03-10", time: "02:30", timezone: "America/New_York" },
      now,
    )).toThrow("does not exist");

    expect(() => parseScheduledStart(
      { date: "2030-11-03", time: "01:30", timezone: "America/New_York" },
      now,
    )).toThrow("occurs twice");
  });
});
