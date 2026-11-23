import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  lookup: vi.fn(),
  notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/lib/episodes/public", () => ({ getPublicEpisodeBySlug: mock.lookup }));
vi.mock("next/navigation", () => ({ notFound: mock.notFound }));
vi.mock("~/components/episodes/EpisodePageContent", () => ({
  default: ({ episode }: { episode: { title: string } }) => <div>{episode.title}</div>,
}));

import EpisodePage, { generateMetadata } from "./page";

function episode(slug: string) {
  return {
    id: "episode-id",
    slug,
    title: "Community Gathering",
    shortDescription: "A place to gather.",
    scheduledStartAt: "2030-07-10T23:30:00.000Z",
    timezone: "America/New_York",
    state: "SCHEDULED",
    publicJoinUrl: null,
    show: null,
    hosts: [],
    path: `/episodes/${slug}`,
  };
}

describe("/episodes/[slug]", () => {
  beforeEach(() => {
    mock.lookup.mockReset();
    mock.notFound.mockClear();
    vi.stubEnv("NEXT_PUBLIC_URL", "https://higher.zip");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("renders a public Episode without authentication", async () => {
    mock.lookup.mockResolvedValue(episode("community-gathering-uuid"));

    const element = await EpisodePage({ params: Promise.resolve({ slug: "community-gathering-uuid" }) });

    expect(renderToStaticMarkup(element)).toContain("Community Gathering");
    expect(mock.lookup).toHaveBeenCalledWith("community-gathering-uuid");
  });

  it("uses the immutable path for title, description, canonical and Open Graph metadata", async () => {
    mock.lookup.mockResolvedValue(episode("community-gathering-uuid"));

    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "community-gathering-uuid" }) });

    expect(metadata.title).toBe("Community Gathering");
    expect(metadata.description).toBe("A place to gather.");
    expect(metadata.alternates?.canonical).toBe("https://higher.zip/episodes/community-gathering-uuid");
    expect(metadata.openGraph).toMatchObject({
      title: "Community Gathering",
      description: "A place to gather.",
      url: "https://higher.zip/episodes/community-gathering-uuid",
    });
  });

  it("404s unknown Episodes in both page and metadata", async () => {
    mock.lookup.mockResolvedValue(null);

    await expect(EpisodePage({ params: Promise.resolve({ slug: "missing-page" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(generateMetadata({ params: Promise.resolve({ slug: "missing-metadata" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mock.notFound).toHaveBeenCalledTimes(2);
  });
});
