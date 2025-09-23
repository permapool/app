import Link from "next/link";

const missions = [
  {
    id: "hz001",
    title: "HZ001 · Higher Together",
    summary: "Create a video bumper.",
  },
];

export default function MissionsPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <header className="mb-8">
        <h1>Missions</h1>
        <p className="mt-2 text-foreground">
          Broadcast calls for bumpers, intros, and IDs. Short missions, open to all.
        </p>
      </header>
      <ul className="space-y-6">
        {missions.map((mission) => (
          <li key={mission.id} className="border-t p-2 hover:bg-gray-50">
            <h3><Link
              href={`/missions/${mission.id}`}
              className="text-xl hover:underline"
            >
              {mission.title}
            </Link></h3>
            <p>{mission.summary}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
