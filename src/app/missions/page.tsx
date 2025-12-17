import Link from "next/link";
import { Metadata } from "next";

const missions = [
  {
    id: "hz001",
    title: "HZ001 · Higher Together",
    summary: "Create a video bumper.",
    status: "Published",
  },
  {
    id: "hz002",
    title: "HZ002 · Higher Forever",
    summary: "Create a looping video.",
    status: "Published",
  },
  {
    id: "hz003",
    title: "HZ003 · Higher Amplified",
    summary: "Create an audio piece.",
    status: "Published",
  },
  {
    id: "hz004",
    title: "HZ004 · ???????????????",
    summary: "??????????????????????",
    status: "Incoming",
  },
];

export const metadata: Metadata = {
  title: "Next on higher.zip",
  description:
    "A sneak peek at what’s coming soon to higher.zip — our evolving digital television network. Explore upcoming shows, features, and experiments on the horizon.",
};

type Status =
  | "Incoming"
  | "Active"
  | "In Review"
  | "Published"
  | "Archived"
  | "Shelved";

const statusStyles: Record<Status, string> = {
  Incoming: "bg-violet-100 text-violet-800 border border-violet-200",
  Active: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  "In Review": "bg-amber-100 text-amber-900 border border-amber-200",
  Published: "bg-sky-100 text-sky-800 border border-sky-200",
  Archived: "bg-zinc-100 text-zinc-800 border border-zinc-200",
  Shelved: "bg-rose-100 text-rose-800 border border-rose-200",
};


function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

export default function MissionsPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <header className="mb-10">
        <h1>Missions</h1>
        <p className="mt-2 text-foreground max-w-3xl">
          Broadcast calls for bumpers, intros, and IDs. Short missions, open to all.
        </p>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="flex flex-col justify-between border border-zinc-200 p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div>
              <div>
                <StatusBadge status={mission.status as Status} />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">
                  <Link
                    href={`/missions/${mission.id}`}
                    className="hover:underline"
                  >
                    {mission.title}
                  </Link>
                </h3>
                
              </div>
              <p className="text-sm text-zinc-600">{mission.summary}</p>
            </div>

            <div className="mt-4">
              <Link
                href={`/missions/${mission.id}`}
                className="inline-block text-xs font-medium uppercase tracking-wide text-emerald-700 hover:text-emerald-900"
              >
                View Mission →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
