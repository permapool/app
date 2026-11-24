import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ token: vi.fn(), privy: vi.fn(), sync: vi.fn() }));
vi.mock("~/lib/auth/privy-server", () => ({ getAccessTokenFromRequest: mock.token, getVerifiedPrivyUser: mock.privy }));
vi.mock("~/lib/auth/sync-user", () => ({ syncPrivyUser: mock.sync }));

import { GET } from "./route";

beforeEach(() => {
  mock.token.mockReturnValue("token");
  mock.privy.mockResolvedValue({ id: "privy-id" });
  mock.sync.mockReset();
});

describe("/api/auth/session role refresh", () => {
  it("resolves database roles on each request after grant and revoke", async () => {
    mock.sync.mockResolvedValueOnce({ userId: "user-id", roles: [{ id: "role-id", name: "producer" }] });
    mock.sync.mockResolvedValueOnce({ userId: "user-id", roles: [] });
    const request = new Request("https://higher.zip/api/auth/session", { headers: { authorization: "Bearer token" } });
    const granted = await GET(request as Parameters<typeof GET>[0]);
    const revoked = await GET(request as Parameters<typeof GET>[0]);
    expect((await granted.json()).roles.map((role: { name: string }) => role.name)).toEqual(["producer"]);
    expect((await revoked.json()).roles).toEqual([]);
    expect(mock.sync).toHaveBeenCalledTimes(2);
  });
});
