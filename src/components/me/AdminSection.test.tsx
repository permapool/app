// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ token: vi.fn(), refresh: vi.fn() }));
vi.mock("@privy-io/react-auth", () => ({ usePrivy: () => ({ getAccessToken: mock.token }) }));
vi.mock("~/components/providers/AuthProvider", () => ({ useAuth: () => ({ refreshUser: mock.refresh }) }));

import AdminSection from "./AdminSection";

const TARGET = "11111111-1111-4111-8111-111111111111";
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mock.token.mockResolvedValue("token");
  mock.refresh.mockResolvedValue(undefined);
  fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ users: [
    { userId: TARGET, username: "host", displayName: "Host Name", roles: [] },
  ] }) });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("AdminSection", () => {
  it("lists only safe display fields and searches usernames/display names", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ users: [] }) });
    render(<AdminSection currentUserId="admin-id" />);
    expect(await screen.findByText("Host Name")).toBeTruthy();
    expect(screen.getByText("@host")).toBeTruthy();
    expect(screen.getByText("No producer access")).toBeTruthy();
    expect(screen.queryByText(/email|wallet|privy/i)).toBeNull();
    fireEvent.change(screen.getByPlaceholderText("Search username or display name"), { target: { value: "Host" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/admin/users?query=Host", expect.any(Object)));
  });

  it("grants then revokes producer and refreshes the signed-in user when targeted", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ userId: TARGET, producer: true }) });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ userId: TARGET, producer: false }) });
    render(<AdminSection currentUserId={TARGET} />);
    fireEvent.click(await screen.findByRole("button", { name: "Grant producer" }));
    expect(await screen.findByRole("button", { name: "Revoke producer" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Revoke producer" }));
    expect(await screen.findByRole("button", { name: "Grant producer" })).toBeTruthy();
    expect(mock.refresh).toHaveBeenCalledTimes(2);
    const mutations = fetchMock.mock.calls.filter(([, options]) => options?.method);
    expect(mutations.map(([path, options]) => [path, options.method])).toEqual([
      [`/api/admin/users/${TARGET}/producer`, "PUT"],
      [`/api/admin/users/${TARGET}/producer`, "DELETE"],
    ]);
  });
});
