import type { AppUser } from "~/types/auth";

export type AppRoleName = "admin" | "producer" | "audience";

export function isAppRoleName(value: unknown): value is AppRoleName {
  return value === "admin" || value === "producer" || value === "audience";
}

export function getRoleNames(user: Pick<AppUser, "roles">): string[] {
  return user.roles.map((role) => role.name);
}

export function hasRole(user: Pick<AppUser, "roles">, role: AppRoleName): boolean {
  return getRoleNames(user).includes(role);
}
