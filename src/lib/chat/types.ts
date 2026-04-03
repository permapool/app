import type { ChatReactionType } from "~/lib/chat/constants";

export type ChatAuthorSummary = {
  userId: string;
  username: string;
  displayName: string | null;
};

export type ChatReactionCounts = Record<ChatReactionType, number>;
export type ChatViewerReactions = Record<ChatReactionType, boolean>;

export type ChatMessagePayload = {
  id: string;
  sessionId: string;
  content: string;
  createdAt: string;
  author: ChatAuthorSummary;
  reactions: ChatReactionCounts;
  viewerReactions: ChatViewerReactions;
};

export type ChatFeedResponse = {
  sessionId: string;
  messages: ChatMessagePayload[];
  limit: number;
  truncated: boolean;
  serverTimestamp: string;
};

export type ChatFeedEvent =
  | {
      type: "chat_message_created";
      message: ChatMessagePayload;
    }
  | {
      type: "chat_reaction_toggled";
      message: ChatMessagePayload;
    };
