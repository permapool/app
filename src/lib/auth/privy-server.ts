import { PrivyClient, type LinkedAccount, type User as PrivyUser } from "@privy-io/node";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

let cachedClient: PrivyClient | null = null;

function getPrivyClient() {
  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
    throw new Error("Missing Privy server environment variables");
  }

  if (!cachedClient) {
    cachedClient = new PrivyClient({
      appId: PRIVY_APP_ID,
      appSecret: PRIVY_APP_SECRET,
    });
  }

  return cachedClient;
}

export function getAccessTokenFromRequest(request: Request) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim() || null;
}

export async function getVerifiedPrivyUser(request: Request): Promise<PrivyUser> {
  const accessToken = getAccessTokenFromRequest(request);

  if (!accessToken) {
    throw new Error("Missing Privy access token");
  }

  const privy = getPrivyClient();
  const payload = await privy.utils().auth().verifyAccessToken(accessToken);

  return privy.users()._get(payload.user_id);
}

export function getPrivyEmail(user: PrivyUser) {
  const linkedEmail = user.linked_accounts.find(
    (account): account is Extract<LinkedAccount, { type: "email" }> =>
      account.type === "email",
  );

  return linkedEmail?.address ?? null;
}

export function getPrivyWallets(user: PrivyUser) {
  return user.linked_accounts.filter(
    (account): account is Extract<LinkedAccount, { type: "wallet" }> =>
      account.type === "wallet",
  );
}
