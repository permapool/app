"use client";

import { useEffect, useState } from "react";

export default function EpisodeTime({
  instant,
  timezone,
  sourceLabel,
}: {
  instant: string;
  timezone: string;
  sourceLabel: string;
}) {
  const [viewerLabel, setViewerLabel] = useState<string | null>(null);

  useEffect(() => {
    const date = new Date(instant);
    if (Number.isNaN(date.getTime())) return;

    try {
      setViewerLabel(new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(date));
    } catch {
      setViewerLabel(null);
    }
  }, [instant]);

  return (
    <div className="space-y-1">
      <p><span className="font-medium">Host time:</span> <time dateTime={instant}>{sourceLabel}</time></p>
      <p className="text-sm">Source timezone: {timezone || "Unavailable"}</p>
      {viewerLabel ? <p className="text-sm">Your time: {viewerLabel}</p> : null}
    </div>
  );
}
