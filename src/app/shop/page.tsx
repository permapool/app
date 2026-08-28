import type { Metadata } from "next";
import { getAppUrl } from "~/lib/data";
import ShopContent from "./ShopContent";

const appUrl = getAppUrl();

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "HIGHER.ZIP Shop",
    description: "Browse the HIGHER.ZIP shop.",
    openGraph: {
      title: "HIGHER.ZIP Shop",
      description: "Browse the HIGHER.ZIP shop.",
      images: [`${appUrl}/opengraph-image`],
    },
  };
}

export default function ShopPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1100px] items-start px-4 pb-20 pt-28 md:pt-32">
      <ShopContent />
    </main>
  );
}
