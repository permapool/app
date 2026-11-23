import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  access: vi.fn(),
  shows: vi.fn(),
  episodes: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/lib/auth/authorization", () => ({
  requireProducerAreaAccess: mock.access,
  AuthorizationError: class AuthorizationError extends Error {
    code: string;
    status: number;
    constructor(code: string, status = 403) {
      super(code);
      this.code = code;
      this.status = status;
    }
  },
}));
vi.mock("~/lib/prisma", () => ({
  prisma: {
    show: { findMany: mock.shows },
    episode: { findMany: mock.episodes },
  },
}));

import { AuthorizationError } from "~/lib/auth/authorization";
import { GET } from "./route";

const request = new Request("https://higher.zip/api/me/sessions");

describe("GET /api/me/sessions", () => {
  beforeEach(() => {
    mock.access.mockReset();
    mock.shows.mockReset();
    mock.episodes.mockReset();
    mock.shows.mockResolvedValue([{ id: "show-id", title: "Gatherings" }]);
    mock.episodes.mockResolvedValue([{
      id: "episode-id",
      slug: "gathering-id",
      title: "Gathering",
      scheduledStartAt: new Date("2030-07-10T23:30:00.000Z"),
      timezone: "America/New_York",
      state: "SCHEDULED",
      show: { title: "Gatherings" },
    }]);
  });

  it("scopes producer Shows and Episodes to direct or inherited assignments", async () => {
    mock.access.mockResolvedValue({ userId: "producer-id", roles: [{ name: "producer" }] });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.episodes[0]).toMatchObject({
      title: "Gathering",
      path: "/episodes/gathering-id",
      scheduledStartAt: "2030-07-10T23:30:00.000Z",
      timezone: "America/New_York",
      show: { title: "Gatherings" },
    });
    expect(mock.shows.mock.calls[0][0].where).toMatchObject({
      archivedAt: null,
      producers: { some: { userId: "producer-id" } },
    });
    const where = mock.episodes.mock.calls[0][0].where;
    expect(JSON.stringify(where)).toContain('"producers":{"some":{"userId":"producer-id"}}');
    expect(JSON.stringify(where)).toContain('"show":{"producers":{"some":{"userId":"producer-id"}}}');
  });

  it("lets admins list all upcoming Episodes and active Shows", async () => {
    mock.access.mockResolvedValue({ userId: "admin-id", roles: [{ name: "admin" }] });

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mock.shows.mock.calls[0][0].where).toEqual({ archivedAt: null });
    expect(JSON.stringify(mock.episodes.mock.calls[0][0].where)).not.toContain("admin-id");
  });

  it("returns stable authorization errors without querying Episodes", async () => {
    mock.access.mockRejectedValue(new AuthorizationError("FORBIDDEN"));

    const response = await GET(request);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "FORBIDDEN" });
    expect(mock.episodes).not.toHaveBeenCalled();
  });
});
