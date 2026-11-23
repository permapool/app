import { getVerifiedPrivyUser } from "~/lib/auth/privy-server";
import { syncPrivyUser } from "~/lib/auth/sync-user";

export class CurrentUserAuthenticationError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "CurrentUserAuthenticationError";
  }
}

export async function getCurrentUser(request: Request) {
  let privyUser;

  try {
    privyUser = await getVerifiedPrivyUser(request);
  } catch {
    throw new CurrentUserAuthenticationError();
  }

  return syncPrivyUser(privyUser);
}
