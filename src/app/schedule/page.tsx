import type { Metadata } from "next";
import ScheduleContent from "~/components/episodes/ScheduleContent";
import { groupPublicEpisodes } from "~/lib/episodes/group";
import { listPublicEpisodes } from "~/lib/episodes/public";
import { episodeCanonicalUrl } from "~/lib/episodes/url";

export function generateMetadata(): Metadata {
  return {
    title: "HIGHER.ZIP Schedule",
    description: "Discover upcoming, live, and past HIGHER.ZIP Community Sessions.",
    alternates: { canonical: episodeCanonicalUrl("/schedule") },
  };
}

export default async function SchedulePage() {
  const now = new Date();
  const episodes = await listPublicEpisodes(now);
  return <ScheduleContent groups={groupPublicEpisodes(episodes, now)} />;
}
