import { NextRequest } from "next/server";
import { getAccessTokenFromRequest, getVerifiedPrivyUser } from "~/lib/auth/privy-server";
import { syncPrivyUser } from "~/lib/auth/sync-user";

export async function GET(request: NextRequest) {
  const accessToken = getAccessTokenFromRequest(request);

  try {
    if (!accessToken) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const privyUser = await getVerifiedPrivyUser(request);
    const user = await syncPrivyUser(privyUser);

    return Response.json(user);
  } catch (error) {
    console.error("[auth/session] failed to resolve authenticated user", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return Response.json({ error: "Unable to authenticate" }, { status: 401 });
  }
}
