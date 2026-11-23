export class EpisodeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EpisodeValidationError";
  }
}

type LocalStart = {
  date: string;
  time: string;
  timezone: string;
};

export function parseScheduledStart(
  { date, time, timezone }: LocalStart,
  now = new Date(),
): Date {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);

  if (!dateMatch || !timeMatch) {
    throw new EpisodeValidationError("Enter a valid date and time.");
  }

  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const wallTimeAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const normalized = new Date(wallTimeAsUtc);

  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() + 1 !== month ||
    normalized.getUTCDate() !== day
  ) {
    throw new EpisodeValidationError("Enter a valid date and time.");
  }

  let formatter: Intl.DateTimeFormat;

  try {
    formatter = new Intl.DateTimeFormat("en-US-u-ca-gregory", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    throw new EpisodeValidationError("Enter a valid IANA timezone.");
  }

  const matches: Date[] = [];

  // Current IANA offsets are multiples of 15 minutes. Checking the full
  // UTC-12 through UTC+14 range also detects missing and repeated DST times.
  for (let offsetMinutes = -12 * 60; offsetMinutes <= 14 * 60; offsetMinutes += 15) {
    const candidate = new Date(wallTimeAsUtc - offsetMinutes * 60_000);
    const parts = Object.fromEntries(
      formatter.formatToParts(candidate).map(({ type, value }) => [type, value]),
    );

    if (
      Number(parts.year) === year &&
      Number(parts.month) === month &&
      Number(parts.day) === day &&
      Number(parts.hour) === hour &&
      Number(parts.minute) === minute
    ) {
      matches.push(candidate);
    }
  }

  if (matches.length !== 1) {
    throw new EpisodeValidationError(
      matches.length === 0
        ? "That local time does not exist in this timezone."
        : "That local time occurs twice. Choose another time.",
    );
  }

  if (matches[0].getTime() <= now.getTime()) {
    throw new EpisodeValidationError("Choose a future start time.");
  }

  return matches[0];
}
