import Link from "next/link";
import type { PublicEpisode } from "~/lib/episodes/public";
import { sourceTimeLabel } from "~/lib/episodes/time";
import EpisodeTime from "./EpisodeTime";
import ShareEpisodeButton from "./ShareEpisodeButton";

const STATE_COPY = {
  SCHEDULED: { label: "Scheduled", detail: "Join the gathering at the scheduled time." },
  LIVE: { label: "Live now", detail: "This gathering is underway." },
  COMPLETED: { label: "Completed", detail: "This gathering has ended. No replay is available here yet." },
  CANCELLED: { label: "Cancelled", detail: "This gathering was cancelled." },
} as const;

export default function EpisodePageContent({
  episode,
  canonicalUrl,
}: {
  episode: PublicEpisode;
  canonicalUrl: string;
}) {
  const state = STATE_COPY[episode.state];
  const canJoin = episode.state === "SCHEDULED" || episode.state === "LIVE";
  const sourceLabel = sourceTimeLabel(episode.scheduledStartAt, episode.timezone);

  return (
    <main className="mx-auto min-h-screen max-w-[960px] px-4 pb-20 pt-28 md:pt-32">
      <article className="w-full space-y-8">
        <header className="space-y-4 border-b border-black pb-6">
          <p className="text-xs uppercase tracking-widest text-[var(--green)]">HIGHER.ZIP Community Session</p>
          <h1 className="!m-0 break-words">{episode.title}</h1>
          <p className="text-sm uppercase">{state.label}</p>
          <p className="text-base">{state.detail}</p>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          <section className="space-y-3">
            <h2>When</h2>
            <EpisodeTime
              instant={episode.scheduledStartAt}
              timezone={episode.timezone}
              sourceLabel={sourceLabel}
            />
          </section>
          <section className="space-y-3">
            <h2>With</h2>
            <p>{episode.hosts.length > 0
              ? episode.hosts.map((host) => host.displayName || `@${host.username}`).join(", ")
              : "Hosts to be announced"}</p>
            {episode.show ? <p className="text-sm">Show: {episode.show.title}</p> : null}
          </section>
        </div>

        {episode.shortDescription ? (
          <section className="space-y-3 border-t border-black pt-5">
            <h2>About this gathering</h2>
            <p className="whitespace-pre-wrap">{episode.shortDescription}</p>
          </section>
        ) : null}

        <section className="space-y-4 border-t border-black pt-5">
          <h2>Gather</h2>
          <div className="flex flex-wrap items-center gap-3">
            {canJoin && episode.publicJoinUrl ? (
              <a
                href={episode.publicJoinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[var(--green)] px-4 py-2 text-sm text-white"
              >
                Join session
              </a>
            ) : null}
            {canJoin ? (
              <a href={`${episode.path}/calendar`} className="border border-black px-4 py-2 text-sm">
                Add to calendar
              </a>
            ) : null}
            <ShareEpisodeButton url={canonicalUrl} />
          </div>
          {canJoin && !episode.publicJoinUrl ? (
            <p className="text-sm">Join details will appear here when available.</p>
          ) : null}
          <div className="space-y-1 text-xs">
            <p>Canonical link</p>
            <code className="block break-all">{canonicalUrl}</code>
          </div>
        </section>

        <Link href="/" className="inline-block border-b border-black text-sm">Back to HIGHER.ZIP</Link>
      </article>
    </main>
  );
}
