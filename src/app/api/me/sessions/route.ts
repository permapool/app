import type { Prisma } from "@prisma/client";
import { AuthorizationError, requireProducerAreaAccess } from "~/lib/auth/authorization";
import { hasRole } from "~/lib/auth/roles";
import { prisma } from "~/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireProducerAreaAccess(request);
    const admin = hasRole(user, "admin");
    const userId = user.userId;
    const where: Prisma.EpisodeWhereInput = {
      AND: [
        {
          OR: [
            { state: "LIVE" },
            { state: "SCHEDULED", scheduledStartAt: { gte: new Date() } },
          ],
        },
        ...(admin
          ? []
          : [{
              OR: [
                { producers: { some: { userId } } },
                { show: { producers: { some: { userId } } } },
              ],
            }]),
      ],
    };

    const [shows, episodes] = await Promise.all([
      prisma.show.findMany({
        where: {
          archivedAt: null,
          ...(admin ? {} : { producers: { some: { userId } } }),
        },
        orderBy: { title: "asc" },
        select: { id: true, title: true },
      }),
      prisma.episode.findMany({
        where,
        orderBy: { scheduledStartAt: "asc" },
        take: 50,
        select: {
          id: true,
          slug: true,
          title: true,
          scheduledStartAt: true,
          timezone: true,
          state: true,
          show: { select: { title: true } },
        },
      }),
    ]);

    return Response.json({
      shows,
      episodes: episodes.map((episode) => ({
        ...episode,
        scheduledStartAt: episode.scheduledStartAt.toISOString(),
        path: `/episodes/${episode.slug}`,
      })),
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return Response.json({ error: error.code }, { status: error.status });
    }

    console.error("[me/sessions] failed to load sessions", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
