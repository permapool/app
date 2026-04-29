import type { ChatMessage, Prisma, Reaction, User } from "@prisma/client";
import { getAccessTokenFromRequest, getVerifiedPrivyUser } from "~/lib/auth/privy-server";
import { syncPrivyUser } from "~/lib/auth/sync-user";
import {
  CHAT_MESSAGE_COOLDOWN_MS,
  CHAT_MESSAGE_LIMIT,
  CHAT_MESSAGE_MAX_LENGTH,
  CHAT_REACTION_TYPES,
  CHAT_VISIBILITY_WINDOW_MS,
  type ChatReactionType,
} from "~/lib/chat/constants";
import { getOrCreateGlobalChatSession } from "~/lib/chat/sessions";
import type {
  ChatFeedResponse,
  ChatMessagePayload,
  ChatReactionCounts,
  ChatViewerReactions,
} from "~/lib/chat/types";
import { prisma } from "~/lib/prisma";

type ChatMessageWithRelations = ChatMessage & {
  user: Pick<User, "id" | "username" | "displayName">;
  reactions: Pick<Reaction, "type" | "userId">[];
};

export class ChatApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
  }
}

function emptyReactionCounts(): ChatReactionCounts {
  return Object.fromEntries(CHAT_REACTION_TYPES.map((type) => [type, 0])) as ChatReactionCounts;
}

function emptyViewerReactions(): ChatViewerReactions {
  return Object.fromEntries(CHAT_REACTION_TYPES.map((type) => [type, false])) as ChatViewerReactions;
}

export function isChatReactionType(value: string): value is ChatReactionType {
  return CHAT_REACTION_TYPES.includes(value as ChatReactionType);
}

export function getChatWindowStart(now: Date) {
  return new Date(now.getTime() - CHAT_VISIBILITY_WINDOW_MS);
}

export async function getOptionalCurrentUser(request: Request) {
  const accessToken = getAccessTokenFromRequest(request);

  if (!accessToken) {
    return null;
  }

  try {
    const privyUser = await getVerifiedPrivyUser(request);
    return await syncPrivyUser(privyUser);
  } catch {
    return null;
  }
}

export async function getOptionalViewerUserId(request: Request) {
  const accessToken = getAccessTokenFromRequest(request);

  if (!accessToken) {
    return null;
  }

  try {
    const privyUser = await getVerifiedPrivyUser(request);
    const existingUser = await prisma.user.findUnique({
      where: { privyId: privyUser.id },
      select: { id: true },
    });

    if (existingUser) {
      return existingUser.id;
    }

    const syncedUser = await syncPrivyUser(privyUser);
    return syncedUser.userId;
  } catch {
    return null;
  }
}

export async function requireCurrentUser(request: Request) {
  const privyUser = await getVerifiedPrivyUser(request);
  return syncPrivyUser(privyUser);
}

export function normalizeChatMessage(
  message: ChatMessageWithRelations,
  viewerUserId: string | null,
): ChatMessagePayload {
  const reactions = emptyReactionCounts();
  const viewerReactions = emptyViewerReactions();

  for (const reaction of message.reactions) {
    if (isChatReactionType(reaction.type)) {
      reactions[reaction.type] += 1;

      if (viewerUserId && reaction.userId === viewerUserId) {
        viewerReactions[reaction.type] = true;
      }
    }
  }

  return {
    id: message.id,
    sessionId: message.sessionId,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    author: {
      userId: message.user.id,
      username: message.user.username,
      displayName: message.user.displayName,
    },
    reactions,
    viewerReactions,
  };
}

const chatMessageInclude = {
  user: {
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  },
  reactions: {
    select: {
      type: true,
      userId: true,
    },
  },
} satisfies Prisma.ChatMessageInclude;

async function resolveSinceDate(since: string | null) {
  if (!since) {
    return null;
  }

  const parsed = new Date(since);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const message = await prisma.chatMessage.findUnique({
    where: { id: since },
    select: { createdAt: true },
  });

  if (!message) {
    throw new ChatApiError(400, "Invalid since cursor");
  }

  return message.createdAt;
}

export async function fetchChatFeed({
  since,
  viewerUserId,
}: {
  since: string | null;
  viewerUserId: string | null;
}): Promise<ChatFeedResponse> {
  const now = new Date();
  const session = await getOrCreateGlobalChatSession();
  const chatWindowStart = getChatWindowStart(now);
  const resolvedSince = await resolveSinceDate(since);
  const createdAfter =
    resolvedSince && resolvedSince > chatWindowStart ? resolvedSince : chatWindowStart;

  const where: Prisma.ChatMessageWhereInput = resolvedSince
    ? {
        sessionId: session.id,
        createdAt: {
          gt: createdAfter,
        },
      }
    : {
        sessionId: session.id,
        createdAt: {
          gte: createdAfter,
        },
      };

  const rows = await prisma.chatMessage.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: CHAT_MESSAGE_LIMIT + 1,
    include: chatMessageInclude,
  });

  const truncated = rows.length > CHAT_MESSAGE_LIMIT;
  const visibleRows = rows.slice(0, CHAT_MESSAGE_LIMIT).reverse();

  return {
    sessionId: session.id,
    messages: visibleRows.map((message) => normalizeChatMessage(message, viewerUserId)),
    limit: CHAT_MESSAGE_LIMIT,
    truncated,
    serverTimestamp: now.toISOString(),
  };
}

export async function createChatMessage({
  content,
  userId,
}: {
  content: string;
  userId: string;
}) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new ChatApiError(400, "Message cannot be empty");
  }

  if (trimmedContent.length > CHAT_MESSAGE_MAX_LENGTH) {
    throw new ChatApiError(400, `Message must be ${CHAT_MESSAGE_MAX_LENGTH} characters or fewer`);
  }

  const session = await getOrCreateGlobalChatSession();
  const now = new Date();
  const cooldownStart = new Date(now.getTime() - CHAT_MESSAGE_COOLDOWN_MS);
  const shouldApplyCooldown = trimmedContent.length > 1;

  const previousMessage = await prisma.chatMessage.findFirst({
    where: {
      sessionId: session.id,
      userId,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      content: true,
      createdAt: true,
    },
  });

  if (shouldApplyCooldown && previousMessage && previousMessage.createdAt > cooldownStart) {
    if (previousMessage.content.trim() === trimmedContent) {
      throw new ChatApiError(409, "Duplicate messages are blocked for a few seconds");
    }

    throw new ChatApiError(429, "Please wait a moment before sending again");
  }

  const created = await prisma.chatMessage.create({
    data: {
      content: trimmedContent,
      sessionId: session.id,
      userId,
    },
    include: chatMessageInclude,
  });

  return normalizeChatMessage(created, userId);
}

export async function toggleMessageReaction({
  messageId,
  reactionType,
  userId,
}: {
  messageId: string;
  reactionType: ChatReactionType;
  userId: string;
}) {
  const updatedMessage = await prisma.$transaction(async (tx) => {
    const existingReaction = await tx.reaction.findUnique({
      where: {
        userId_messageId_type: {
          userId,
          messageId,
          type: reactionType,
        },
      },
      select: { id: true },
    });

    if (existingReaction) {
      await tx.reaction.delete({
        where: {
          userId_messageId_type: {
            userId,
            messageId,
            type: reactionType,
          },
        },
      });
    } else {
      await tx.reaction.create({
        data: {
          userId,
          messageId,
          type: reactionType,
        },
      });
    }

    return tx.chatMessage.findUnique({
      where: { id: messageId },
      include: chatMessageInclude,
    });
  });

  if (!updatedMessage) {
    throw new ChatApiError(404, "Message not found");
  }

  return normalizeChatMessage(updatedMessage, userId);
}
