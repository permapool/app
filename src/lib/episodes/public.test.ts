import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ findUnique: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("~/lib/prisma", () => ({ prisma: { episode: { findUnique: mock.findUnique } } }));

import { getPublicEpisodeBySlug } from "./public";

function person(id: string, username: string, displayName: string | null) {
  return {
    id,
    username,
    displayName,
    email: "private@example.test",
    privyId: "private-privy-id",
    wallets: [{ address: "0xprivate" }],
    userRoles: [{ roleId: "private-role-id" }],
  };
}

function episode(overrides: Record<string, unknown> = {}) {
  return {
    id: "episode-id",
    slug: "community-gathering-uuid",
    title: "Community Gathering",
    shortDescription: "Join the room",
    scheduledStartAt: new Date("2030-07-10T23:30:00.000Z"),
    timezone: "America/New_York",
    state: "SCHEDULED",
    publicJoinUrl: "https://meet.example.com/room",
    youtubeBroadcastId: null,
    producers: [{ user: person("direct-id", "direct", "Direct Host") }],
    show: null,
    ...overrides,
  };
}

describe("getPublicEpisodeBySlug", () => {
  beforeEach(() => mock.findUnique.mockReset());

  it("returns a standalone scheduled Episode without requiring a video or Show", async () => {
    mock.findUnique.mockResolvedValue(episode());

    const result = await getPublicEpisodeBySlug("community-gathering-uuid");

    expect(result).toMatchObject({
      id: "episode-id",
      slug: "community-gathering-uuid",
      title: "Community Gathering",
      scheduledStartAt: "2030-07-10T23:30:00.000Z",
      timezone: "America/New_York",
      show: null,
      publicJoinUrl: "https://meet.example.com/room",
      path: "/episodes/community-gathering-uuid",
      hosts: [{ username: "direct", displayName: "Direct Host" }],
    });
    expect(JSON.stringify(mock.findUnique.mock.calls[0][0].select)).not.toContain("youtubeBroadcastId");
  });

  it("returns null for an unknown slug", async () => {
    mock.findUnique.mockResolvedValue(null);

    await expect(getPublicEpisodeBySlug("unknown")).resolves.toBeNull();
  });

  it("includes Show details and deduplicates direct and recurring hosts", async () => {
    mock.findUnique.mockResolvedValue(episode({
      producers: [{ user: person("same-id", "same", "Same Host") }],
      show: {
        id: "show-id",
        slug: "community-hour",
        title: "Community Hour",
        producers: [
          { user: person("same-id", "same", "Same Host") },
          { user: person("show-id-2", "show-host", null) },
        ],
      },
      unrelatedProducer: person("outsider", "outsider", null),
    }));

    const result = await getPublicEpisodeBySlug("community-gathering-uuid");

    expect(result?.show).toEqual({ id: "show-id", slug: "community-hour", title: "Community Hour" });
    expect(result?.hosts).toEqual([
      { username: "same", displayName: "Same Host" },
      { username: "show-host", displayName: null },
    ]);
    expect(JSON.stringify(result)).not.toContain("outsider");
  });

  it("does not return private user, role, or assignment fields", async () => {
    mock.findUnique.mockResolvedValue(episode());

    const result = await getPublicEpisodeBySlug("community-gathering-uuid");
    const publicJson = JSON.stringify(result);

    for (const privateField of ["email", "privyId", "wallets", "userRoles", "roleId", "userId", "private-privy-id", "0xprivate"]) {
      expect(publicJson).not.toContain(privateField);
    }
    const selection = JSON.stringify(mock.findUnique.mock.calls[0][0].select);
    for (const privateField of ["email", "privyId", "wallets", "userRoles"]) {
      expect(selection).not.toContain(privateField);
    }
  });

  it("rejects unsafe persisted join URLs from the public projection", async () => {
    mock.findUnique.mockResolvedValue(episode({ publicJoinUrl: "javascript:alert(1)" }));

    const result = await getPublicEpisodeBySlug("community-gathering-uuid");

    expect(result?.publicJoinUrl).toBeNull();
  });
});
