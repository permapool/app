import { getVerifiedPrivyUser } from "~/lib/auth/privy-server";
import { syncPrivyUser } from "~/lib/auth/sync-user";

export async function getCurrentUser(request: Request) {
  const privyUser = await getVerifiedPrivyUser(request);

  return syncPrivyUser(privyUser);
}
