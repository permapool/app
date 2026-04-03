export const CHAT_MESSAGE_LIMIT = 300;
export const CHAT_MESSAGE_MAX_LENGTH = 280;
export const CHAT_MESSAGE_COOLDOWN_MS = 3_000;
export const CHAT_VISIBILITY_WINDOW_MS = 24 * 60 * 60 * 1_000;
export const CHAT_BOTTOM_THRESHOLD_PX = 50;
export const CHAT_REACTION_TYPES = ["🔥", "↑", "😂", "❤️"] as const;

export type ChatReactionType = (typeof CHAT_REACTION_TYPES)[number];
