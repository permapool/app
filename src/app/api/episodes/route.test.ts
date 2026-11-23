import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("~/lib/episodes/create", () => ({
  createHostedEpisode: mock.create,
  EpisodeConflictError: class EpisodeConflictError extends Error {},
}));

import { AuthorizationError } from "~/lib/auth/authorization";
import { EpisodeConflictError } from "~/lib/episodes/create";
import { EpisodeValidationError } from "~/lib/episodes/schedule";
import { episodeErrorResponse } from "~/lib/episodes/api-error";
import { POST } from "./route";

function request(body: unknown) {
  return new Request("https://higher.zip/api/episodes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/episodes", () => {
  beforeEach(() => mock.create.mockReset());

  it("returns navigation data for a newly created Episode", async () => {
    const episode = {
      episodeId: "episode-id",
      slug: "community-session-id",
      path: "/episodes/community-session-id",
      state: "SCHEDULED",
      scheduledStartAt: "2030-07-10T23:30:00.000Z",
      timezone: "America/New_York",
    };
    mock.create.mockResolvedValue({ episode, created: true });

    const response = await POST(request({ title: "Community session" }));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(episode);
    expect(mock.create).toHaveBeenCalledWith(expect.any(Request), { title: "Community session" });
  });

  it("returns the same Episode on an idempotent retry", async () => {
    mock.create.mockResolvedValue({ episode: { episodeId: "same-id" }, created: false });

    const response = await POST(request({ title: "Community session" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ episodeId: "same-id" });
  });

  it("maps authorization errors to stable HTTP responses", async () => {
    for (const [code, status] of [
      ["AUTH_REQUIRED", 401],
      ["FORBIDDEN", 403],
      ["NOT_FOUND", 404],
    ] as const) {
      const response = episodeErrorResponse(new AuthorizationError(code));
      expect(response?.status).toBe(status);
      expect(await response?.json()).toEqual({ error: code });
    }
  });

  it("returns safe validation and conflict responses", async () => {
    mock.create.mockRejectedValueOnce(new EpisodeValidationError("Enter a title."));
    mock.create.mockRejectedValueOnce(new EpisodeConflictError());

    const validation = await POST(request({}));
    expect(validation.status).toBe(400);
    expect(await validation.json()).toEqual({ error: "VALIDATION_ERROR", message: "Enter a title." });

    const conflict = await POST(request({}));
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toEqual({ error: "CONFLICT" });
  });

  it("rejects malformed JSON before calling the creation service", async () => {
    const response = await POST(new Request("https://higher.zip/api/episodes", {
      method: "POST",
      body: "{",
    }));

    expect(response.status).toBe(400);
    expect(mock.create).not.toHaveBeenCalled();
  });
});
