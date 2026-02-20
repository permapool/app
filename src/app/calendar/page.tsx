import type { Metadata } from "next";
import CalendarContent from "./CalendarContent";
import { getAppUrl } from "~/lib/data";

const appUrl = getAppUrl();
const calendarUrl = `${appUrl}/calendar`;

const miniAppEmbed = {
  version: "1",
  imageUrl: `${appUrl}/calendar.png`,
  button: {
    title: "Open",
    action: {
      type: "launch_miniapp",
      name: "HIGHER.ZIP",
      url: calendarUrl,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#000000",
    },
  },
};

const legacyFrameEmbed = {
  ...miniAppEmbed,
  button: {
    ...miniAppEmbed.button,
    action: {
      ...miniAppEmbed.button.action,
      type: "launch_frame",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "HIGHER.ZIP Calendar",
    openGraph: {
      title: "HIGHER.ZIP Calendar",
      description: "Higher Calendar on HIGHER.ZIP",
      images: [`${appUrl}/calendar.png`],
    },
    other: {
      "fc:miniapp": JSON.stringify(miniAppEmbed),
      "fc:frame": JSON.stringify(legacyFrameEmbed),
    },
  };
}

export default function CalendarPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1100px] items-start px-4 pb-20 pt-28 md:pt-32">
      <CalendarContent />
    </main>
  );
}
