import { Liveblocks } from "@liveblocks/node";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenFromRequest, getVerifiedPrivyUser } from "~/lib/auth/privy-server";
import { syncPrivyUser } from "~/lib/auth/sync-user";

const LIVEBLOCKS_ROOM_ID = "home-page";
const GUEST_COOKIE_NAME = "higher_liveblocks_guest";
const GUEST_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type LiveblocksAuthRequestBody = {
  room?: string;
};

type LiveblocksUserInfo = {
  name: string;
  username?: string;
  displayName?: string;
  role: "guest" | "user" | "moderator" | "admin";
  authType: "anonymous" | "privy";
};

type RateLimitResult = {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
};

let liveblocksClient: Liveblocks | null = null;
let ratelimit: Ratelimit | null = null;
let roomSetupPromise: Promise<unknown> | null = null;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getLiveblocksClient() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;

  if (!secret) {
    throw new Error("Missing LIVEBLOCKS_SECRET_KEY");
  }

  if (!liveblocksClient) {
    liveblocksClient = new Liveblocks({ secret });
  }

  return liveblocksClient;
}

function getRateLimiter() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (isProduction()) {
      throw new Error("Missing Upstash Redis environment variables");
    }

    return null;
  }

  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      prefix: "higher:liveblocks-auth",
    });
  }

  return ratelimit;
}

async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const limiter = getRateLimiter();

  if (!limiter) {
    return { success: true };
  }

  return limiter.limit(key);
}

function rateLimitedResponse(result: RateLimitResult) {
  const headers = new Headers();

  if (result.limit !== undefined) {
    headers.set("X-RateLimit-Limit", String(result.limit));
  }

  if (result.remaining !== undefined) {
    headers.set("X-RateLimit-Remaining", String(result.remaining));
  }

  if (result.reset !== undefined) {
    headers.set("X-RateLimit-Reset", String(result.reset));
  }

  return NextResponse.json({ error: "Too many Liveblocks auth attempts" }, { status: 429, headers });
}

function getForwardedIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function isValidGuestId(value: string | undefined) {
  return Boolean(value && UUID_PATTERN.test(value));
}

function getGuestId(request: NextRequest) {
  const cookieGuestId = request.cookies.get(GUEST_COOKIE_NAME)?.value;

  if (isValidGuestId(cookieGuestId)) {
    return { guestId: cookieGuestId as string, shouldSetCookie: false };
  }

  return { guestId: crypto.randomUUID(), shouldSetCookie: true };
}

function setGuestCookie(response: NextResponse, guestId: string) {
  response.cookies.set({
    name: GUEST_COOKIE_NAME,
    value: guestId,
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE_SECONDS,
  });
}

async function ensureHomeRoom() {
  if (!roomSetupPromise) {
    roomSetupPromise = getLiveblocksClient()
      .upsertRoom(LIVEBLOCKS_ROOM_ID, {
        update: {
          defaultAccesses: ["room:write"],
        },
        create: {
          defaultAccesses: ["room:write"],
        },
      })
      .catch((error: unknown) => {
        roomSetupPromise = null;
        throw error;
      });
  }

  return roomSetupPromise;
}

async function parseRequestBody(request: NextRequest) {
  try {
    return (await request.json()) as LiveblocksAuthRequestBody;
  } catch {
    return {} satisfies LiveblocksAuthRequestBody;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request);

    if (body.room !== LIVEBLOCKS_ROOM_ID) {
      return NextResponse.json({ error: "Liveblocks room is not allowed" }, { status: 403 });
    }

    const cookieGuestId = request.cookies.get(GUEST_COOKIE_NAME)?.value;
    const preAuthKey = isValidGuestId(cookieGuestId)
      ? `cookie:${cookieGuestId}`
      : `ip:${getForwardedIp(request)}`;
    const preAuthLimit = await checkRateLimit(`pre:${preAuthKey}`);

    if (!preAuthLimit.success) {
      return rateLimitedResponse(preAuthLimit);
    }

    const accessToken = getAccessTokenFromRequest(request);
    let identity: string;
    let userInfo: LiveblocksUserInfo;
    let shouldSetGuestCookie = false;
    let guestId: string | null = null;

    if (accessToken) {
      const privyUser = await getVerifiedPrivyUser(request);
      const appUser = await syncPrivyUser(privyUser);

      identity = `user:${appUser.userId}`;
      userInfo = {
        name: appUser.displayName ?? appUser.username,
        username: appUser.username,
        displayName: appUser.displayName ?? undefined,
        role: appUser.roles.some((role) => role.name === "admin")
          ? "admin"
          : appUser.roles.some((role) => role.name === "moderator")
            ? "moderator"
            : "user",
        authType: "privy",
      };
    } else {
      const guest = getGuestId(request);

      guestId = guest.guestId;
      shouldSetGuestCookie = guest.shouldSetCookie;
      identity = `guest:${guestId}`;
      userInfo = {
        name: "Guest",
        role: "guest",
        authType: "anonymous",
      };
    }

    const identityLimit = await checkRateLimit(`identity:${identity}`);

    if (!identityLimit.success) {
      const response = rateLimitedResponse(identityLimit);

      if (shouldSetGuestCookie && guestId) {
        setGuestCookie(response, guestId);
      }

      return response;
    }

    await ensureHomeRoom();

    const { status, body: responseBody } = await getLiveblocksClient().identifyUser(identity, {
      userInfo,
    });
    const response = new NextResponse(responseBody, {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (shouldSetGuestCookie && guestId) {
      setGuestCookie(response, guestId);
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to authenticate with Liveblocks";
    const status = message === "Missing Privy access token" ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
