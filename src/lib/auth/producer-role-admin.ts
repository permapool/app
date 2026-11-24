import "server-only";

import { AuthorizationError, requireAdmin } from "~/lib/auth/authorization";
import { prisma } from "~/lib/prisma";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listUsersForProducerAccess(request: Request) {
  await requireAdmin(request);
  const query = new URL(request.url).searchParams.get("query")?.trim().slice(0, 80) ?? "";
  const users = await prisma.user.findMany({
    where: query ? { OR: [
      { username: { contains: query, mode: "insensitive" } },
      { displayName: { contains: query, mode: "insensitive" } },
    ] } : undefined,
    orderBy: [{ username: "asc" }, { id: "asc" }],
    take: 25,
    select: {
      id: true,
      username: true,
      displayName: true,
      userRoles: { select: { role: { select: { name: true } } } },
    },
  });

  return users.map((user) => ({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    roles: user.userRoles.map(({ role }) => role.name),
  }));
}

export async function setProducerRole(request: Request, targetUserId: string, granted: boolean) {
  const actor = await requireAdmin(request);
  if (!UUID_PATTERN.test(targetUserId)) throw new AuthorizationError("NOT_FOUND");

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!target) throw new AuthorizationError("NOT_FOUND");

  const role = await prisma.role.findUnique({ where: { name: "producer" }, select: { id: true } });
  if (!role) throw new Error("Producer role unavailable");

  if (granted) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: target.id, roleId: role.id } },
      create: { userId: target.id, roleId: role.id },
      update: {},
    });
  } else {
    await prisma.userRole.deleteMany({ where: { userId: target.id, roleId: role.id } });
  }

  console.info(JSON.stringify({
    action: granted ? "producer_role_granted" : "producer_role_revoked",
    actorUserId: actor.userId,
    targetUserId: target.id,
    role: "producer",
    result: "success",
  }));
  return { userId: target.id, producer: granted };
}
