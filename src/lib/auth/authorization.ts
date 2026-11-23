import "server-only";

import { CurrentUserAuthenticationError, getCurrentUser } from "~/lib/auth/get-current-user";
import { getAccessTokenFromRequest } from "~/lib/auth/privy-server";
import { hasRole } from "~/lib/auth/roles";
import { prisma } from "~/lib/prisma";
import type { AppUser } from "~/types/auth";

export type AuthorizationErrorCode = "AUTH_REQUIRED" | "FORBIDDEN" | "NOT_FOUND";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ERROR_DETAILS: Record<AuthorizationErrorCode, { message: string; status: number }> = {
  AUTH_REQUIRED: { message: "Authentication required", status: 401 },
  FORBIDDEN: { message: "Access denied", status: 403 },
  NOT_FOUND: { message: "Resource not found", status: 404 },
};

export class AuthorizationError extends Error {
  readonly code: AuthorizationErrorCode;
  readonly status: number;

  constructor(code: AuthorizationErrorCode) {
    super(ERROR_DETAILS[code].message);
    this.name = "AuthorizationError";
    this.code = code;
    this.status = ERROR_DETAILS[code].status;
  }
}

function requireResourceId(id: string) {
  if (!UUID_PATTERN.test(id)) {
    throw new AuthorizationError("NOT_FOUND");
  }
}

export async function requireAuthenticatedUser(request: Request): Promise<AppUser> {
  if (!getAccessTokenFromRequest(request)) {
    throw new AuthorizationError("AUTH_REQUIRED");
  }

  try {
    return await getCurrentUser(request);
  } catch (error) {
    if (error instanceof CurrentUserAuthenticationError) {
      throw new AuthorizationError("AUTH_REQUIRED");
    }

    throw error;
  }
}

export async function requireAdmin(request: Request): Promise<AppUser> {
  const user = await requireAuthenticatedUser(request);

  if (!hasRole(user, "admin")) {
    throw new AuthorizationError("FORBIDDEN");
  }

  return user;
}

export async function requireProducerAreaAccess(request: Request): Promise<AppUser> {
  const user = await requireAuthenticatedUser(request);

  if (!hasRole(user, "admin") && !hasRole(user, "producer")) {
    throw new AuthorizationError("FORBIDDEN");
  }

  return user;
}

async function assertShowAccess(user: AppUser, showId: string): Promise<void> {
  requireResourceId(showId);
  const show = await prisma.show.findUnique({
    where: { id: showId },
    select: {
      id: true,
      producers: {
        where: { userId: user.userId },
        select: { userId: true },
      },
    },
  });

  if (!show) {
    throw new AuthorizationError("NOT_FOUND");
  }

  if (!hasRole(user, "admin") && !(hasRole(user, "producer") && show.producers.length > 0)) {
    throw new AuthorizationError("FORBIDDEN");
  }
}

export async function requireShowAccess(request: Request, showId: string): Promise<AppUser> {
  const user = await requireAuthenticatedUser(request);
  await assertShowAccess(user, showId);
  return user;
}

export async function requireEpisodeAccess(request: Request, episodeId: string): Promise<AppUser> {
  const user = await requireAuthenticatedUser(request);
  requireResourceId(episodeId);
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    select: {
      id: true,
      showId: true,
      producers: {
        where: { userId: user.userId },
        select: { userId: true },
      },
      show: {
        select: {
          producers: {
            where: { userId: user.userId },
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!episode) {
    throw new AuthorizationError("NOT_FOUND");
  }

  const assigned =
    episode.producers.length > 0 ||
    (episode.showId !== null && (episode.show?.producers.length ?? 0) > 0);

  if (!hasRole(user, "admin") && !(hasRole(user, "producer") && assigned)) {
    throw new AuthorizationError("FORBIDDEN");
  }

  return user;
}

export async function requireEpisodeCreateAccess(
  request: Request,
  showId?: string | null,
): Promise<AppUser> {
  const user = await requireAuthenticatedUser(request);

  if (showId !== null && showId !== undefined) {
    await assertShowAccess(user, showId);
  } else if (!hasRole(user, "admin") && !hasRole(user, "producer")) {
    throw new AuthorizationError("FORBIDDEN");
  }

  return user;
}

export const requireShowCreateAccess = requireAdmin;
