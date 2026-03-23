import { prisma } from "~/lib/prisma";

export async function createRootChatSession() {
  return prisma.chatSession.create({
    data: {
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
