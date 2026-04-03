import { Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma";

export const GLOBAL_CHAT_SESSION_ID = "00000000-0000-4000-8000-000000000001";
let globalChatSessionPromise: ReturnType<typeof resolveGlobalChatSession> | null = null;

export async function createRootChatSession() {
  return prisma.chatSession.create({
    data: {
      id: GLOBAL_CHAT_SESSION_ID,
      isThread: false,
    },
  });
}

export async function createThreadChatSession(parentMessageId: string) {
  return prisma.chatSession.create({
    data: {
      isThread: true,
      parentMessageId,
    },
  });
}

async function resolveGlobalChatSession() {
  const existing = await prisma.chatSession.findUnique({
    where: { id: GLOBAL_CHAT_SESSION_ID },
  });

  if (existing) {
    return existing;
  }

  try {
    return await createRootChatSession();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return prisma.chatSession.findUniqueOrThrow({
        where: { id: GLOBAL_CHAT_SESSION_ID },
      });
    }

    throw error;
  }
}

export async function getOrCreateGlobalChatSession() {
  if (!globalChatSessionPromise) {
    globalChatSessionPromise = resolveGlobalChatSession();
  }

  try {
    return await globalChatSessionPromise;
  } finally {
    globalChatSessionPromise = null;
  }
}
