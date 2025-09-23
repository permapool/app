import { notFound } from "next/navigation";
import MissionDetail from "../mission-detail";

const missions = {
  hz001: {
    title: "HZ001 · Higher Together",
    mission: "Create a short video bumper.",
    rewards: "300,000 $HIGHER",
    requirements: [
      "Length: 11+ seconds",
      "Format: 16:9 horizontal",
      "Must include motion",
      "Media: iPhone, animation, Blender, Midjourney… anything goes",
    ],
    deadline: "Monday, October 6 · 12PM EST",
  },
};

export default async function MissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const mission = missions[id as keyof typeof missions];
  if (!mission) return notFound();

  return <MissionDetail mission={mission} />;
}
