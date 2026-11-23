import "server-only";

import { Prisma, type EpisodeState } from "@prisma/client";
import { prisma } from "~/lib/prisma";

const publicEpisodeSelect = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  scheduledStartAt: true,
  timezone: true,
  state: true,
  publicJoinUrl: true,
  producers: {
    orderBy: { createdAt: "asc" },
    select: {
      user: { select: { id: true, username: true, displayName: true } },
    },
  },
  show: {
    select: {
      id: true,
      slug: true,
      title: true,
      producers: {
        orderBy: { createdAt: "asc" },
        select: {
          user: { select: { id: true, username: true, displayName: true } },
        },
      },
    },
  },
} satisfies Prisma.EpisodeSelect;

type EpisodeRow = Prisma.EpisodeGetPayload<{ select: typeof publicEpisodeSelect }>;

export type PublicEpisode = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  scheduledStartAt: string;
  timezone: string;
  state: EpisodeState;
  publicJoinUrl: string | null;
  show: { id: string; slug: string; title: string } | null;
  hosts: { username: string; displayName: string | null }[];
  path: string;
};

function safePublicJoinUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function projectPublicEpisode(episode: EpisodeRow): PublicEpisode {
  const seen = new Set<string>();
  const hosts: PublicEpisode["hosts"] = [];

  // Direct collaborators appear first; Show producers fill in the recurring hosts.
  for (const assignment of [...episode.producers, ...(episode.show?.producers ?? [])]) {
    if (seen.has(assignment.user.id)) continue;
    seen.add(assignment.user.id);
    hosts.push({
      username: assignment.user.username,
      displayName: assignment.user.displayName,
    });
  }

  return {
    id: episode.id,
    slug: episode.slug,
    title: episode.title,
    shortDescription: episode.shortDescription,
    scheduledStartAt: episode.scheduledStartAt.toISOString(),
    timezone: episode.timezone,
    state: episode.state,
    publicJoinUrl: safePublicJoinUrl(episode.publicJoinUrl),
    show: episode.show
      ? { id: episode.show.id, slug: episode.show.slug, title: episode.show.title }
      : null,
    hosts,
    path: `/episodes/${episode.slug}`,
  };
}

export async function getPublicEpisodeBySlug(slug: string): Promise<PublicEpisode | null> {
  if (!slug) return null;

  const episode = await prisma.episode.findUnique({
    where: { slug },
    select: publicEpisodeSelect,
  });

  return episode ? projectPublicEpisode(episode) : null;
}

// Keep discovery bounded: every LIVE Episode, the next 50 future records,
// and the 50 most recent past records. The same projection serves detail and list.
export async function listPublicEpisodes(now = new Date()): Promise<PublicEpisode[]> {
  const [live, upcoming, past] = await Promise.all([
    prisma.episode.findMany({
      where: { state: "LIVE" },
      orderBy: [{ scheduledStartAt: "asc" }, { id: "asc" }],
      select: publicEpisodeSelect,
    }),
    prisma.episode.findMany({
      where: { state: { in: ["SCHEDULED", "CANCELLED"] }, scheduledStartAt: { gte: now } },
      orderBy: [{ scheduledStartAt: "asc" }, { id: "asc" }],
      take: 50,
      select: publicEpisodeSelect,
    }),
    prisma.episode.findMany({
      where: {
        OR: [
          { state: "COMPLETED" },
          { state: { in: ["SCHEDULED", "CANCELLED"] }, scheduledStartAt: { lt: now } },
        ],
      },
      orderBy: [{ scheduledStartAt: "desc" }, { id: "asc" }],
      take: 50,
      select: publicEpisodeSelect,
    }),
  ]);

  return [...live, ...upcoming, ...past].map(projectPublicEpisode);
}
