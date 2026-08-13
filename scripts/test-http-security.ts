import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  REPORT_ONLY_CSP,
  STATIC_SECURITY_HEADERS,
} from "../src/lib/http-security";

const requiredDirectives = [
  "default-src",
  "base-uri",
  "object-src",
  "frame-ancestors",
  "form-action",
  "script-src",
  "style-src",
  "img-src",
  "font-src",
  "connect-src",
  "media-src",
  "frame-src",
  "worker-src",
  "manifest-src",
];

for (const directive of requiredDirectives) {
  assert.match(REPORT_ONLY_CSP, new RegExp(`(?:^|; )${directive}(?: |;|$)`));
}

assert.equal(REPORT_ONLY_CSP.includes("*"), false, "CSP must not contain wildcard sources");
assert.equal(REPORT_ONLY_CSP.includes("'unsafe-eval'"), false);
assert.equal(REPORT_ONLY_CSP.includes("report-uri"), false);
assert.equal(REPORT_ONLY_CSP.includes("report-to"), false);
assert.doesNotMatch(REPORT_ONLY_CSP, /(?:^|; )upgrade-insecure-requests(?:;|$)/);
assert.equal(REPORT_ONLY_CSP.includes("vercel.live"), false);

const directives = new Map(
  REPORT_ONLY_CSP.split("; ").map((entry) => {
    const [directive, ...sources] = entry.split(" ");
    return [directive, sources];
  }),
);
assert.ok(directives.get("media-src")?.includes("blob:"));
assert.ok(directives.get("connect-src")?.includes("https://livepeercdn.com"));
assert.ok(directives.get("connect-src")?.includes("https://playback.livepeer.studio"));

const staticHeaderMap = new Map<string, string>(
  STATIC_SECURITY_HEADERS.map(({ key, value }) => [key, value]),
);
assert.equal(staticHeaderMap.get("X-Content-Type-Options"), "nosniff");
assert.equal(staticHeaderMap.get("Referrer-Policy"), "strict-origin-when-cross-origin");
assert.ok(staticHeaderMap.has("Permissions-Policy"));
assert.equal(staticHeaderMap.has("Content-Security-Policy"), false);

const serializedHeaders = JSON.stringify({
  csp: REPORT_ONLY_CSP,
  headers: STATIC_SECURITY_HEADERS,
});
for (const forbiddenServerName of [
  "PRIVY_APP_SECRET",
  "PRIVY_AUTHORIZATION_PRIVATE_KEY",
  "PRINTER_AUTH_TOKEN",
  "FARSTORE_API_KEY",
  "SERVER_WALLET_AUTHORIZATION_KEY",
]) {
  assert.equal(serializedHeaders.includes(forbiddenServerName), false);
}

const nextConfigSource = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
assert.match(nextConfigSource, /Content-Security-Policy-Report-Only/);
assert.doesNotMatch(nextConfigSource, /key:\s*["']Content-Security-Policy["']/);
assert.doesNotMatch(nextConfigSource, /Strict-Transport-Security/i);
assert.equal(
  existsSync(new URL("../middleware.ts", import.meta.url)),
  false,
  "No middleware should exist solely to add repository-managed HSTS",
);

const routeFiles = [
  "../src/app/.well-known/farcaster.json/route.ts",
  "../src/app/api/auth/profile/route.ts",
  "../src/app/api/auth/session/route.ts",
  "../src/app/api/chat/feed/route.ts",
  "../src/app/api/chat/messages/route.ts",
  "../src/app/api/chat/messages/[messageId]/reactions/route.ts",
  "../src/app/api/liveblocks-auth/route.ts",
  "../src/app/api/slice/products/route.ts",
  "../src/app/api/webhook/route.ts",
];
for (const routeFile of routeFiles) {
  const source = readFileSync(new URL(routeFile, import.meta.url), "utf8");
  assert.doesNotMatch(source, /Access-Control-Allow-Origin/i, `${routeFile} must remain same-origin`);
}

console.log("HTTP security header tests passed");
