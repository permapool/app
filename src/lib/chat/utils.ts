import type { ChatMessagePayload } from "~/lib/chat/types";

export function compareChatMessages(a: ChatMessagePayload, b: ChatMessagePayload) {
  const timestampDiff =
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

  if (timestampDiff !== 0) {
    return timestampDiff;
  }

  return a.id.localeCompare(b.id);
}
