"use client";

import { ChatCenteredDots, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CHAT_MESSAGE_MAX_LENGTH } from "~/lib/chat/constants";

type ChatComposerProps = {
  authenticated: boolean;
  composerValue: string;
  error: string | null;
  ready: boolean;
  sending: boolean;
  signedInLabel: string | null;
  onComposerChange: (value: string) => void;
  onSend: () => void;
};

export default function ChatComposer({
  authenticated,
  composerValue,
  error,
  ready,
  sending,
  signedInLabel,
  onComposerChange,
  onSend,
}: ChatComposerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isExpanded]);

  useEffect(() => {
    if (composerValue.trim()) {
      setIsExpanded(true);
    }
  }, [composerValue]);

  return (
    <motion.div layout className="mt-3 flex flex-col items-start gap-2">
      <AnimatePresence initial={false} mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded-composer"
            layout
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-[340px] border border-black/10 bg-white/80 p-2 shadow-solid backdrop-blur-sm"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/50">
                {authenticated ? "Send a message" : "Join the chat"}
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-black/15 bg-white/70 p-0 text-black"
                onClick={() => setIsExpanded(false)}
                aria-label="Collapse composer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <textarea
              ref={textareaRef}
              value={composerValue}
              onChange={(event) => onComposerChange(event.target.value)}
              maxLength={CHAT_MESSAGE_MAX_LENGTH}
              rows={2}
              placeholder={authenticated ? "Say something..." : "Type now, log in on send"}
              className="w-full resize-none border-0 bg-transparent p-0 text-[13px] leading-5 text-black outline-none"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.14em] text-black/45">
                {composerValue.trim().length}/{CHAT_MESSAGE_MAX_LENGTH}
              </span>
              <button
                type="button"
                className="border border-black bg-black px-3 py-2 text-[10px] uppercase text-white"
                disabled={sending || !ready}
                onClick={onSend}
              >
                {sending ? "Sending" : authenticated ? "Send" : "Login + Send"}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed-composer"
            layout
            type="button"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-black bg-white/85 p-0 text-black shadow-solid backdrop-blur-sm"
            onClick={() => setIsExpanded(true)}
            aria-label="Open chat composer"
          >
            <ChatCenteredDots size={24} weight="fill" />
          </motion.button>
        )}
      </AnimatePresence>

      {error ? (
        <div className="text-[10px] uppercase tracking-[0.12em] text-[#a11]">
          {error}
        </div>
      ) : null}

      {signedInLabel ? (
        <div className="text-[10px] uppercase tracking-[0.12em] text-black/45">
          Signed in as {signedInLabel}
        </div>
      ) : null}
    </motion.div>
  );
}
