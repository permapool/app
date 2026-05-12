"use client";

export const CURSOR_REACTIONS = ["↑", "🔥", "❤️", "😂", "✨"];

type CursorReactionPanelProps = {
  onReaction: (reaction: string) => void;
};

export default function CursorReactionPanel({
  onReaction,
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
            className="flex h-8 min-w-0 items-center justify-center rounded-lg border border-black bg-white/80 text-sm text-black transition-transform hover:scale-120"
            onClick={() => onReaction(reaction)}
          >
            {reaction}
          </button>
        ))}
      </div>
    </div>
  );
}
