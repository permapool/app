import Link from "next/link";
import type { PublicEpisode } from "~/lib/episodes/public";
import type { ScheduleGroups } from "~/lib/episodes/group";
import { sourceTimeLabel } from "~/lib/episodes/time";
import EpisodeTime from "./EpisodeTime";

function EpisodeRow({ episode, region }: { episode: PublicEpisode; region: keyof ScheduleGroups }) {
  const active = episode.state === "SCHEDULED" || episode.state === "LIVE";
  const cancelled = episode.state === "CANCELLED";
  const canCalendar = active && region !== "past";

  return (
    <li className={`space-y-3 border border-black p-4 md:p-5 ${cancelled ? "opacity-60" : ""} ${region === "live" ? "border-2" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wider">{episode.state === "LIVE" ? "Live now" : episode.state}</span>
        {episode.show ? <span className="text-xs">{episode.show.title}</span> : null}
      </div>
      <h3 className="!m-0"><Link href={episode.path} className="underline">{episode.title}</Link></h3>
      <EpisodeTime
        instant={episode.scheduledStartAt}
        timezone={episode.timezone}
        sourceLabel={sourceTimeLabel(episode.scheduledStartAt, episode.timezone)}
        compact
      />
      <p className="text-sm">{episode.hosts.length
        ? episode.hosts.map((host) => host.displayName || `@${host.username}`).join(", ")
        : "Hosts to be announced"}</p>
      {episode.shortDescription ? <p className="text-sm whitespace-pre-wrap">{episode.shortDescription}</p> : null}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href={episode.path} className="underline">Session details</Link>
        {active && region !== "past" && episode.publicJoinUrl ? (
          <a href={episode.publicJoinUrl} target="_blank" rel="noopener noreferrer" className="bg-[var(--green)] px-3 py-2 text-white">Join</a>
        ) : null}
        {canCalendar ? <a href={`${episode.path}/calendar`} className="underline">Add to calendar</a> : null}
      </div>
    </li>
  );
}

export default function ScheduleContent({ groups }: { groups: ScheduleGroups }) {
  return (
    <main className="mx-auto min-h-screen max-w-[960px] space-y-10 px-4 pb-20 pt-28 md:pt-32">
      <header className="space-y-3 border-b border-black pb-6">
        <p className="text-xs uppercase tracking-widest text-[var(--green)]">HIGHER.ZIP Community Sessions</p>
        <h1 className="!m-0">Schedule</h1>
        <p>Find a gathering, join in, and come back for what happened.</p>
      </header>

      <section className="space-y-4" aria-labelledby="live-heading">
        <h2 id="live-heading">Live</h2>
        {groups.live.length ? <ul className="space-y-3">{groups.live.map((episode) => <EpisodeRow key={episode.id} episode={episode} region="live" />)}</ul>
          : <p className="text-sm">Nothing live right now.</p>}
      </section>

      <section className="space-y-4" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading">Upcoming</h2>
        {groups.upcoming.length ? <ul className="space-y-3">{groups.upcoming.map((episode) => <EpisodeRow key={episode.id} episode={episode} region="upcoming" />)}</ul>
          : <div className="space-y-2 border border-black p-4"><p>No upcoming sessions yet.</p><Link href="/me" className="underline">Host a session</Link></div>}
      </section>

      <section className="space-y-4" aria-labelledby="past-heading">
        <h2 id="past-heading">Past</h2>
        {groups.past.length ? <ul className="space-y-3">{groups.past.map((episode) => <EpisodeRow key={episode.id} episode={episode} region="past" />)}</ul>
          : <p className="text-sm">Past sessions will appear here.</p>}
      </section>
    </main>
  );
}
