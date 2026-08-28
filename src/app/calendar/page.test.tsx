import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import CalendarPage from "./page";

describe("/calendar redirect", () => {
  it("redirects to /shop", () => {
    CalendarPage();
    expect(redirectMock).toHaveBeenCalledWith("/shop");
  });
});
