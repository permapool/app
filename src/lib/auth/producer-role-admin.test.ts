import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  requireAdmin: vi.fn(), findMany: vi.fn(), findUser: vi.fn(), findRole: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("~/lib/auth/authorization", () => ({
  requireAdmin: mock.requireAdmin,
  AuthorizationError: class AuthorizationError extends Error {
    code: string;
    status: number;
    constructor(code: string) { super(code); this.code = code; this.status = code === "AUTH_REQUIRED" ? 401 : code === "FORBIDDEN" ? 403 : 404; }
  },
}));
vi.mock("~/lib/prisma", () => ({ prisma: {
  user: { findMany: mock.findMany, findUnique: mock.findUser },
  role: { findUnique: mock.findRole },
  userRole: { upsert: mock.upsert, deleteMany: mock.deleteMany },
} }));

import { listUsersForProducerAccess, setProducerRole } from "./producer-role-admin";

const TARGET = "11111111-1111-4111-8111-111111111111";
const request = (path = "/api/admin/users") => new Request(`https://higher.zip${path}`, { headers: { authorization: "Bearer token", "x-actor-user-id": TARGET } });

beforeEach(() => {
  for (const fn of Object.values(mock)) fn.mockReset();
  mock.requireAdmin.mockResolvedValue({ userId: "real-admin-id" });
  mock.findUser.mockResolvedValue({ id: TARGET });
  mock.findRole.mockResolvedValue({ id: "producer-role-id" });
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});

describe("producer role administration", () => {
  it("lists at most 25 searched users with only safe operational fields", async () => {
    mock.findMany.mockResolvedValue([{ id: TARGET, username: "host", displayName: "Host", email: "private@example.test", privyId: "private-id", wallets: [{ address: "private-wallet" }], userRoles: [{ role: { name: "producer" }, id: "assignment-id" }] }]);
    const users = await listUsersForProducerAccess(request("/api/admin/users?query=HoSt"));
    expect(users).toEqual([{ userId: TARGET, username: "host", displayName: "Host", roles: ["producer"] }]);
    expect(JSON.stringify(users)).not.toMatch(/email|privyId|wallets|address|assignment-id|private/);
    expect(mock.findMany.mock.calls[0][0]).toMatchObject({ take: 25, where: { OR: [{ username: { contains: "HoSt" } }, { displayName: { contains: "HoSt" } }] } });
    expect(JSON.stringify(mock.findMany.mock.calls[0][0].select)).not.toMatch(/email|privyId|wallets|address/);
  });

  it("grants producer idempotently using the authenticated actor and exact role", async () => {
    await setProducerRole(request(), TARGET, true);
    await setProducerRole(request(), TARGET, true);
    expect(mock.upsert).toHaveBeenCalledTimes(2);
    expect(mock.upsert).toHaveBeenCalledWith({ where: { userId_roleId: { userId: TARGET, roleId: "producer-role-id" } }, create: { userId: TARGET, roleId: "producer-role-id" }, update: {} });
    expect(mock.findRole).toHaveBeenCalledWith({ where: { name: "producer" }, select: { id: true } });
    expect(mock.requireAdmin).toHaveBeenCalledTimes(2);
    expect(mock.deleteMany).not.toHaveBeenCalled();
  });

  it("revokes only the producer UserRole and safely repeats", async () => {
    await setProducerRole(request(), TARGET, false);
    await setProducerRole(request(), TARGET, false);
    expect(mock.deleteMany).toHaveBeenCalledTimes(2);
    expect(mock.deleteMany).toHaveBeenCalledWith({ where: { userId: TARGET, roleId: "producer-role-id" } });
    expect(mock.upsert).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND for missing or malformed targets", async () => {
    mock.findUser.mockResolvedValueOnce(null);
    await expect(setProducerRole(request(), TARGET, true)).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    await expect(setProducerRole(request(), "not-a-uuid", true)).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    expect(mock.upsert).not.toHaveBeenCalled();
  });

  it.each([["AUTH_REQUIRED", 401], ["FORBIDDEN", 403]])("denies %s before any database operation", async (code, status) => {
    mock.requireAdmin.mockRejectedValueOnce(Object.assign(new Error(code), { code, status }));
    await expect(setProducerRole(request(), TARGET, true)).rejects.toMatchObject({ code, status });
    expect(mock.findUser).not.toHaveBeenCalled();
    expect(mock.upsert).not.toHaveBeenCalled();
  });
});
