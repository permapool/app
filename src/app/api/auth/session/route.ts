import { NextRequest } from "next/server";
import { getAccessTokenFromRequest, getVerifiedPrivyUser } from "~/lib/auth/privy-server";
import { syncPrivyUser } from "~/lib/auth/sync-user";

export async function GET(request: NextRequest) {
  const accessToken = getAccessTokenFromRequest(request);

  try {
    console.log("[auth/session] token_present=", Boolean(accessToken));

    if (!accessToken) {
      return Response.json({ error: "Missing Privy access token" }, { status: 401 });
    }

    const privyUser = await getVerifiedPrivyUser(request);
    console.log("[auth/session] privy_user_id=", privyUser.id);

    const user = await syncPrivyUser(privyUser);
    console.log("[auth/session] db_user_id=", user.userId);

    return Response.json(user);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to resolve current user";

    return Response.json({ error: message }, { status: 401 });
  }
}
