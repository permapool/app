import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

export type BootstrapEnvironment = "dev" | "staging";
export type BootstrapResult = {
  result: "preview" | "assigned" | "already_admin";
  environment: BootstrapEnvironment;
  fingerprint: string;
  targetUserId: string;
  username: string;
  displayName: string | null;
};

// SHA-256 of lowercase host + database path. These are the verified isolated
// Neon targets; an endpoint change must be reviewed before this script writes.
const TARGET_FINGERPRINTS = {
  production: "4665a50695",
  staging: "f2f26606bf",
  dev: "ac9b903f9d",
} as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class BootstrapAdminError extends Error {
  constructor(readonly code: "INVALID_USER_ID" | "UNSAFE_DATABASE" | "TARGET_NOT_FOUND" | "ADMIN_ROLE_MISSING" | "ADMIN_EXISTS") {
    super(code);
    this.name = "BootstrapAdminError";
  }
}

export function databaseTargetFingerprint(databaseUrl: string): string {
  try {
    const url = new URL(databaseUrl);
    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") throw new Error();
    return createHash("sha256").update(`${url.hostname.toLowerCase()}${url.pathname}`).digest("hex").slice(0, 10);
  } catch {
    throw new BootstrapAdminError("UNSAFE_DATABASE");
  }
}

export function assertBootstrapFingerprint(fingerprint: string, environment: BootstrapEnvironment): { environment: BootstrapEnvironment; fingerprint: string } {
  if (fingerprint === TARGET_FINGERPRINTS.production || fingerprint !== TARGET_FINGERPRINTS[environment]) {
    throw new BootstrapAdminError("UNSAFE_DATABASE");
  }
  return { environment, fingerprint };
}

export function assertBootstrapEnvironment(databaseUrl: string, environment: BootstrapEnvironment) {
  return assertBootstrapFingerprint(databaseTargetFingerprint(databaseUrl), environment);
}

export async function bootstrapAdmin(
  options: { userId: string; confirm: boolean; environment: BootstrapEnvironment; databaseUrl: string },
  db: PrismaClient,
  verifyEnvironment = assertBootstrapEnvironment,
): Promise<BootstrapResult> {
  const target = verifyEnvironment(options.databaseUrl, options.environment);
  if (!UUID_PATTERN.test(options.userId)) throw new BootstrapAdminError("INVALID_USER_ID");

  const user = await db.user.findUnique({
    where: { id: options.userId },
    select: { id: true, username: true, displayName: true },
  });
  if (!user) throw new BootstrapAdminError("TARGET_NOT_FOUND");

  const role = await db.role.findUnique({ where: { name: "admin" }, select: { id: true } });
  if (!role) throw new BootstrapAdminError("ADMIN_ROLE_MISSING");

  const existing = await db.userRole.findFirst({ where: { roleId: role.id }, select: { userId: true } });
  if (existing && existing.userId !== user.id) throw new BootstrapAdminError("ADMIN_EXISTS");

  const base = { ...target, targetUserId: user.id, username: user.username, displayName: user.displayName };
  if (existing) return { ...base, result: "already_admin" };
  if (!options.confirm) return { ...base, result: "preview" };

  return db.$transaction(async (tx) => {
    // Serialize concurrent first-admin attempts across processes.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(694762806)`;
    const current = await tx.userRole.findFirst({ where: { roleId: role.id }, select: { userId: true } });
    if (current && current.userId !== user.id) throw new BootstrapAdminError("ADMIN_EXISTS");
    if (current) return { ...base, result: "already_admin" };
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    return { ...base, result: "assigned" };
  });
}
