import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppUser } from "~/types/auth";

const mock = vi.hoisted(() => ({
  currentUser: vi.fn(),
  show: vi.fn(),
  episode: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/lib/auth/get-current-user", () => ({
  getCurrentUser: mock.currentUser,
  CurrentUserAuthenticationError: class CurrentUserAuthenticationError extends Error {},
}));
vi.mock("~/lib/auth/privy-server", () => ({
  getAccessTokenFromRequest: (request: Request) =>
    request.headers.get("authorization")?.replace(/^Bearer /, "") || null,
}));
vi.mock("~/lib/prisma", () => ({
  prisma: {
    show: { findUnique: mock.show },
    episode: { findUnique: mock.episode },
  },
}));

import { CurrentUserAuthenticationError } from "./get-current-user";
import {
  AuthorizationError,
  requireAdmin,
  requireAuthenticatedUser,
  requireEpisodeAccess,
  requireEpisodeCreateAccess,
  requireProducerAreaAccess,
  requireShowAccess,
  requireShowCreateAccess,
} from "./authorization";

const USER_ID = "authenticated-user";

function user(...roles: string[]): AppUser {
  return {
    userId: USER_ID,
    privyId: "privy-user",
    email: null,
    username: "tester",
    displayName: null,
    hasCustomHandle: false,
    wallets: [],
    roles: roles.map((name, index) => ({ id: String(index), name })),
  };
}

function request(token = true): Request {
  return new Request("https://higher.zip/api/example", {
    headers: token ? { authorization: "Bearer token", "x-user-id": "spoofed-user" } : {},
  });
}

function show(assigned: boolean) {
  return { id: "11111111-1111-4111-8111-111111111111", producers: assigned ? [{ userId: USER_ID }] : [] };
}

function episode({ direct = false, viaShow = false, linked = false } = {}) {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    showId: linked ? "11111111-1111-4111-8111-111111111111" : null,
    producers: direct ? [{ userId: USER_ID }] : [],
    show: linked ? { producers: viaShow ? [{ userId: USER_ID }] : [] } : null,
  };
}

async function denied(action: Promise<unknown>, code: string, status: number) {
  await expect(action).rejects.toMatchObject({ code, status });
}

describe("Community Session authorization", () => {
  beforeEach(() => {
    mock.currentUser.mockReset();
    mock.show.mockReset();
    mock.episode.mockReset();
  });

  it("requires a bearer token without calling Privy", async () => {
    await denied(requireAuthenticatedUser(request(false)), "AUTH_REQUIRED", 401);
    expect(mock.currentUser).not.toHaveBeenCalled();
  });

  it("returns a stable error for invalid Privy authentication", async () => {
    mock.currentUser.mockRejectedValue(new CurrentUserAuthenticationError());

    await denied(requireAuthenticatedUser(request()), "AUTH_REQUIRED", 401);
    expect(mock.currentUser).toHaveBeenCalledWith(expect.any(Request));
  });

  it("does not turn a database failure into a 401", async () => {
    const failure = new Error("Database unavailable");
    mock.currentUser.mockRejectedValue(failure);

    await expect(requireAuthenticatedUser(request())).rejects.toBe(failure);
  });

  it("admin needs neither producer role nor assignment", async () => {
    const admin = user("admin");
    mock.currentUser.mockResolvedValue(admin);
    mock.show.mockResolvedValue(show(false));
    mock.episode.mockResolvedValue(episode());

    await expect(requireAdmin(request())).resolves.toBe(admin);
    await expect(requireProducerAreaAccess(request())).resolves.toBe(admin);
    await expect(requireShowCreateAccess(request())).resolves.toBe(admin);
    await expect(requireShowAccess(request(), "11111111-1111-4111-8111-111111111111")).resolves.toBe(admin);
    await expect(requireEpisodeAccess(request(), "22222222-2222-4222-8222-222222222222")).resolves.toBe(admin);
    mock.episode.mockResolvedValue(episode({ linked: true }));
    await expect(requireEpisodeAccess(request(), "22222222-2222-4222-8222-222222222222")).resolves.toBe(admin);
    await expect(requireEpisodeCreateAccess(request())).resolves.toBe(admin);
    await expect(requireEpisodeCreateAccess(request(), "11111111-1111-4111-8111-111111111111")).resolves.toBe(admin);
  });

  it("producer role alone permits area and standalone creation, not unassigned resources", async () => {
    mock.currentUser.mockResolvedValue(user("producer"));
    mock.show.mockResolvedValue(show(false));
    mock.episode.mockResolvedValue(episode());

    await expect(requireProducerAreaAccess(request())).resolves.toMatchObject({ userId: USER_ID });
    await expect(requireEpisodeCreateAccess(request())).resolves.toMatchObject({ userId: USER_ID });
    await denied(requireAdmin(request()), "FORBIDDEN", 403);
    await denied(requireShowCreateAccess(request()), "FORBIDDEN", 403);
    await denied(requireShowAccess(request(), "11111111-1111-4111-8111-111111111111"), "FORBIDDEN", 403);
    await denied(requireEpisodeAccess(request(), "22222222-2222-4222-8222-222222222222"), "FORBIDDEN", 403);
    await denied(requireEpisodeCreateAccess(request(), "11111111-1111-4111-8111-111111111111"), "FORBIDDEN", 403);
  });

  it("Show assignment grants Show, linked Episode, and linked creation access", async () => {
    mock.currentUser.mockResolvedValue(user("producer"));
    mock.show.mockResolvedValue(show(true));
    mock.episode.mockResolvedValue(episode({ linked: true, viaShow: true }));

    await expect(requireShowAccess(request(), "11111111-1111-4111-8111-111111111111")).resolves.toMatchObject({ userId: USER_ID });
    await expect(requireEpisodeAccess(request(), "22222222-2222-4222-8222-222222222222")).resolves.toMatchObject({ userId: USER_ID });
    await expect(requireEpisodeCreateAccess(request(), "11111111-1111-4111-8111-111111111111")).resolves.toMatchObject({ userId: USER_ID });
    expect(mock.show).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({ producers: expect.objectContaining({ where: { userId: USER_ID } }) }),
    }));
    expect(mock.episode).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({
        producers: expect.objectContaining({ where: { userId: USER_ID } }),
        show: expect.objectContaining({
          select: expect.objectContaining({
            producers: expect.objectContaining({ where: { userId: USER_ID } }),
          }),
        }),
      }),
    }));
  });

  it("Show assignment does not grant another Show or its Episodes", async () => {
    mock.currentUser.mockResolvedValue(user("producer"));
    mock.show.mockResolvedValue(show(false));
    mock.episode.mockResolvedValue(episode({ linked: true }));

    await denied(requireShowAccess(request(), "33333333-3333-4333-8333-333333333333"), "FORBIDDEN", 403);
    await denied(requireEpisodeAccess(request(), "44444444-4444-4444-8444-444444444444"), "FORBIDDEN", 403);
    await denied(requireEpisodeCreateAccess(request(), "33333333-3333-4333-8333-333333333333"), "FORBIDDEN", 403);
  });

  it("direct assignment grants standalone and Show-linked Episode access", async () => {
    mock.currentUser.mockResolvedValue(user("producer"));
    mock.episode.mockResolvedValueOnce(episode({ direct: true }));
    mock.episode.mockResolvedValueOnce(episode({ direct: true, linked: true }));

    await expect(requireEpisodeAccess(request(), "55555555-5555-4555-8555-555555555555")).resolves.toMatchObject({ userId: USER_ID });
    await expect(requireEpisodeAccess(request(), "66666666-6666-4666-8666-666666666666")).resolves.toMatchObject({ userId: USER_ID });
  });

  it("direct assignment does not grant unrelated Episode access", async () => {
    mock.currentUser.mockResolvedValue(user("producer"));
    mock.episode.mockResolvedValue(episode({ linked: true }));

    await denied(requireEpisodeAccess(request(), "44444444-4444-4444-8444-444444444444"), "FORBIDDEN", 403);
  });

  it.each([[], ["audience"], ["future-role"]])(
    "non-privileged roles cannot perform producer mutations (%s)",
    async (...roles) => {
      mock.currentUser.mockResolvedValue(user(...roles));
      mock.show.mockResolvedValue(show(true));
      mock.episode.mockResolvedValue(episode({ direct: true, linked: true, viaShow: true }));

      await denied(requireProducerAreaAccess(request()), "FORBIDDEN", 403);
      await denied(requireShowAccess(request(), "11111111-1111-4111-8111-111111111111"), "FORBIDDEN", 403);
      await denied(requireEpisodeAccess(request(), "22222222-2222-4222-8222-222222222222"), "FORBIDDEN", 403);
      await denied(requireEpisodeCreateAccess(request()), "FORBIDDEN", 403);
      await denied(requireEpisodeCreateAccess(request(), "11111111-1111-4111-8111-111111111111"), "FORBIDDEN", 403);
    },
  );

  it("revoking the global producer role denies existing direct and Show assignments", async () => {
    mock.currentUser.mockResolvedValue(user("audience"));
    mock.show.mockResolvedValue(show(true));
    mock.episode.mockResolvedValue(episode({ direct: true, linked: true, viaShow: true }));

    await denied(requireShowAccess(request(), "11111111-1111-4111-8111-111111111111"), "FORBIDDEN", 403);
    await denied(requireEpisodeAccess(request(), "22222222-2222-4222-8222-222222222222"), "FORBIDDEN", 403);
  });

  it("missing resources return NOT_FOUND without provider details", async () => {
    mock.currentUser.mockResolvedValue(user("producer"));
    mock.show.mockResolvedValue(null);
    mock.episode.mockResolvedValue(null);

    await denied(requireShowAccess(request(), "77777777-7777-4777-8777-777777777777"), "NOT_FOUND", 404);
    await denied(requireEpisodeAccess(request(), "88888888-8888-4888-8888-888888888888"), "NOT_FOUND", 404);
    await denied(requireEpisodeCreateAccess(request(), "77777777-7777-4777-8777-777777777777"), "NOT_FOUND", 404);
  });

  it("rejects malformed resource IDs before querying Prisma", async () => {
    mock.currentUser.mockResolvedValue(user("producer"));

    await denied(requireShowAccess(request(), "not-a-uuid"), "NOT_FOUND", 404);
    await denied(requireEpisodeAccess(request(), "not-a-uuid"), "NOT_FOUND", 404);
    await denied(requireEpisodeCreateAccess(request(), "not-a-uuid"), "NOT_FOUND", 404);
    expect(mock.show).not.toHaveBeenCalled();
    expect(mock.episode).not.toHaveBeenCalled();
  });

  it("authorization errors expose only stable public messages", () => {
    expect(new AuthorizationError("AUTH_REQUIRED").message).toBe("Authentication required");
    expect(new AuthorizationError("FORBIDDEN").message).toBe("Access denied");
    expect(new AuthorizationError("NOT_FOUND").message).toBe("Resource not found");
  });
});
