import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EpisodePageContent from "~/components/episodes/EpisodePageContent";
import { getPublicEpisodeBySlug } from "~/lib/episodes/public";
import { episodeCanonicalUrl } from "~/lib/episodes/url";

type EpisodePageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: EpisodePageProps): Promise<Metadata> {
  const { slug } = await params;
  const episode = await getPublicEpisodeBySlug(slug);
  if (!episode) return notFound();

  const url = episodeCanonicalUrl(episode.path);
  const description = episode.shortDescription || "A HIGHER.ZIP Community Session.";

  return {
    title: episode.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: episode.title,
      description,
      url,
      type: "website",
    },
  };
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const { slug } = await params;
  const episode = await getPublicEpisodeBySlug(slug);
  if (!episode) return notFound();

  return <EpisodePageContent episode={episode} canonicalUrl={episodeCanonicalUrl(episode.path)} />;
}
