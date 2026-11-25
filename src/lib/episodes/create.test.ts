import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppUser } from "~/types/auth";

const mock = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
  createAccess: vi.fn(),
  episodeAccess: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/lib/prisma", () => ({
  prisma: { episode: { create: mock.create, findUnique: mock.findUnique } },
}));
vi.mock("~/lib/auth/authorization", () => ({
  requireEpisodeCreateAccess: mock.createAccess,
  requireEpisodeAccess: mock.episodeAccess,
  AuthorizationError: class AuthorizationError extends Error {},
}));

import { createHostedEpisode, EpisodeConflictError, parseCreateEpisodeInput } from "./create";

const REQUEST_ID = "11111111-1111-4111-8111-111111111111";
const SHOW_ID = "22222222-2222-4222-8222-222222222222";
const START = new Date("2030-07-10T23:30:00.000Z");
const request = new Request("https://higher.zip/api/episodes", { method: "POST" });

function user(...roles: string[]): AppUser {
  return {
    userId: "creator-id",
    privyId: "privy-id",
    email: null,
    username: "host",
    displayName: null,
    hasCustomHandle: false,
    wallets: [],
    roles: roles.map((name, index) => ({ id: String(index), name })),
  };
}

function input(overrides: Record<string, unknown> = {}) {
  return {
    requestId: REQUEST_ID,
    title: "Friday Community Gathering",
    date: "2030-07-10",
    time: "19:30",
    timezone: "America/New_York",
    shortDescription: "Come together",
    publicJoinUrl: "https://meet.example.com/room",
    showId: null,
    ...overrides,
  };
}

function persisted(overrides: Record<string, unknown> = {}) {
  return {
    id: REQUEST_ID,
    slug: "friday-community-gathering-11111111111141118111111111111111",
    title: "Friday Community Gathering",
    shortDescription: "Come together",
    scheduledStartAt: START,
    timezone: "America/New_York",
    state: "SCHEDULED",
    publicJoinUrl: "https://meet.example.com/room",
    showId: null,
    ...overrides,
  };
}

describe("createHostedEpisode", () => {
  beforeEach(() => {
    mock.create.mockReset();
    mock.findUnique.mockReset();
    mock.createAccess.mockReset();
    mock.episodeAccess.mockReset();
    mock.create.mockResolvedValue(persisted());
  });

  it("atomically assigns a standalone producer to the new scheduled Episode", async () => {
    mock.createAccess.mockResolvedValue(user("producer"));

    const result = await createHostedEpisode(request, input());

    expect(mock.createAccess).toHaveBeenCalledWith(request, null);
    expect(mock.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        id: REQUEST_ID,
        slug: persisted().slug,
        showId: null,
        state: "SCHEDULED",
        youtubeBroadcastId: null,
        timezone: "America/New_York",
        scheduledStartAt: START,
        producers: { create: { userId: "creator-id" } },
      }),
    }));
    expect(result).toEqual({
      created: true,
      episode: {
        episodeId: REQUEST_ID,
        slug: persisted().slug,
        path: `/episodes/${persisted().slug}`,
        state: "SCHEDULED",
        scheduledStartAt: START.toISOString(),
        timezone: "America/New_York",
      },
    });
  });

  it("atomically assigns an admin as host of their standalone Episode", async () => {
    mock.createAccess.mockResolvedValue(user("admin"));

    await createHostedEpisode(request, input());

    expect(mock.create.mock.calls[0][0].data.producers).toEqual({ create: { userId: "creator-id" } });
  });

  it("keeps a Show-linked Episode attached without adding a direct producer assignment", async () => {
    mock.createAccess.mockResolvedValue(user("producer"));

    await createHostedEpisode(request, input({ showId: SHOW_ID }));

    expect(mock.createAccess).toHaveBeenCalledWith(request, SHOW_ID);
    expect(mock.create.mock.calls[0][0].data).toMatchObject({ showId: SHOW_ID });
    expect(mock.create.mock.calls[0][0].data.producers).toBeUndefined();
  });

  it("does not write when audience, unauthenticated, or an unassigned producer is denied", async () => {
    for (const code of ["FORBIDDEN", "AUTH_REQUIRED", "FORBIDDEN"]) {
      mock.createAccess.mockRejectedValueOnce(new Error(code));
      await expect(createHostedEpisode(request, input())).rejects.toThrow(code);
    }

    expect(mock.create).not.toHaveBeenCalled();
  });

  it("returns the existing Episode for a retry with the same request ID and payload", async () => {
    mock.createAccess.mockResolvedValue(user("producer"));
    mock.create.mockRejectedValue({ code: "P2002" });
    mock.findUnique.mockResolvedValue(persisted());
    mock.episodeAccess.mockResolvedValue(user("producer"));

    const result = await createHostedEpisode(request, input());

    expect(result.created).toBe(false);
    expect(result.episode.episodeId).toBe(REQUEST_ID);
    expect(mock.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: REQUEST_ID } }));
    expect(mock.episodeAccess).toHaveBeenCalledWith(request, REQUEST_ID);
  });

  it("rejects changed-payload or unrelated-ID conflicts without a second write", async () => {
    mock.createAccess.mockResolvedValue(user("producer"));
    mock.create.mockRejectedValue({ code: "P2002" });
    mock.findUnique.mockResolvedValueOnce(persisted({ title: "Different session" }));
    mock.findUnique.mockResolvedValueOnce(null);

    await expect(createHostedEpisode(request, input())).rejects.toBeInstanceOf(EpisodeConflictError);
    await expect(createHostedEpisode(request, input())).rejects.toBeInstanceOf(EpisodeConflictError);
    expect(mock.episodeAccess).not.toHaveBeenCalled();
  });
});

describe("parseCreateEpisodeInput", () => {
  const now = new Date("2026-11-23T12:00:00.000Z");

  it.each([
    [{ ...input(), title: "" }, "title"],
    [{ ...input(), shortDescription: "" }, "short description"],
    [{ ...input(), date: "2030-02-30" }, "date and time"],
    [{ ...input(), date: "2020-01-01" }, "future"],
    [{ ...input(), timezone: "Invalid/Zone" }, "timezone"],
    [{ ...input(), publicJoinUrl: "ftp://example.com" }, "HTTP or HTTPS"],
    [{ ...input(), publicJoinUrl: "not a URL" }, "HTTP or HTTPS"],
  ])("rejects invalid fields", (body, message) => {
    expect(() => parseCreateEpisodeInput(body, now)).toThrow(message as string);
  });

  it("retains the source timezone and correct normalized instant", () => {
    const parsed = parseCreateEpisodeInput(input(), now);

    expect(parsed.timezone).toBe("America/New_York");
    expect(parsed.scheduledStartAt.toISOString()).toBe(START.toISOString());
  });
});
