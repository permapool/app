import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ list: vi.fn(), set: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("~/lib/auth/producer-role-admin", () => ({ listUsersForProducerAccess: mock.list, setProducerRole: mock.set }));
vi.mock("~/lib/auth/authorization", () => ({
  AuthorizationError: class AuthorizationError extends Error {
    code: string;
    status: number;
    constructor(code: string) { super(code); this.code = code; this.status = code === "AUTH_REQUIRED" ? 401 : code === "FORBIDDEN" ? 403 : 404; }
  },
}));

import { AuthorizationError } from "~/lib/auth/authorization";
import { GET } from "./route";
import { PUT, DELETE } from "./[userId]/producer/route";

const TARGET = "11111111-1111-4111-8111-111111111111";
const request = () => new Request("https://higher.zip/api/admin/users", { headers: { authorization: "Bearer token" } });
const context = { params: Promise.resolve({ userId: TARGET }) };

beforeEach(() => {
  mock.list.mockReset();
  mock.set.mockReset();
});

describe("admin producer routes", () => {
  it("returns safe user listing", async () => {
    mock.list.mockResolvedValue([{ userId: TARGET, username: "host", displayName: "Host", roles: [] }]);
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ users: [{ userId: TARGET, username: "host", displayName: "Host", roles: [] }] });
  });

  it.each([["AUTH_REQUIRED", 401], ["FORBIDDEN", 403]])("rejects %s on listing and mutations", async (code, status) => {
    mock.list.mockRejectedValueOnce(new AuthorizationError(code as "AUTH_REQUIRED" | "FORBIDDEN"));
    mock.set.mockRejectedValue(new AuthorizationError(code as "AUTH_REQUIRED" | "FORBIDDEN"));
    for (const response of [await GET(request()), await PUT(request(), context), await DELETE(request(), context)]) {
      expect(response.status).toBe(status);
      expect(await response.json()).toEqual({ error: code });
    }
  });

  it("grants and revokes only producer for a URL target, ignoring client role claims", async () => {
    mock.set.mockResolvedValueOnce({ userId: TARGET, producer: true }).mockResolvedValueOnce({ userId: TARGET, producer: false });
    const claimed = new Request("https://higher.zip/api/admin/users", {
      method: "PUT", headers: { "Content-Type": "application/json", "x-actor-user-id": "spoofed" },
      body: JSON.stringify({ role: "admin", actorUserId: "spoofed" }),
    });
    expect((await PUT(claimed, context)).status).toBe(200);
    expect((await DELETE(request(), context)).status).toBe(200);
    expect(mock.set.mock.calls.map((call) => call.slice(1))).toEqual([[TARGET, true], [TARGET, false]]);
  });

  it("maps missing target to 404 without leaking provider details", async () => {
    mock.set.mockRejectedValueOnce(new AuthorizationError("NOT_FOUND"));
    const response = await PUT(request(), context);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "NOT_FOUND" });
  });
});
