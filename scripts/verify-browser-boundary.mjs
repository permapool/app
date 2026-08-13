import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const forbiddenEnvironmentNames = [
  "PRIVY_APP_SECRET",
  "PRIVY_AUTHORIZATION_KEY",
  "PRIVY_AUTHORIZATION_PRIVATE_KEY",
  "PRIVY_SERVER_WALLET_AUTHORIZATION_KEY",
  "PRIVY_SERVER_WALLET_AUTHORIZATION_PRIVATE_KEY",
  "SERVER_WALLET_AUTHORIZATION_KEY",
  "SERVER_WALLET_AUTHORIZATION_PRIVATE_KEY",
  "PRINTER_AUTH_TOKEN",
  "FARSTORE_API_KEY",
  "NEYNAR_API_KEY",
  "LIVEBLOCKS_SECRET_KEY",
  "UPSTASH_REDIS_REST_TOKEN",
  "LIVEPEER_API_KEY",
  "DATABASE_URL",
];

const sentinelPrefix = "HIGHER_BROWSER_BOUNDARY_SENTINEL_";
const sentinels = Object.fromEntries(
  forbiddenEnvironmentNames.map((name, index) => [
    name,
    `${sentinelPrefix}${index}_${name}`,
  ]),
);

const build = spawnSync("npm", ["run", "build"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    ...sentinels,
  },
  stdio: "inherit",
});

if (build.error) {
  throw build.error;
}

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const clientOutputDirectory = join(process.cwd(), ".next", "static");
const findings = [];

function scanDirectory(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      scanDirectory(path);
      continue;
    }

    const contents = readFileSync(path);
    const text = contents.toString("utf8");

    for (const name of forbiddenEnvironmentNames) {
      if (text.includes(name)) {
        findings.push({ path, marker: name });
      }
    }

    for (const sentinel of Object.values(sentinels)) {
      if (text.includes(sentinel)) {
        findings.push({ path, marker: "sentinel" });
      }
    }
  }
}

scanDirectory(clientOutputDirectory);

if (findings.length > 0) {
  console.error("Browser-boundary verification failed:");
  for (const finding of findings) {
    console.error(`- ${finding.path}: forbidden ${finding.marker} marker`);
  }
  process.exit(1);
}

console.log(
  "Browser-boundary verification passed: forbidden server-only environment names and synthetic sentinels were absent from .next/static.",
);
console.log(
  "This marker scan is a defense-in-depth check and does not prove the absence of every possible secret.",
);
