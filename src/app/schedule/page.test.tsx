import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("~/lib/episodes/public", () => ({ listPublicEpisodes: mock.list }));
vi.mock("~/components/episodes/ScheduleContent", () => ({
  default: ({ groups }: { groups: { live: unknown[]; upcoming: unknown[]; past: unknown[] } }) => (
    <div>Live {groups.live.length} Upcoming {groups.upcoming.length} Past {groups.past.length}</div>
  ),
}));

import SchedulePage, { generateMetadata } from "./page";

describe("/schedule", () => {
  beforeEach(() => {
    mock.list.mockReset();
    vi.stubEnv("NEXT_PUBLIC_URL", "https://higher.zip");
  });

  it("loads public sessions without auth and groups them for rendering", async () => {
    mock.list.mockResolvedValue([]);
    const html = renderToStaticMarkup(await SchedulePage());

    expect(html).toContain("Live 0 Upcoming 0 Past 0");
    expect(mock.list).toHaveBeenCalledOnce();
    expect(mock.list.mock.calls[0][0]).toBeInstanceOf(Date);
  });

  it("sets the public schedule canonical metadata", () => {
    const metadata = generateMetadata();
    expect(metadata.title).toBe("HIGHER.ZIP Schedule");
    expect(metadata.alternates?.canonical).toBe("https://higher.zip/schedule");
  });
});
