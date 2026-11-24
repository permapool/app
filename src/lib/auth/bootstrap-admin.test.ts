import type { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/prisma", () => ({ prisma: {} }));

import { assertBootstrapFingerprint, bootstrapAdmin, BootstrapAdminError, databaseTargetFingerprint } from "./bootstrap-admin";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";
const mock = {
  user: vi.fn(), role: vi.fn(), existing: vi.fn(), current: vi.fn(), create: vi.fn(), lock: vi.fn(), transaction: vi.fn(),
};
const tx = { userRole: { findFirst: mock.current, create: mock.create }, $queryRaw: mock.lock };
const db = {
  user: { findUnique: mock.user }, role: { findUnique: mock.role },
  userRole: { findFirst: mock.existing },
  $transaction: mock.transaction,
} as unknown as PrismaClient;
const verify = (_url: string, environment: "dev" | "staging") => ({ environment, fingerprint: "ac9b903f9d" });

function run(confirm: boolean, userId = USER_ID) {
  return bootstrapAdmin({ userId, confirm, environment: "dev", databaseUrl: "opaque-test-url" }, db, verify);
}

beforeEach(() => {
  for (const fn of Object.values(mock)) fn.mockReset();
  mock.user.mockResolvedValue({ id: USER_ID, username: "host", displayName: "Host" });
  mock.role.mockResolvedValue({ id: "admin-role-id" });
  mock.existing.mockResolvedValue(null);
  mock.current.mockResolvedValue(null);
  mock.transaction.mockImplementation(async (callback) => callback(tx));
});

describe("first-admin bootstrap", () => {
  it("rejects production, unknown, or mismatched targets before querying", async () => {
    expect(() => assertBootstrapFingerprint("4665a50695", "dev")).toThrowError(BootstrapAdminError);
    expect(() => assertBootstrapFingerprint("unknown", "dev")).toThrowError(BootstrapAdminError);
    expect(() => assertBootstrapFingerprint("f2f26606bf", "dev")).toThrowError(BootstrapAdminError);
    expect(assertBootstrapFingerprint("ac9b903f9d", "dev")).toEqual({ environment: "dev", fingerprint: "ac9b903f9d" });
    expect(assertBootstrapFingerprint("f2f26606bf", "staging")).toEqual({ environment: "staging", fingerprint: "f2f26606bf" });
    await expect(bootstrapAdmin({ userId: USER_ID, confirm: true, environment: "dev", databaseUrl: "postgresql://user:secret@unknown.example/db" }, db)).rejects.toMatchObject({ code: "UNSAFE_DATABASE" });
    expect(mock.user).not.toHaveBeenCalled();
  });

  it("fingerprints only target metadata and rejects malformed URLs", () => {
    expect(databaseTargetFingerprint("postgresql://private:secret@example.test/database?sslmode=require"))
      .toBe(databaseTargetFingerprint("postgresql://other:password@example.test/database"));
    expect(() => databaseTargetFingerprint("not-a-url")).toThrowError(BootstrapAdminError);
  });

  it("requires an existing explicit UUID target", async () => {
    await expect(run(true, "first-user")).rejects.toMatchObject({ code: "INVALID_USER_ID" });
    mock.user.mockResolvedValueOnce(null);
    await expect(run(true)).rejects.toMatchObject({ code: "TARGET_NOT_FOUND" });
    expect(mock.transaction).not.toHaveBeenCalled();
  });

  it("requires the exact seeded admin role", async () => {
    mock.role.mockResolvedValueOnce(null);
    await expect(run(true)).rejects.toMatchObject({ code: "ADMIN_ROLE_MISSING" });
    expect(mock.transaction).not.toHaveBeenCalled();
  });

  it("resolves the safe target and makes no write without confirmation", async () => {
    const result = await run(false);
    expect(result).toMatchObject({ result: "preview", targetUserId: USER_ID, username: "host", displayName: "Host" });
    expect(mock.user).toHaveBeenCalledWith({ where: { id: USER_ID }, select: { id: true, username: true, displayName: true } });
    expect(mock.transaction).not.toHaveBeenCalled();
    expect(mock.create).not.toHaveBeenCalled();
  });

  it("creates exactly one admin UserRole under a transaction lock", async () => {
    const result = await run(true);
    expect(result.result).toBe("assigned");
    expect(mock.lock).toHaveBeenCalledOnce();
    expect(mock.create).toHaveBeenCalledOnce();
    expect(mock.create).toHaveBeenCalledWith({ data: { userId: USER_ID, roleId: "admin-role-id" } });
  });

  it("refuses a second admin and safely recognizes the same existing admin", async () => {
    mock.existing.mockResolvedValueOnce({ userId: OTHER_ID });
    await expect(run(true)).rejects.toMatchObject({ code: "ADMIN_EXISTS" });
    mock.existing.mockResolvedValueOnce({ userId: USER_ID });
    expect((await run(true)).result).toBe("already_admin");
    expect(mock.create).not.toHaveBeenCalled();
  });

  it("rechecks under the lock to reject a concurrent first-admin assignment", async () => {
    mock.current.mockResolvedValueOnce({ userId: OTHER_ID });
    await expect(run(true)).rejects.toMatchObject({ code: "ADMIN_EXISTS" });
    expect(mock.create).not.toHaveBeenCalled();
  });
});
