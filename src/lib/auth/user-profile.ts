import type { Prisma, PrismaClient } from "@prisma/client";

const USERNAME_PREFIX = "anon";
const USERNAME_ATTEMPTS = 100;

type PrismaLikeClient = PrismaClient | Prisma.TransactionClient;

function randomDigits() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export async function generateUniqueUsername(prisma: PrismaLikeClient) {
  for (let attempt = 0; attempt < USERNAME_ATTEMPTS; attempt += 1) {
    const username = `${USERNAME_PREFIX}${randomDigits()}`;
    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!existing) {
      return username;
    }
  }

  throw new Error("Unable to generate a unique username");
}

export function isUniqueConstraintError(
  error: unknown,
  target?: string,
): error is Prisma.PrismaClientKnownRequestError {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    error.code !== "P2002"
  ) {
    return false;
  }

  if (!target) {
    return true;
  }

  const meta =
    "meta" in error && typeof error.meta === "object" && error.meta !== null
      ? (error.meta as { target?: string | string[] })
      : undefined;
  const fields = Array.isArray(meta?.target)
    ? meta.target
    : typeof meta?.target === "string"
      ? [meta.target]
      : [];

  return fields.includes(target);
}
