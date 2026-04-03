"use client";

type LoadingProps = {
  label?: string;
  className?: string;
};

export default function Loading({
  label = "Loading...",
  className = "",
}: LoadingProps) {
  return (
    <div
      className={`fixed inset-0 z-[10030] flex items-center justify-center bg-transparent pointer-events-none ${className}`}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/20 border-t-black" />
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-black">
          {label}
        </div>
      </div>
    </div>
  );
}
