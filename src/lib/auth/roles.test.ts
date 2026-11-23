import { describe, expect, it } from "vitest";
import { getRoleNames, hasRole, isAppRoleName } from "./roles";

describe("application roles", () => {
  it.each(["admin", "producer", "audience"])("recognizes %s", (role) => {
    expect(isAppRoleName(role)).toBe(true);
  });

  it("preserves unknown role names without granting privilege", () => {
    const user = { roles: [{ id: "1", name: "future-role" }] };

    expect(getRoleNames(user)).toEqual(["future-role"]);
    expect(isAppRoleName("future-role")).toBe(false);
    expect(hasRole(user, "admin")).toBe(false);
    expect(hasRole(user, "producer")).toBe(false);
  });

  it("checks exact role names", () => {
    const user = { roles: [{ id: "1", name: "producer" }] };

    expect(hasRole(user, "producer")).toBe(true);
    expect(hasRole(user, "admin")).toBe(false);
  });
});
