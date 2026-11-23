import { getAppUrl } from "~/lib/data";

export function episodeCanonicalUrl(path: string): string {
  const appUrl = getAppUrl() || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return new URL(path, appUrl).toString();
}
