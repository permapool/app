import { NextRequest, NextResponse } from "next/server";
import { HSTS_VALUE, shouldSetHsts } from "./src/lib/http-security";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",", 1)[0]
    ?.trim();
  const protocol = forwardedProtocol ?? request.nextUrl.protocol.replace(":", "");

  if (
    shouldSetHsts({
      hostname: request.nextUrl.hostname,
      nodeEnv: process.env.NODE_ENV,
      protocol,
    })
  ) {
    response.headers.set("Strict-Transport-Security", HSTS_VALUE);
  }

  return response;
}

export const config = {
  matcher: "/:path*",
};
