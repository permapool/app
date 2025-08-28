import { Metadata } from "next";
import { roadmap, type Status } from "./roadmap";

export const metadata: Metadata = {
  title: "Next on higher.zip",
  description:
    "A sneak peek at what’s coming soon to higher.zip — our evolving digital television network. Explore upcoming shows, features, and experiments on the horizon.",
};

const statusStyles: Record<Status, string> = {
  "Backlog":
    "bg-zinc-100 text-zinc-800 border border-zinc-200",
  "Pilot":
    "bg-violet-100 text-violet-800 border border-violet-200",
  "Scheduled":
    "bg-sky-100 text-sky-800 border border-sky-200",
  "In Production":
    "bg-amber-100 text-amber-900 border border-amber-200",
  "Now Airing":
    "bg-emerald-100 text-emerald-800 border border-emerald-200",
  "On Hold":
    "bg-rose-100 text-rose-800 border border-rose-200",
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

export default function NextOnHigherZipPage() {
  return (
    <main className="p-6">
      <h1>Next on ...</h1>
      <img src="/logo-full.svg" alt="Logo" />
      <p className="mt-4">
        Stay tuned for our upcoming programming schedule and network updates.
      </p>
      <h2>Broadcasting Blueprint</h2>

        <p className="mt-2">
          Below is our programming slate (fka. roadmap). This is what’s in the writers’ room, what’s on the
          production floor, and what’s going live.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {/* Legend */}
          {(Object.keys(statusStyles) as Status[]).map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
  

      {roadmap.map((phase) => (
        <section key={phase.phase} className="mt-10">
          <h3 className="mb-4">{phase.phase}</h3>
          <div className="overflow-x-auto border border-[var(--grey)]">
            <table className="w-full border-collapse text-base">
              <thead className="bg-[var(--amber)]">
                <tr>
                  <th className="text-left py-3 px-4 border-b">Date</th>
                  <th className="text-left py-3 px-4 border-b">Description</th>
                  <th className="text-right py-3 px-4 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {phase.items.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b align-top">{item.date}</td>
                    <td className="py-3 px-4 border-b align-top">{item.description}</td>
                    <td className="py-3 px-4 border-b align-top text-right">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </main>
  );
}
