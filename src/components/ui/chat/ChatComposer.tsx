"use client";

import { ChatCenteredDotsIcon, XIcon } from "@phosphor-icons/react";
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
  const toggleExpanded = () => setIsExpanded((current) => !current);

  const syncTextareaHeight = () => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  };

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      syncTextareaHeight();
      textareaRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isExpanded]);

  useEffect(() => {
    if (composerValue.trim()) {
      setIsExpanded(true);
    }
  }, [composerValue]);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    syncTextareaHeight();
  }, [composerValue, isExpanded]);

  return (
    <div className="relative mt-3 h-12 w-full max-w-[340px]">
      <AnimatePresence initial={false} mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded-composer"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute bottom-0 left-0 z-20 w-full border border-black bg-[var(--background)] p-2"
          >
            <textarea
              ref={textareaRef}
              value={composerValue}
              onChange={(event) => onComposerChange(event.target.value)}
              maxLength={CHAT_MESSAGE_MAX_LENGTH}
              rows={1}
              placeholder={authenticated ? "Send a message" : "Type now, log in on send"}
              className="min-h-[20px] w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-[13px] leading-5 text-black outline-none"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-black/45">
                <span>
                  {composerValue.trim().length}/{CHAT_MESSAGE_MAX_LENGTH}
                </span>
                {error ? <span className="text-[#a11]">{error}</span> : null}
                {!error && signedInLabel ? (
                  <span className="truncate">Signed in as {signedInLabel}</span>
                ) : null}
              </div>
              <button
                type="button"
                className="shrink-0 border border-black bg-black px-3 py-2 text-[10px] uppercase text-white transition-colors hover:bg-[var(--green)]"
                disabled={sending || !ready}
                onClick={onSend}
              >
                {sending ? "Sending" : authenticated ? "Send" : "Login + Send"}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        animate={{ scale: isExpanded ? 1 : 0.96 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={`absolute left-0 top-0 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-black p-0 transition-colors ${
          isExpanded
            ? "bg-black text-[var(--background)] hover:bg-[var(--amber)] hover:text-black"
            : "bg-[var(--amber)] text-black hover:bg-[var(--green)] hover:text-[var(--background)]"
        }`}
        onClick={toggleExpanded}
        aria-label={isExpanded ? "Collapse composer" : "Open chat composer"}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isExpanded ? "close" : "open"}
            initial={{ opacity: 0, rotate: -12, scale: 0.85 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 12, scale: 0.85 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            {isExpanded ? (
              <XIcon size={15} weight="bold" />
            ) : (
              <ChatCenteredDotsIcon size={15} weight="fill" />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
