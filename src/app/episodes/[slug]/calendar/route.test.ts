import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  lookup: vi.fn(),
  notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/lib/episodes/public", () => ({ getPublicEpisodeBySlug: mock.lookup }));
vi.mock("next/navigation", () => ({ notFound: mock.notFound }));

import { GET } from "./route";

describe("GET /episodes/[slug]/calendar", () => {
  beforeEach(() => {
    mock.lookup.mockReset();
    vi.stubEnv("NEXT_PUBLIC_URL", "https://higher.zip");
  });

  it("downloads an unauthenticated Episode calendar event", async () => {
    mock.lookup.mockResolvedValue({
      id: "episode-id",
      slug: "gathering-uuid",
      title: "Community Gathering",
      shortDescription: "Come together",
      scheduledStartAt: "2030-07-10T23:30:00.000Z",
      timezone: "America/New_York",
      state: "SCHEDULED",
      publicJoinUrl: "https://meet.example.com/room",
      show: null,
      hosts: [],
      path: "/episodes/gathering-uuid",
    });

    const response = await GET(new Request("https://higher.zip/episodes/gathering-uuid/calendar"), {
      params: Promise.resolve({ slug: "gathering-uuid" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
    expect(response.headers.get("content-disposition")).toContain("episode-gathering-uuid.ics");
    expect((await response.text()).replace(/\r\n /g, "")).toContain("URL:https://higher.zip/episodes/gathering-uuid");
    expect(mock.lookup).toHaveBeenCalledWith("gathering-uuid");
  });

  it("404s an unknown Episode without authentication", async () => {
    mock.lookup.mockResolvedValue(null);

    await expect(GET(new Request("https://higher.zip/episodes/unknown/calendar"), {
      params: Promise.resolve({ slug: "unknown" }),
    })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
