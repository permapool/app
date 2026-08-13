import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const gitleaks = process.argv[2] ?? "gitleaks";
const config = resolve(".gitleaks.toml");
const expectedVersion = "8.29.1";
const publicHistoricalLabel = "CP437-compatible";
const temporaryDirectory = mkdtempSync(join(tmpdir(), "higher-gitleaks-test-"));

function runGitleaks(input, fixtureName) {
  const reportPath = join(temporaryDirectory, `${fixtureName}.json`);
  const result = spawnSync(
    gitleaks,
    [
      "stdin",
      "--config",
      config,
      "--redact",
      "--no-banner",
      "--report-format",
      "json",
      "--report-path",
      reportPath,
      "--exit-code",
      "17",
    ],
    { input, encoding: "utf8" },
  );

  if (result.error) {
    throw result.error;
  }

  if (![0, 17].includes(result.status ?? -1)) {
    throw new Error(`Gitleaks failed while evaluating fixture ${fixtureName}`);
  }

  const findings =
    result.status === 17
      ? JSON.parse(readFileSync(reportPath, "utf8"))
      : [];

  return findings.map(({ RuleID }) => RuleID);
}

function expectNoFindings(name, input) {
  const rules = runGitleaks(input, name);

  if (rules.length !== 0) {
    throw new Error(`${name}: expected no findings, received ${rules.length}`);
  }
}

function expectRule(name, input, expectedRule) {
  const rules = runGitleaks(input, name);

  if (!rules.includes(expectedRule)) {
    throw new Error(`${name}: expected rule ${expectedRule}`);
  }
}

function assignment(name, value) {
  return `${name}="${value}"`;
}

const version = spawnSync(gitleaks, ["version"], { encoding: "utf8" });

if (version.error) {
  throw version.error;
}

if (version.status !== 0 || version.stdout.trim() !== expectedVersion) {
  throw new Error(`Gitleaks ${expectedVersion} is required`);
}

try {
  expectNoFindings(
    "exact-public-label",
    `api_key = "${publicHistoricalLabel}"`,
  );

  expectRule(
    "label-contained",
    `api_key = "Q9x7V2mK4pR8${publicHistoricalLabel}T6z3N5cB1"`,
    "generic-api-key",
  );
  expectRule(
    "text-before-label",
    `api_key = "Q9x7V2mK4pR8${publicHistoricalLabel}"`,
    "generic-api-key",
  );
  expectRule(
    "text-after-label",
    `api_key = "${publicHistoricalLabel}T6z3N5cB1Q9x7V2mK4pR8"`,
    "generic-api-key",
  );

  const repositoryRules = [
    [
      "privy-app-secret",
      assignment("PRIVY_APP_SECRET", ["SYNTHETIC", "9aZ7kQ2mX8vP4sR6"].join("")),
      "higher-privy-app-secret",
    ],
    [
      "privy-authorization-key",
      assignment(
        "PRIVY_AUTHORIZATION_PRIVATE_KEY",
        ["SYNTHETIC", "7wQ9mK3xV8pL2sR6nT4"].join(""),
      ),
      "higher-privy-authorization-private-key",
    ],
    [
      "printer-token",
      assignment("PRINTER_AUTH_TOKEN", ["SYNTHETIC", "8xQ4mV9p"].join("")),
      "higher-printer-bearer-credential",
    ],
    [
      "farstore-key",
      assignment("FARSTORE_API_KEY", ["SYNTHETIC", "7zK3nR8w"].join("")),
      "higher-farstore-bearer-credential",
    ],
    [
      "server-wallet-key",
      assignment(
        "SERVER_WALLET_AUTHORIZATION_KEY",
        ["SYNTHETIC", "9mQ4xV7pK2sR8"].join(""),
      ),
      "higher-server-wallet-authorization-credential",
    ],
    [
      "pem-private-key",
      ["-----BEGIN", " PRIVATE KEY-----"].join(""),
      "higher-generic-pem-private-key",
    ],
  ];

  for (const [name, input, rule] of repositoryRules) {
    expectRule(name, input, rule);
  }

  for (const placeholder of ["dummy", "example", "placeholder", "sample"]) {
    expectRule(
      `placeholder-substring-${placeholder}`,
      assignment(
        "PRIVY_APP_SECRET",
        ["Q9x7V2mK4pR8", placeholder, "T6z3N5cB1"].join(""),
      ),
      "higher-privy-app-secret",
    );
  }

  expectNoFindings(
    "safe-references-and-placeholders",
    [
      "const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;",
      "PRIVY_APP_SECRET=''",
      "PRIVY_AUTHORIZATION_PRIVATE_KEY",
      "PRINTER_AUTH_TOKEN='example'",
      "FARSTORE_API_KEY='placeholder'",
      "SERVER_WALLET_AUTHORIZATION_KEY='sample'",
    ].join("\n"),
  );

  console.log(
    "Gitleaks configuration tests passed: exact exceptions, adversarial assignments, repository rules, and safe references.",
  );
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
