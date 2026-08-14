import { NextResponse } from "next/server";
import { isAddress } from "viem";
import {
  ENS_NEGATIVE_CACHE_TTL_MS,
  ENS_POSITIVE_CACHE_TTL_MS,
  resolveEnsName,
} from "~/lib/ens";

const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address") ?? "";

  if (!isAddress(address)) {
    return NextResponse.json({ name: null }, { status: 400, headers: PRIVATE_NO_STORE });
  }

  const name = await resolveEnsName(address);
  const cacheTtlMs = name ? ENS_POSITIVE_CACHE_TTL_MS : ENS_NEGATIVE_CACHE_TTL_MS;

  return NextResponse.json(
    { name },
    {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Vercel-CDN-Cache-Control": `public, max-age=${cacheTtlMs / 1_000}`,
      },
    },
  );
}
