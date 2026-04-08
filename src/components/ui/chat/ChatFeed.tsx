"use client";

import type { CSSProperties, MutableRefObject } from "react";
import BarLoader from "~/components/BarLoader";
import { CHAT_REACTION_TYPES, CHAT_VISIBILITY_WINDOW_MS, type ChatReactionType } from "~/lib/chat/constants";
import type { ChatMessagePayload } from "~/lib/chat/types";

type ChatFeedProps = {
  derivedServerTimeMs: number;
  feedRef: MutableRefObject<HTMLDivElement | null>;
  loading: boolean;
  messages: ChatMessagePayload[];
  newMessageCount: number;
  pendingReactionKey: string | null;
  onJumpToBottom: () => void;
  onToggleReaction: (messageId: string, reactionType: ChatReactionType) => void;
};

function reactionCountLabel(count: number) {
  if (count === 0) {
    return "";
  }

  return count > 99 ? "99+" : String(count);
}

function getMessageOpacity(createdAt: string, serverTimeMs: number) {
  const ageMs = Math.max(0, serverTimeMs - new Date(createdAt).getTime());
  const ratio = Math.min(ageMs / CHAT_VISIBILITY_WINDOW_MS, 1);

  return Math.max(0.35, 1 - ratio * 0.6);
}

export default function ChatFeed({
  derivedServerTimeMs,
  feedRef,
  loading,
  messages,
  newMessageCount,
  pendingReactionKey,
  onJumpToBottom,
  onToggleReaction,
}: ChatFeedProps) {
  return (
    <div className="relative mt-3">
      <div
        ref={feedRef}
        className="max-h-[69vh] min-h-[180px] max-w-[400px] overflow-y-auto py-3"
      >
        {loading ? (
          <div className="flex min-h-[60px] items-center justify-center py-10">
            <div className="h-[5px] w-full">
              <BarLoader intervalRate={300} />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-10 text-center text-[11px] uppercase tracking-[0.14em] text-green/50">
            Be the first voice in the room
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => {
              const opacity = getMessageOpacity(message.createdAt, derivedServerTimeMs);
              const rowStyle = {
                opacity,
              } satisfies CSSProperties;

              return (
                <div
                  key={message.id}
                  className="px-2 py-1.5 transition-opacity bg-white/30 backdrop-blur-sm w-fit"
                  style={rowStyle}
                >
                  <div className="flex items-baseline justify-between gap-2 text-[10px] uppercase tracking-[0.14em] text-black/55">
                    <span className="truncate font-bold text-black">
                      {message.author.displayName ?? message.author.username}
                    </span>
                    <span className="shrink-0">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="mt-1 break-words text-[13px] leading-5 text-black">
                    {message.content}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {CHAT_REACTION_TYPES.map((reactionType) => {
                      const isActive = message.viewerReactions[reactionType];
                      const count = message.reactions[reactionType];
                      const isPending = pendingReactionKey === `${message.id}:${reactionType}`;

                      return (
                        <button
                          key={`${message.id}-${reactionType}`}
                          type="button"
                          className={`w-fit border px-2 py-1 text-[11px] rounded-full ${
                            isActive
                              ? "border-black bg-black text-white"
                              : "border-black/20 bg-white/70 text-black"
                          }`}
                          disabled={isPending}
                          onClick={() => onToggleReaction(message.id, reactionType)}
                        >
                          <span>{reactionType}</span>
                          {count > 0 ? <span className="ml-1">{reactionCountLabel(count)}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {newMessageCount > 0 ? (
        <button
          type="button"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 border border-black bg-black px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-white"
          onClick={onJumpToBottom}
        >
          {newMessageCount} new message{newMessageCount === 1 ? "" : "s"}
        </button>
      ) : null}
    </div>
  );
}
