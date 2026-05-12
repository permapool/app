"use client";

export const CURSOR_REACTIONS = ["↑", "🔥", "❤️", "😂", "✨"];

type CursorReactionPanelProps = {
  onReaction: (reaction: string) => void;
  selectedReaction: string | null;
};

export default function CursorReactionPanel({
  onReaction,
  selectedReaction,
}: CursorReactionPanelProps) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-black/55">
        Reactions
      </div>
      <div className="grid grid-cols-5 gap-1">
        {CURSOR_REACTIONS.map((reaction) => (
          <button
            key={reaction}
            type="button"
            aria-pressed={selectedReaction === reaction}
            className={`flex h-8 min-w-0 items-center justify-center rounded-lg border border-black text-sm text-black transition-transform hover:scale-110 ${
              selectedReaction === reaction
                ? "bg-[var(--green)]"
                : "bg-white/80"
            }`}
            onClick={() => onReaction(reaction)}
          >
            {reaction}
          </button>
        ))}
      </div>
    </div>
  );
}
