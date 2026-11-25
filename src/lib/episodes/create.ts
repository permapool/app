import "server-only";

import { prisma } from "~/lib/prisma";
import {
  AuthorizationError,
  requireEpisodeAccess,
  requireEpisodeCreateAccess,
} from "~/lib/auth/authorization";
import { EpisodeValidationError, parseScheduledStart } from "~/lib/episodes/schedule";

const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CreateEpisodeInput = {
  requestId: string;
  title: string;
  date: string;
  time: string;
  timezone: string;
  shortDescription: string | null;
  publicJoinUrl: string;
  showId: string | null;
  scheduledStartAt: Date;
};

export class EpisodeConflictError extends Error {
  constructor() {
    super("This submission conflicts with an existing session.");
    this.name = "EpisodeConflictError";
  }
}

function optionalText(value: unknown, field: string, maxLength: number): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new EpisodeValidationError(`Enter a valid ${field}.`);
  const text = value.trim();
  if (text.length > maxLength) throw new EpisodeValidationError(`${field} is too long.`);
  return text || null;
}

export function parseCreateEpisodeInput(raw: unknown, now = new Date()): CreateEpisodeInput {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new EpisodeValidationError("Enter session details.");
  }

  const body = raw as Record<string, unknown>;
  const requestId = body.requestId;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const date = body.date;
  const time = body.time;
  const timezone = body.timezone;
  const joinUrl = body.publicJoinUrl;

  if (typeof requestId !== "string" || !REQUEST_ID_PATTERN.test(requestId)) {
    throw new EpisodeValidationError("Start a new session submission and try again.");
  }
  if (!title || title.length > 120) {
    throw new EpisodeValidationError("Enter a title of 120 characters or less.");
  }
  if (typeof date !== "string" || typeof time !== "string" || typeof timezone !== "string") {
    throw new EpisodeValidationError("Enter a valid date, time, and timezone.");
  }
  if (typeof joinUrl !== "string" || !joinUrl.trim()) {
    throw new EpisodeValidationError("Enter a public join URL.");
  }

  let publicJoinUrl: string;

  try {
    const url = new URL(joinUrl.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported protocol");
    }
    publicJoinUrl = url.toString();
  } catch {
    throw new EpisodeValidationError("Enter a valid HTTP or HTTPS join URL.");
  }

  const showId = body.showId === "" || body.showId === undefined ? null : body.showId;
  if (showId !== null && typeof showId !== "string") {
    throw new EpisodeValidationError("Select a valid Show.");
  }

  const shortDescription = optionalText(body.shortDescription, "Short description", 500);
  if (!shortDescription) {
    throw new EpisodeValidationError("Enter a short description.");
  }

  return {
    requestId,
    title,
    date,
    time,
    timezone,
    shortDescription,
    publicJoinUrl,
    showId,
    scheduledStartAt: parseScheduledStart({ date, time, timezone }, now),
  };
}

function slugFor(title: string, requestId: string) {
  const readable = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
    .replace(/-$/g, "") || "session";

  return `${readable}-${requestId.replaceAll("-", "").toLowerCase()}`;
}

function episodeResponse(episode: {
  id: string;
  slug: string;
  state: string;
  scheduledStartAt: Date;
  timezone: string;
}) {
  return {
    episodeId: episode.id,
    slug: episode.slug,
    path: `/episodes/${episode.slug}`,
    state: episode.state,
    scheduledStartAt: episode.scheduledStartAt.toISOString(),
    timezone: episode.timezone,
  };
}

export async function createHostedEpisode(request: Request, raw: unknown) {
  const input = parseCreateEpisodeInput(raw);
  const user = await requireEpisodeCreateAccess(request, input.showId);

  try {
    const episode = await prisma.episode.create({
      data: {
        id: input.requestId,
        slug: slugFor(input.title, input.requestId),
        title: input.title,
        shortDescription: input.shortDescription,
        scheduledStartAt: input.scheduledStartAt,
        timezone: input.timezone,
        state: "SCHEDULED",
        publicJoinUrl: input.publicJoinUrl,
        showId: input.showId,
        youtubeBroadcastId: null,
        ...(input.showId === null
          ? { producers: { create: { userId: user.userId } } }
          : {}),
      },
      select: {
        id: true,
        slug: true,
        state: true,
        scheduledStartAt: true,
        timezone: true,
      },
    });

    return { episode: episodeResponse(episode), created: true };
  } catch (error) {
    if (typeof error !== "object" || error === null || !("code" in error) || error.code !== "P2002") {
      throw error;
    }

    const existing = await prisma.episode.findUnique({
      where: { id: input.requestId },
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        scheduledStartAt: true,
        timezone: true,
        state: true,
        publicJoinUrl: true,
        showId: true,
      },
    });

    if (
      !existing ||
      existing.title !== input.title ||
      existing.shortDescription !== input.shortDescription ||
      existing.scheduledStartAt.getTime() !== input.scheduledStartAt.getTime() ||
      existing.timezone !== input.timezone ||
      existing.publicJoinUrl !== input.publicJoinUrl ||
      existing.showId !== input.showId
    ) {
      throw new EpisodeConflictError();
    }

    try {
      await requireEpisodeAccess(request, existing.id);
    } catch (accessError) {
      if (accessError instanceof AuthorizationError) throw new EpisodeConflictError();
      throw accessError;
    }

    return { episode: episodeResponse(existing), created: false };
  }
}
