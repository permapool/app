"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MissionDetail({ mission }: { mission: any }) {
  const router = useRouter();

  // Escape key closes modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/missions");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-background max-w-lg w-[90vw] relative shadow-solid border-foreground border-[1px]">
        <div className="flex justify-between border-b p-2 border-foreground">
          <h2 className="text-foreground">{mission.title}</h2>
          <button
            onClick={() => router.push("/missions")}
            className="flex top-3 right-3 rounded-full text-white h-full w-[50]"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          <section className="mt-4 space-y-3">
            <h3>Mission</h3>
            <p className="text-foreground">{mission.mission}</p>
            <h3>Rewards</h3>
            <p className="text-foreground">{mission.rewards}</p>
            <div>
              <h3>Requirements</h3>
              <ul className="list-disc ml-6 mt-1 space-y-1 list-['-']">
                {mission.requirements.map((req: string, i: number) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
            <br />
            <h3>Deadline</h3>
            <p className="text-foreground">{mission.deadline}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
