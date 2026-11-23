import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  verify: vi.fn(),
  sync: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/lib/auth/privy-server", () => ({ getVerifiedPrivyUser: auth.verify }));
vi.mock("~/lib/auth/sync-user", () => ({ syncPrivyUser: auth.sync }));

import { CurrentUserAuthenticationError, getCurrentUser } from "./get-current-user";

describe("getCurrentUser", () => {
  beforeEach(() => {
    auth.verify.mockReset();
    auth.sync.mockReset();
  });

  it("resolves identity through Privy verification and the existing user sync", async () => {
    const request = new Request("https://higher.zip/api/example");
    const privyUser = { id: "privy-user" };
    const appUser = { userId: "db-user", roles: [] };
    auth.verify.mockResolvedValue(privyUser);
    auth.sync.mockResolvedValue(appUser);

    await expect(getCurrentUser(request)).resolves.toBe(appUser);
    expect(auth.verify).toHaveBeenCalledWith(request);
    expect(auth.sync).toHaveBeenCalledWith(privyUser);
  });

  it("sanitizes Privy authentication failures", async () => {
    auth.verify.mockRejectedValue(new Error("Privy token/provider detail"));

    await expect(getCurrentUser(new Request("https://higher.zip"))).rejects.toMatchObject({
      name: "CurrentUserAuthenticationError",
      message: "Authentication required",
    });
    expect(auth.sync).not.toHaveBeenCalled();
  });

  it("does not classify user-sync failures as authentication failures", async () => {
    const failure = new Error("Database unavailable");
    auth.verify.mockResolvedValue({ id: "privy-user" });
    auth.sync.mockRejectedValue(failure);

    await expect(getCurrentUser(new Request("https://higher.zip"))).rejects.toBe(failure);
    expect(failure).not.toBeInstanceOf(CurrentUserAuthenticationError);
  });
});
