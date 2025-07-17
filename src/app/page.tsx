import { Metadata } from "next";
import Home from "~/components/Home";
import { getAppUrl } from "~/lib/data";

const appUrl = getAppUrl();

const frame = {
  version: "next",
  imageUrl: `${appUrl}/frame-image.png`,
  button: {
    title: "Open",
    action: {
      type: "launch_frame",
      name: "Higher.zip",
      url: appUrl,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#000000",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Higher.zip",
    openGraph: {
      title: "Higher.zip",
      description: "Higher higher higher",
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
