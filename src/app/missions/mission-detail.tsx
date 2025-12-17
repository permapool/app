"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Mission {
  title: string;
  mission: string;
  rewards: string;
  requirements: string[];
  deadline: string;
  announcement?: {
    farcaster?: string;
    x?: string;
  } | null;
  entries?: {
    user: string;
    platform: string;
    link: string;
  }[];
}

export default function MissionDetail({ mission }: { mission: Mission }) {
  const router = useRouter();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/missions");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-background w-[90vw] relative shadow-solid border-foreground border-[1px] animate-fadeSlideUp">
        <div className="flex justify-between border-b p-2 border-foreground">
          <h2 className="text-foreground">{mission.title}</h2>
          <button
            onClick={() => router.push("/missions")}
            className="flex top-3 right-3 rounded-full text-white h-full w-[50]"
          >
            ✕
          </button>
        </div>
        <div className="p-4 max-h-[66vh] overflow-y-auto">
          <section className="mt-4 space-y-3">
            <h3>Mission</h3>
            <p className="text-foreground">{mission.mission}</p>

            <h3>Rewards</h3>
            <p className="text-foreground">{mission.rewards}</p>

            {mission.announcement && (
              <div className="mt-6">
                <h3>Announcement</h3>
                <ul className="ml-6 mt-2 list-disc text-sm">
                  {mission.announcement.farcaster && (
                    <li>
                      <a
                        href={mission.announcement.farcaster}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-foreground hover:text-green-600"
                      >
                        Farcaster Launch Post
                      </a>
                    </li>
                  )}
                  {mission.announcement.x && (
                    <li>
                      <a
                        href={mission.announcement.x}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-foreground hover:text-green-600"
                      >
                        X / Twitter Announcement
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div>
              <h3>Requirements</h3>
              <ul className="list-disc ml-6 mt-1 space-y-1 list-['-']">
                {mission.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>

            <br />
            <h3>Deadline</h3>
            <p className="text-foreground">{mission.deadline}</p>

            {mission.entries && mission.entries.length > 0 && (
              <div className="mt-6">
                <h3>Entries</h3>
                <table className="mt-2 w-full border border-zinc-700 text-sm">
                  <thead className="sticky top-0 bg-zinc-900 text-white z-10">
                    <tr>
                      <th className="text-left px-3 py-2 w-1/3">User</th>
                      <th className="text-left px-3 py-2">Entry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mission.entries.map((entry, i) => {
                      const profileLink =
                        entry.platform === "Farcaster"
                          ? `https://warpcast.com/${entry.user.replace(
                              "@",
                              ""
                            )}`
                          : `https://x.com/${entry.user.replace("@", "")}`;

                      return (
                        <tr key={i} className="border-t border-zinc-800">
                          <td className="px-3 py-2">
                            <a
                              href={profileLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-foreground hover:text-green-500"
                            >
                              {entry.user}
                            </a>
                          </td>
                          <td className="px-3 py-2">
                            <a
                              href={entry.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-green-600 hover:text-green-400"
                            >
                              View Entry
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
