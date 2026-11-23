import type { PublicEpisode } from "~/lib/episodes/public";

// The Episode schema has a start but no end. Calendar downloads use one hour
// without inventing or persisting an Episode end time.
export const DEFAULT_EPISODE_DURATION_MINUTES = 60;

function utcIcsTimestamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldIcsLine(line: string) {
  const lines: string[] = [];
  let current = "";
  let bytes = 0;

  for (const character of line) {
    const size = Buffer.byteLength(character, "utf8");
    if (bytes + size > 75) {
      lines.push(current);
      current = ` ${character}`;
      bytes = size + 1;
    } else {
      current += character;
      bytes += size;
    }
  }

  lines.push(current);
  return lines.join("\r\n");
}

export function episodeCalendarIcs(
  episode: PublicEpisode,
  canonicalUrl: string,
  generatedAt = new Date(),
) {
  const start = new Date(episode.scheduledStartAt);
  const end = new Date(start.getTime() + DEFAULT_EPISODE_DURATION_MINUTES * 60_000);
  const description = [
    episode.shortDescription,
    `Host timezone: ${episode.timezone || "Unavailable"}`,
    episode.publicJoinUrl ? `Join: ${episode.publicJoinUrl}` : null,
    `Episode: ${canonicalUrl}`,
  ].filter((line): line is string => Boolean(line)).join("\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HIGHER.ZIP//Community Sessions//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${episode.id}@higher.zip`,
    `DTSTAMP:${utcIcsTimestamp(generatedAt)}`,
    `DTSTART:${utcIcsTimestamp(start)}`,
    `DTEND:${utcIcsTimestamp(end)}`,
    `SUMMARY:${escapeIcsText(episode.title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    ...(episode.publicJoinUrl ? [`LOCATION:${escapeIcsText(episode.publicJoinUrl)}`] : []),
    `URL:${canonicalUrl}`,
    ...(episode.state === "CANCELLED" ? ["STATUS:CANCELLED"] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}
