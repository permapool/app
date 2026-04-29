"use client";

import { usePrivy } from "@privy-io/react-auth";
import {
  useBroadcastEvent,
  useEventListener,
  useOthersConnectionIds,
} from "@liveblocks/react/suspense";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "~/components/providers/AuthProvider";
import {
  CHAT_BOTTOM_THRESHOLD_PX,
  type ChatReactionType,
} from "~/lib/chat/constants";
import type {
  ChatFeedEvent,
  ChatFeedResponse,
  ChatMessagePayload,
} from "~/lib/chat/types";
import { compareChatMessages } from "~/lib/chat/utils";
import ChatComposer from "~/components/ui/chat/ChatComposer";
import ChatFeed from "~/components/ui/chat/ChatFeed";

type ApiErrorResponse = {
  error?: string;
};

async function readJsonSafely<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function mergeMessages(
  current: ChatMessagePayload[],
  incoming: ChatMessagePayload[],
) {
  const next = new Map(current.map((message) => [message.id, message]));

  for (const message of incoming) {
    next.set(message.id, message);
  }

  return Array.from(next.values()).sort(compareChatMessages);
}

export default function Chat() {
  const { user, refreshUser } = useAuth();
  const { ready, authenticated, login, getAccessToken } = usePrivy();
  const broadcast = useBroadcastEvent();
  const othersConnectionIds = useOthersConnectionIds();
  const feedRef = useRef<HTMLDivElement | null>(null);
  const initialFeedReadyRef = useRef(false);
  const previousMessageCountRef = useRef(0);
  const lastFetchClientTimestampRef = useRef<number | null>(null);
  const sendInFlightRef = useRef(false);

  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [composerValue, setComposerValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverTimestamp, setServerTimestamp] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [pendingReactionKey, setPendingReactionKey] = useState<string | null>(null);
  const [, setServerClockTick] = useState(0);

  const viewerCount = othersConnectionIds.length + 1;
  const signedInLabel = user ? user.displayName ?? user.username : null;

  const derivedServerTimeMs = (() => {
    if (!serverTimestamp) {
      return Date.now();
    }

    const base = new Date(serverTimestamp).getTime();
    const elapsed = lastFetchClientTimestampRef.current
      ? Date.now() - lastFetchClientTimestampRef.current
      : 0;

    return base + elapsed;
  })();

  useEffect(() => {
    const interval = window.setInterval(() => {
      setServerClockTick((tick) => tick + 1);
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const headers: HeadersInit = {};

      if (authenticated) {
        const accessToken = await getAccessToken();

        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }
      }

      const response = await fetch("/api/chat/feed", {
        cache: "no-store",
        headers,
      });
      const payload = await readJsonSafely<ChatFeedResponse & ApiErrorResponse>(response);

      if (!response.ok || !payload) {
        throw new Error(payload?.error ?? "Unable to load chat");
      }

      lastFetchClientTimestampRef.current = Date.now();
      setMessages(payload.messages);
      setServerTimestamp(payload.serverTimestamp);
      previousMessageCountRef.current = payload.messages.length;
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load chat");
    } finally {
      setLoading(false);
    }
  }, [authenticated, getAccessToken]);

  useEffect(() => {
    void fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    if (loading || initialFeedReadyRef.current || !feedRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (!feedRef.current) {
        return;
      }

      feedRef.current.scrollTop = feedRef.current.scrollHeight;
      initialFeedReadyRef.current = true;
      setIsAtBottom(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [loading, messages.length]);

  useEffect(() => {
    const container = feedRef.current;

    if (!container) {
      return;
    }

    const handleScroll = () => {
      const distanceToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const nextIsAtBottom = distanceToBottom <= CHAT_BOTTOM_THRESHOLD_PX;

      setIsAtBottom(nextIsAtBottom);

      if (nextIsAtBottom) {
        setNewMessageCount(0);
      }
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll);

    return () => container.removeEventListener("scroll", handleScroll);
  }, [loading]);

  useEffect(() => {
    if (!initialFeedReadyRef.current) {
      return;
    }

    const previousCount = previousMessageCountRef.current;
    const nextCount = messages.length;

    if (nextCount <= previousCount) {
      previousMessageCountRef.current = nextCount;
      return;
    }

    previousMessageCountRef.current = nextCount;

    if (isAtBottom && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
      setNewMessageCount(0);
      return;
    }

    setNewMessageCount((count) => count + (nextCount - previousCount));
  }, [isAtBottom, messages]);

  useEventListener((roomEvent) => {
    const event = roomEvent.event as ChatFeedEvent;

    if (
      event.type !== "chat_message_created" &&
      event.type !== "chat_reaction_toggled"
    ) {
      return;
    }

    lastFetchClientTimestampRef.current ??= Date.now();
    setMessages((current) => mergeMessages(current, [event.message]));
  });

  const promptLogin = async () => {
    if (!ready) {
      return;
    }

    login({ loginMethods: ["email", "wallet"] });
    await refreshUser().catch(() => undefined);
  };

  const sendMessage = async () => {
    if (sending || sendInFlightRef.current) {
      return;
    }

    sendInFlightRef.current = true;

    try {
      if (!composerValue.trim()) {
        setError("Say something first");
        return;
      }

      if (!authenticated) {
        setError("Log in to send");
        await promptLogin();
        return;
      }

      const accessToken = await getAccessToken();

      if (!accessToken) {
        setError("Unable to verify your session");
        return;
      }

      setSending(true);
      setError(null);

      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content: composerValue }),
      });
      const payload = await readJsonSafely<ChatMessagePayload & ApiErrorResponse>(response);

      if (!response.ok || !payload || !("id" in payload)) {
        throw new Error(payload?.error ?? "Unable to send message");
      }

      setMessages((current) => mergeMessages(current, [payload]));
      setComposerValue("");
      broadcast({
        type: "chat_message_created",
        message: payload,
      });
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send message");
    } finally {
      sendInFlightRef.current = false;
      setSending(false);
    }
  };

  const toggleReaction = async (messageId: string, reactionType: ChatReactionType) => {
    if (!authenticated) {
      setError("Log in to react");
      await promptLogin();
      return;
    }

    const accessToken = await getAccessToken();

    if (!accessToken) {
      setError("Unable to verify your session");
      return;
    }

    const pendingKey = `${messageId}:${reactionType}`;
    setPendingReactionKey(pendingKey);
    setError(null);

    try {
      const response = await fetch(`/api/chat/messages/${messageId}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ type: reactionType }),
      });
      const payload = await readJsonSafely<ChatMessagePayload & ApiErrorResponse>(response);

      if (!response.ok || !payload || !("id" in payload)) {
        throw new Error(payload?.error ?? "Unable to update reaction");
      }

      setMessages((current) => mergeMessages(current, [payload]));
      broadcast({
        type: "chat_reaction_toggled",
        message: payload,
      });
    } catch (reactionError) {
      setError(
        reactionError instanceof Error ? reactionError.message : "Unable to update reaction",
      );
    } finally {
      setPendingReactionKey(null);
    }
  };

  const jumpToBottom = () => {
    if (!feedRef.current) {
      return;
    }

    feedRef.current.scrollTop = feedRef.current.scrollHeight;
    setNewMessageCount(0);
    setIsAtBottom(true);
  };

  return (
    <div className="fixed inset-x-3 bottom-20 z-[10015] w-[66%] p-3 md:left-4 md:right-auto">
      <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-green">
        <span title="Approximate viewer count from room presence">
          {viewerCount} optimists viewing
        </span>
      </div>
      <div>
      <ChatFeed
        derivedServerTimeMs={derivedServerTimeMs}
        feedRef={feedRef}
        loading={loading}
        messages={messages}
        newMessageCount={newMessageCount}
        pendingReactionKey={pendingReactionKey}
        onJumpToBottom={jumpToBottom}
        onToggleReaction={(messageId, reactionType) => {
          void toggleReaction(messageId, reactionType);
        }}
      />
      </div>
      <div>

      <ChatComposer
        authenticated={authenticated}
        composerValue={composerValue}
        error={error}
        ready={ready}
        sending={sending}
        signedInLabel={signedInLabel}
        onComposerChange={setComposerValue}
        onSend={sendMessage}
      />
      </div>
    </div>
  );
}
