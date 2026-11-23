"use client";

import { useState } from "react";

export default function ShareEpisodeButton({ url }: { url: string }) {
  const [status, setStatus] = useState<string | null>(null);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied");
    } catch {
      setStatus("Copy unavailable. Use the link shown below.");
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={copyLink} className="px-4 py-2 text-sm">Share</button>
      {status ? <span role="status" className="text-xs">{status}</span> : null}
    </span>
  );
}
