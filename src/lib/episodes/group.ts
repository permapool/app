import type { PublicEpisode } from "~/lib/episodes/public";

export type ScheduleGroups = {
  live: PublicEpisode[];
  upcoming: PublicEpisode[];
  past: PublicEpisode[];
};

function ascending(a: PublicEpisode, b: PublicEpisode) {
  return a.scheduledStartAt.localeCompare(b.scheduledStartAt) || a.id.localeCompare(b.id);
}

function descending(a: PublicEpisode, b: PublicEpisode) {
  return b.scheduledStartAt.localeCompare(a.scheduledStartAt) || a.id.localeCompare(b.id);
}

export function groupPublicEpisodes(episodes: PublicEpisode[], now: Date): ScheduleGroups {
  const groups: ScheduleGroups = { live: [], upcoming: [], past: [] };
  const cutoff = now.toISOString();

  for (const episode of episodes) {
    if (episode.state === "LIVE") groups.live.push(episode);
    else if (episode.state === "COMPLETED" || episode.scheduledStartAt < cutoff) groups.past.push(episode);
    else groups.upcoming.push(episode);
  }

  groups.live.sort(ascending);
  groups.upcoming.sort(ascending);
  groups.past.sort(descending);
  return groups;
}
