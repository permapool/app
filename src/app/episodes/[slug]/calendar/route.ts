import { notFound } from "next/navigation";
import { episodeCalendarIcs } from "~/lib/episodes/calendar";
import { getPublicEpisodeBySlug } from "~/lib/episodes/public";
import { episodeCanonicalUrl } from "~/lib/episodes/url";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const episode = await getPublicEpisodeBySlug(slug);
  if (!episode) return notFound();

  const filename = `episode-${episode.slug.replace(/[^a-z0-9-]/gi, "-")}.ics`;

  return new Response(episodeCalendarIcs(episode, episodeCanonicalUrl(episode.path)), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
