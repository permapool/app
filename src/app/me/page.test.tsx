// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppUser } from "~/types/auth";

const auth = vi.hoisted(() => ({ user: null as AppUser | null }));

vi.mock("~/components/providers/AuthProvider", () => ({
  useAuth: () => ({ user: auth.user, loading: false }),
}));
vi.mock("@privy-io/react-auth", () => ({
  usePrivy: () => ({ getAccessToken: vi.fn(), linkWallet: vi.fn() }),
}));
vi.mock("~/components/me/ProducerSection", () => ({
  default: () => <section aria-label="Producer"><h2>Producer</h2><h3>Host a Session</h3></section>,
}));
vi.mock("~/components/me/AdminSection", () => ({
  default: () => <section aria-label="Admin"><h2>Admin</h2><h3>Producer access</h3></section>,
}));

import MePage from "./page";

function user(...roles: string[]): AppUser {
  return {
    userId: "user-id",
    privyId: "privy-id",
    email: "host@example.test",
    username: "host",
    displayName: "Host",
    hasCustomHandle: true,
    wallets: [{ id: "wallet-id", address: "0x1234567890abcdef", chainId: 8453 }],
    roles: roles.map((name, index) => ({ id: String(index), name })),
  };
}

afterEach(() => {
  cleanup();
  auth.user = null;
});

describe("/me producer visibility", () => {
  it.each(["producer", "admin"])("shows Producer controls to %s", (role) => {
    auth.user = user(role);
    render(<MePage />);

    expect(screen.getByRole("heading", { name: "Producer" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Host a Session" })).toBeTruthy();
  });

  it("shows Admin controls only to admins", () => {
    auth.user = user("admin");
    render(<MePage />);
    expect(screen.getByRole("heading", { name: "Admin" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Producer access" })).toBeTruthy();
  });

  it.each([[], ["audience"], ["producer"]])("hides Admin controls from non-admin roles", (...roles) => {
    auth.user = user(...roles);
    render(<MePage />);
    expect(screen.queryByRole("heading", { name: "Admin" })).toBeNull();
  });

  it.each([[], ["audience"], ["future-role"]])("hides Producer controls from non-privileged roles", (...roles) => {
    auth.user = user(...roles);
    render(<MePage />);

    expect(screen.queryByRole("heading", { name: "Producer" })).toBeNull();
  });

  it("keeps account identity, roles, wallet, and username editing on /me", () => {
    auth.user = user("producer");
    render(<MePage />);

    expect(screen.getByText("@host")).toBeTruthy();
    expect(screen.getByText("host@example.test")).toBeTruthy();
    expect(screen.getByText("producer")).toBeTruthy();
    expect(screen.getByText(/0x1234.*cdef/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Link wallet" })).toBeTruthy();
    const username = screen.getByPlaceholderText("new username") as HTMLInputElement;
    fireEvent.change(username, { target: { value: "new-host" } });
    expect(username.value).toBe("new-host");
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });
});
