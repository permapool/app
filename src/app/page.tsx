import { Metadata } from "next";
import Home from "~/components/Home";
import { getAppUrl } from "~/lib/data";

const appUrl = getAppUrl();

const frame = {
  version: "next",
  imageUrl: `${appUrl}/frame-image.png`,
  button: {
    title: "GM",
    action: {
      type: "launch_frame",
      name: "Higher",
      url: appUrl,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#222222",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Higher",
    openGraph: {
      title: "Higher",
      description: "Higher permapool",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function HomePage() {
  return (
    <Home />
  );
}
