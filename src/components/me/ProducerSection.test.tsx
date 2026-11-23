// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const privy = vi.hoisted(() => ({ getAccessToken: vi.fn() }));

vi.mock("@privy-io/react-auth", () => ({
  usePrivy: () => ({ getAccessToken: privy.getAccessToken }),
}));

import ProducerSection from "./ProducerSection";

const REQUEST_ID = "11111111-1111-4111-8111-111111111111";

describe("ProducerSection", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    privy.getAccessToken.mockReset();
    privy.getAccessToken.mockResolvedValue("token");
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", { randomUUID: () => REQUEST_ID });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("submits a standalone Episode, shows its path, and retains success across refresh", async () => {
    fetchMock.mockImplementation((path: string, options?: RequestInit) => {
      if (path === "/api/me/sessions") {
        return Promise.resolve(Response.json({ shows: [], episodes: [] }));
      }
      if (path === "/api/episodes" && options?.method === "POST") {
        return Promise.resolve(Response.json({
          episodeId: REQUEST_ID,
          path: "/episodes/friday-gathering-id",
          state: "SCHEDULED",
          scheduledStartAt: "2030-07-10T23:30:00.000Z",
          timezone: "America/New_York",
        }, { status: 201 }));
      }
      throw new Error("Unexpected request");
    });

    const view = render(<ProducerSection userId="host-id" />);
    fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "Friday Gathering" } });
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2030-07-10" } });
    fireEvent.change(screen.getByLabelText("Time"), { target: { value: "19:30" } });
    fireEvent.change(screen.getByLabelText("Timezone (IANA)"), { target: { value: "America/New_York" } });
    fireEvent.change(screen.getByLabelText("Short description"), { target: { value: "Come together" } });
    fireEvent.change(screen.getByLabelText("Public join URL"), { target: { value: "https://meet.example.com/room" } });
    fireEvent.click(screen.getByRole("button", { name: "Schedule session" }));

    expect(await screen.findByText("Session scheduled.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "/episodes/friday-gathering-id" }).getAttribute("href"))
      .toBe("/episodes/friday-gathering-id");
    const post = fetchMock.mock.calls.find(([path]) => path === "/api/episodes");
    expect(JSON.parse(post?.[1]?.body as string)).toMatchObject({
      requestId: REQUEST_ID,
      title: "Friday Gathering",
      showId: null,
      timezone: "America/New_York",
    });

    view.unmount();
    render(<ProducerSection userId="host-id" />);
    expect(await screen.findByText("Session scheduled.")).toBeTruthy();
    expect(fetchMock.mock.calls.filter(([path]) => path === "/api/episodes")).toHaveLength(1);
  });

  it("shows assigned Shows and future Episode details", async () => {
    fetchMock.mockResolvedValue(Response.json({
      shows: [{ id: "show-id", title: "Community Hour" }],
      episodes: [{
        id: "episode-id",
        slug: "community-hour-id",
        title: "Community Hour Meetup",
        scheduledStartAt: "2030-07-10T23:30:00.000Z",
        timezone: "America/New_York",
        state: "SCHEDULED",
        show: { title: "Community Hour" },
        path: "/episodes/community-hour-id",
      }],
    }));

    render(<ProducerSection userId="host-id" />);

    expect(await screen.findByText("Community Hour Meetup")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Community Hour Meetup" }).getAttribute("href"))
      .toBe("/episodes/community-hour-id");
    expect(screen.getByText(/America\/New_York/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "/episodes/community-hour-id" }).getAttribute("href"))
      .toBe("/episodes/community-hour-id");
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Community Hour" })).toBeTruthy();
    });
  });
});
