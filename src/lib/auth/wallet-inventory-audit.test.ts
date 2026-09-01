import { describe, expect, it, vi } from "vitest";
import {
  bucketWalletAuthority,
  bucketWalletChainNamespace,
  bucketWalletInventoryOutcome,
  bucketWalletInventoryReasonCode,
  bucketWalletKind,
  bucketWalletOrigin,
  bucketWalletSelectionStatus,
  createPrivyUsersPageSource,
  createPrivyUsersListFn,
  executeWalletInventoryAudit,
  parseWalletInventoryAuditArgs,
  renderWalletInventoryAuditReport,
  runWalletInventoryAuditCli,
  validateWalletInventoryAuditLiveConfig,
  type PrivyUsersListFn,
  type WalletInventoryAuditPage,
} from "./wallet-inventory-audit";
import type { PrivyLinkedWalletAccountInput } from "./wallet-inventory";

const EVM_ADDRESS_A = "0x1111111111111111111111111111111111111111";
const EVM_ADDRESS_B = "0x2222222222222222222222222222222222222222";
const SOLANA_ADDRESS = "So11111111111111111111111111111111111111112";

function embeddedEvmAccount(
  overrides: Partial<PrivyLinkedWalletAccountInput> = {},
): PrivyLinkedWalletAccountInput {
  return {
    type: "wallet",
    id: "wallet-a",
    address: EVM_ADDRESS_A,
    chain_type: "ethereum",
    wallet_client: "privy",
    wallet_client_type: "privy",
    connector_type: "embedded",
    delegated: false,
    imported: false,
    wallet_index: 0,
    ...overrides,
  };
}

function externalEvmAccount(
  overrides: Partial<PrivyLinkedWalletAccountInput> = {},
): PrivyLinkedWalletAccountInput {
  return {
    type: "wallet",
    id: "external-wallet",
    address: EVM_ADDRESS_B,
    chain_type: "ethereum",
    wallet_client: "metamask",
    wallet_client_type: "metamask",
    connector_type: "injected",
    delegated: false,
    imported: false,
    wallet_index: 1,
    ...overrides,
  };
}

function page(users: WalletInventoryAuditPage["users"]): WalletInventoryAuditPage {
  return { users };
}

async function* pages(
  values: ReadonlyArray<WalletInventoryAuditPage>,
): AsyncGenerator<WalletInventoryAuditPage> {
  for (const value of values) {
    yield value;
  }
}

function render(reportOrResult: { report: unknown }) {
  return JSON.stringify(reportOrResult, null, 2);
}

const startedAt = new Date("2026-08-31T12:00:00.000Z");
const completedAt = new Date("2026-08-31T12:00:05.000Z");

function makeSdkErrorMessage(label: string) {
  return `${label} user_123 address_0x1111111111111111111111111111111111111111 token_secret secret_app_id`;
}

function makePrivyErrorLike(
  className: string,
  status?: number,
  extra: Record<string, unknown> = {},
) {
  return {
    constructor: { name: className },
    name: "Error",
    status,
    ...extra,
  } as unknown;
}

describe("wallet inventory audit buckets", () => {
  it("maps unknown values into fixed unknown buckets", () => {
    expect(bucketWalletKind("something-else")).toBe("unknown");
    expect(bucketWalletOrigin("something-else")).toBe("unknown");
    expect(bucketWalletChainNamespace("something-else")).toBe("unknown");
    expect(bucketWalletAuthority("something-else")).toBe("unknown");
    expect(bucketWalletSelectionStatus("something-else")).toBe("unknown");
    expect(bucketWalletInventoryOutcome("something-else")).toBe("unknown");
    expect(bucketWalletInventoryReasonCode("something-else")).toBe("unknown");
  });
});

describe("executeWalletInventoryAudit", () => {
  it("aggregates empty input deterministically", async () => {
    const result = await executeWalletInventoryAudit(pages([]), startedAt, () => completedAt);

    expect(result.exit_code).toBe(0);
    expect(result.report).toMatchObject({
      complete: true,
      pagination_completed: true,
      users_scanned: 0,
      pages_scanned: 0,
      linked_accounts_scanned: 0,
      users_by_candidate_count: { zero: 0, one: 0, multiple: 0 },
      users_requiring_duplicate_reconciliation: 0,
      users_containing_invalid_unsupported_records: 0,
      users_containing_ambiguous_authority: 0,
      error_code: null,
    });
    expect(result.report.counts.wallet_kind).toMatchObject({
      eoa: 0,
      smart_wallet: 0,
      unknown: 0,
    });
  });

  it("counts a user with no linked accounts", async () => {
    const result = await executeWalletInventoryAudit(
      pages([page([{ linked_accounts: [] }])]),
      startedAt,
      () => completedAt,
    );

    expect(result.exit_code).toBe(0);
    expect(result.report.users_scanned).toBe(1);
    expect(result.report.pages_scanned).toBe(1);
    expect(result.report.linked_accounts_scanned).toBe(0);
    expect(result.report.users_by_candidate_count).toEqual({
      zero: 1,
      one: 0,
      multiple: 0,
    });
    expect(result.report.users_by_inventory_outcome_code).toMatchObject({
      no_candidate: 1,
      exactly_one_candidate: 0,
      multiple_candidates: 0,
      ambiguous_authority: 0,
      duplicates_reconciliation_required: 0,
      unknown: 0,
    });
  });

  it("aggregates multiple pages and simultaneous outcomes without losing facts", async () => {
    const result = await executeWalletInventoryAudit(
      pages([
        page([
          { linked_accounts: [] },
          { linked_accounts: [embeddedEvmAccount({ id: "embedded-1" })] },
          { linked_accounts: [externalEvmAccount()] },
        ]),
        page([
          {
            linked_accounts: [
              embeddedEvmAccount({ id: "imported-1", imported: true }),
            ],
          },
          {
            linked_accounts: [
              embeddedEvmAccount({
                id: "multi-a",
                address: EVM_ADDRESS_A,
                delegated: true,
              }),
              embeddedEvmAccount({
                id: "multi-b",
                address: "0x3333333333333333333333333333333333333333",
                delegated: true,
              }),
            ],
          },
          {
            linked_accounts: [
              embeddedEvmAccount({ id: "dup-shared" }),
              {
                type: "email",
                id: "dup-shared",
                address: "dev@example.test",
              },
            ],
          },
        ]),
      ]),
      startedAt,
      () => completedAt,
    );

    expect(result.exit_code).toBe(0);
    expect(result.report).toMatchObject({
      complete: true,
      pagination_completed: true,
      users_scanned: 6,
      pages_scanned: 2,
      linked_accounts_scanned: 7,
      users_by_candidate_count: {
        zero: 3,
        one: 2,
        multiple: 1,
      },
      users_requiring_duplicate_reconciliation: 1,
      users_containing_invalid_unsupported_records: 1,
      users_containing_ambiguous_authority: 3,
    });
    expect(result.report.counts).toMatchObject({
      wallet_kind: {
        eoa: 6,
        smart_wallet: 0,
        unknown: 1,
      },
      origin: {
        embedded: 5,
        external: 1,
        unknown: 1,
      },
      chain_namespace: {
        ethereum: 6,
        solana: 0,
        unsupported: 0,
        unknown: 1,
      },
      authority: {
        user: 0,
        server_signer_present: 2,
        service: 0,
        unknown: 5,
      },
      selection_status: {
        candidate: 4,
        ineligible: 1,
        ambiguous: 2,
        unknown: 0,
      },
      reason_code: {
        embedded_evm_candidate: 5,
        authority_unverified: 3,
        external_wallet_not_default: 1,
        delegated_server_signer_present: 2,
        duplicate_identity_requires_reconciliation: 2,
        unsupported_account_type: 1,
        smart_wallet_requires_separate_policy: 0,
        solana_not_eligible_for_base_policy: 0,
        missing_required_metadata: 0,
        invalid_address: 0,
        unknown: 0,
      },
    });
    expect(result.report.users_by_inventory_outcome_code).toMatchObject({
      no_candidate: 3,
      exactly_one_candidate: 2,
      multiple_candidates: 1,
      ambiguous_authority: 3,
      duplicates_reconciliation_required: 1,
      unknown: 0,
    });
  });

  it("produces identical output for repeated aggregation with the same inputs", async () => {
    const first = await executeWalletInventoryAudit(
      pages([
        page([{ linked_accounts: [embeddedEvmAccount({ id: "repeat-a" })] }]),
        page([{ linked_accounts: [embeddedEvmAccount({ id: "repeat-b" })] }]),
      ]),
      startedAt,
      () => completedAt,
    );
    const second = await executeWalletInventoryAudit(
      pages([
        page([{ linked_accounts: [embeddedEvmAccount({ id: "repeat-a" })] }]),
        page([{ linked_accounts: [embeddedEvmAccount({ id: "repeat-b" })] }]),
      ]),
      startedAt,
      () => completedAt,
    );

    expect(first.report).toEqual(second.report);
  });

  it("does not echo identifying values in serialized output", async () => {
    const result = await executeWalletInventoryAudit(
      pages([
        page([
          {
            linked_accounts: [
              embeddedEvmAccount({
                id: "wallet-id-redacted",
                address: EVM_ADDRESS_A,
              }),
            ],
          },
        ]),
      ]),
      startedAt,
      () => completedAt,
    );

    const serialized = renderWalletInventoryAuditReport(result.report);
    expect(serialized).not.toContain("wallet-id-redacted");
    expect(serialized).not.toContain(EVM_ADDRESS_A);
    expect(serialized).not.toContain("dev@example.test");
  });

  it("sanitizes raw page-source errors into fixed codes", async () => {
    async function* failingPages() {
      yield page([{ linked_accounts: [] }]);
      throw new Error("raw sdk error: user_123 sdk_response_abc");
    }

    const result = await executeWalletInventoryAudit(
      failingPages(),
      startedAt,
      () => completedAt,
    );

    expect(result.exit_code).toBe(1);
    expect(result.report).toMatchObject({
      complete: false,
      pagination_completed: false,
      error_code: "pagination_failed",
      users_scanned: 1,
      pages_scanned: 1,
    });
    expect(renderWalletInventoryAuditReport(result.report)).not.toContain(
      "user_123",
    );
    expect(renderWalletInventoryAuditReport(result.report)).not.toContain(
      "sdk_response_abc",
    );
  });

  it("marks repeated cursor pagination as incomplete and safe", async () => {
    const listUsers: PrivyUsersListFn = vi.fn(async ({ cursor }) => {
      if (!cursor) {
        return {
          data: [{ linked_accounts: [] }],
          next_cursor: "repeat-cursor",
        };
      }

      return {
        data: [{ linked_accounts: [externalEvmAccount()] }],
        next_cursor: "repeat-cursor",
      };
    });

    const result = await executeWalletInventoryAudit(
      createPrivyUsersPageSource(listUsers, { limit: 2 }),
      startedAt,
      () => completedAt,
    );

    expect(result.exit_code).toBe(1);
    expect(result.report.error_code).toBe("pagination_loop_detected");
    expect(result.report.complete).toBe(false);
    expect(result.report.pagination_completed).toBe(false);
    expect(listUsers).toHaveBeenCalledTimes(2);
  });

  it("reuses one users client across sequential pages", async () => {
    const listCalls: Array<unknown> = [];
    const createUsersClient = vi.fn(() => ({
      list: vi.fn(async ({ cursor }: { cursor?: string; limit?: number }) => {
        listCalls.push({ cursor });
        if (!cursor) {
          return {
            data: [{ linked_accounts: [embeddedEvmAccount({ id: "page-one" })] }],
            next_cursor: "page-two",
          };
        }

        return {
          data: [{ linked_accounts: [embeddedEvmAccount({ id: "page-two" })] }],
          next_cursor: "",
        };
      }),
    }));

    const result = await executeWalletInventoryAudit(
      createPrivyUsersPageSource(createPrivyUsersListFn(() => createUsersClient()), {
        limit: 2,
      }),
      startedAt,
      () => completedAt,
    );

    expect(result.exit_code).toBe(0);
    expect(createUsersClient).toHaveBeenCalledTimes(1);
    expect(listCalls).toEqual([{ cursor: undefined }, { cursor: "page-two" }]);
    expect(result.report.users_scanned).toBe(2);
  });
});

describe("wallet inventory audit SDK error taxonomy", () => {
  const taxonomyCases = [
    {
      label: "AuthenticationError",
      error: () =>
        makePrivyErrorLike("AuthenticationError", 401, {
          error: { message: makeSdkErrorMessage("auth") },
          message: "auth message",
        }),
      error_code: "authentication_failed",
    },
    {
      label: "PermissionDeniedError",
      error: () =>
        makePrivyErrorLike("PermissionDeniedError", 403, {
          error: { message: makeSdkErrorMessage("permission") },
          message: "permission message",
        }),
      error_code: "permission_denied",
    },
    {
      label: "RateLimitError",
      error: () =>
        makePrivyErrorLike("RateLimitError", 429, {
          error: { message: makeSdkErrorMessage("rate") },
          message: "rate message",
        }),
      error_code: "rate_limited",
    },
    {
      label: "APIConnectionError",
      error: () =>
        makePrivyErrorLike("APIConnectionError", undefined, {
          cause: new Error("cause redacted"),
          message: makeSdkErrorMessage("connection"),
        }),
      error_code: "connection_failed",
    },
    {
      label: "APIConnectionTimeoutError",
      error: () =>
        makePrivyErrorLike("APIConnectionTimeoutError", undefined, {
          message: makeSdkErrorMessage("timeout"),
        }),
      error_code: "connection_timeout",
    },
    {
      label: "InternalServerError",
      error: () =>
        makePrivyErrorLike("InternalServerError", 500, {
          error: { message: makeSdkErrorMessage("upstream") },
          message: "upstream message",
        }),
      error_code: "upstream_failed",
    },
    {
      label: "BadRequestError",
      error: () =>
        makePrivyErrorLike("BadRequestError", 400, {
          error: { message: makeSdkErrorMessage("bad-request") },
          message: "bad request message",
        }),
      error_code: "invalid_request",
    },
    {
      label: "NotFoundError",
      error: () =>
        makePrivyErrorLike("NotFoundError", 404, {
          error: { message: makeSdkErrorMessage("missing") },
          message: "not found message",
        }),
      error_code: "invalid_request",
    },
    {
      label: "ConflictError",
      error: () =>
        makePrivyErrorLike("ConflictError", 409, {
          error: { message: makeSdkErrorMessage("conflict") },
          message: "conflict message",
        }),
      error_code: "invalid_request",
    },
    {
      label: "UnprocessableEntityError",
      error: () =>
        makePrivyErrorLike("UnprocessableEntityError", 422, {
          error: { message: makeSdkErrorMessage("unprocessable") },
          message: "unprocessable message",
        }),
      error_code: "invalid_request",
    },
  ] as const;

  it.each(taxonomyCases)(
    "maps $label to a sanitized error code",
    async ({ error, error_code }) => {
      const listUsers: PrivyUsersListFn = vi.fn(async () => {
        throw error();
      });
      const result = await executeWalletInventoryAudit(
        createPrivyUsersPageSource(listUsers, { limit: 1 }),
        startedAt,
        () => completedAt,
      );

      const serialized = renderWalletInventoryAuditReport(result.report);
      expect(result.exit_code).toBe(1);
      expect(result.report.error_code).toBe(error_code);
      expect(serialized).not.toContain("user_123");
      expect(serialized).not.toContain("address_0x1111111111111111111111111111111111111111");
      expect(serialized).not.toContain("token_secret");
      expect(serialized).not.toContain("secret_app_id");
      expect(serialized).not.toContain("raw");
      expect(() => JSON.parse(serialized)).not.toThrow();
    },
  );

  it("maps a generic PrivyAPIError to unknown_sdk_failure", async () => {
    const listUsers: PrivyUsersListFn = vi.fn(async () => {
      throw makePrivyErrorLike("PrivyAPIError", undefined, {
        message: "sdk base message user_123",
      });
    });
    const result = await executeWalletInventoryAudit(
      createPrivyUsersPageSource(listUsers, { limit: 1 }),
      startedAt,
      () => completedAt,
    );

    const serialized = renderWalletInventoryAuditReport(result.report);
    expect(result.exit_code).toBe(1);
    expect(result.report.error_code).toBe("unknown_sdk_failure");
    expect(serialized).not.toContain("sdk base message");
    expect(serialized).not.toContain("user_123");
  });

  it("uses invalid_request for representative 4xx SDK statuses", async () => {
    const listUsers: PrivyUsersListFn = vi.fn(async () => {
      throw makePrivyErrorLike("BadRequestError", 400, {
        error: { message: makeSdkErrorMessage("representative-4xx") },
        message: "representative 4xx",
      });
    });
    const result = await executeWalletInventoryAudit(
      createPrivyUsersPageSource(listUsers, { limit: 1 }),
      startedAt,
      () => completedAt,
    );

    expect(result.exit_code).toBe(1);
    expect(result.report.error_code).toBe("invalid_request");
  });

  it("does not trust a plain object with status metadata as an SDK error", async () => {
    const listUsers: PrivyUsersListFn = vi.fn(async () => {
      throw {
        constructor: { name: "Object" },
        name: "Error",
        status: 401,
        message: makeSdkErrorMessage("plain-object"),
      };
    });

    const result = await executeWalletInventoryAudit(
      createPrivyUsersPageSource(listUsers, { limit: 1 }),
      startedAt,
      () => completedAt,
    );

    expect(result.exit_code).toBe(1);
    expect(result.report.error_code).toBe("pagination_failed");
    expect(renderWalletInventoryAuditReport(result.report)).not.toContain(
      "plain-object",
    );
  });

  it("preserves partial counts when a later page fails with a sanitized SDK error", async () => {
    const listUsers: PrivyUsersListFn = vi.fn(async ({ cursor }) => {
      if (!cursor) {
        return {
          data: [{ linked_accounts: [embeddedEvmAccount({ id: "partial-a" })] }],
          next_cursor: "next-page",
        };
      }

      throw makePrivyErrorLike("PermissionDeniedError", 403, {
        error: { message: makeSdkErrorMessage("later-page") },
        message: "later page message",
      });
    });

    const result = await executeWalletInventoryAudit(
      createPrivyUsersPageSource(listUsers, { limit: 2 }),
      startedAt,
      () => completedAt,
    );

    const serialized = renderWalletInventoryAuditReport(result.report);
    expect(result.exit_code).toBe(1);
    expect(result.report.complete).toBe(false);
    expect(result.report.pagination_completed).toBe(false);
    expect(result.report.error_code).toBe("permission_denied");
    expect(result.report.users_scanned).toBe(1);
    expect(result.report.pages_scanned).toBe(1);
    expect(result.report.linked_accounts_scanned).toBe(1);
    expect(serialized).not.toContain("later-page");
    expect(serialized).not.toContain("address_0x1111111111111111111111111111111111111111");
  });
});

describe("wallet inventory audit CLI gates", () => {
  const liveEnv: Readonly<Record<string, string | undefined>> = {
    NEXT_PUBLIC_PRIVY_APP_ID: "test-app-id",
    PRIVY_APP_SECRET: "test-app-secret",
  };

  it("blocks before adapter invocation when the live flag is absent", async () => {
    const listUsers = vi.fn<PrivyUsersListFn>();
    const result = await runWalletInventoryAuditCli({
      argv: ["--privy-app-id", "test-app-id"],
      env: liveEnv,
      now: () => startedAt,
      listUsers,
    });

    expect(result.exit_code).toBe(1);
    expect(result.report.error_code).toBe("live_read_only_flag_required");
    expect(listUsers).not.toHaveBeenCalled();
  });

  it("blocks before adapter invocation when required env names are missing", async () => {
    const listUsers = vi.fn<PrivyUsersListFn>();
    const result = await runWalletInventoryAuditCli({
      argv: ["--live-read-only", "--privy-app-id", "test-app-id"],
      env: { NEXT_PUBLIC_PRIVY_APP_ID: "test-app-id" },
      now: () => startedAt,
      listUsers,
    });

    expect(result.exit_code).toBe(1);
    expect(result.report.error_code).toBe("missing_privy_environment");
    expect(listUsers).not.toHaveBeenCalled();
  });

  it("blocks before adapter invocation when the explicit app context disagrees with env config", async () => {
    const listUsers = vi.fn<PrivyUsersListFn>();
    const result = await runWalletInventoryAuditCli({
      argv: ["--live-read-only", "--privy-app-id", "test-app-id"],
      env: {
        NEXT_PUBLIC_PRIVY_APP_ID: "test-app-id",
        PRIVY_APP_SECRET: "test-app-secret",
        PRIVY_APP_ID: "other-app-id",
      },
      now: () => startedAt,
      listUsers,
    });

    expect(result.exit_code).toBe(1);
    expect(result.report.error_code).toBe("inconsistent_privy_app_id");
    expect(listUsers).not.toHaveBeenCalled();
  });

  it("permits a mocked adapter only when live read-only is explicit", async () => {
    const listUsers: PrivyUsersListFn = vi.fn(async ({ cursor }) => {
      if (!cursor) {
        return {
          data: [{ linked_accounts: [embeddedEvmAccount({ id: "cli-user" })] }],
          next_cursor: "",
        };
      }

      return {
        data: [],
        next_cursor: "",
      };
    });

    const result = await runWalletInventoryAuditCli({
      argv: ["--live-read-only", "--privy-app-id", "test-app-id"],
      env: liveEnv,
      now: () => startedAt,
      listUsers,
    });

    expect(result.exit_code).toBe(0);
    expect(result.report.complete).toBe(true);
    expect(result.report.users_scanned).toBe(1);
    expect(listUsers).toHaveBeenCalledTimes(1);
  });
});

describe("wallet inventory audit config parsing", () => {
  it("parses live-read-only and page size arguments", () => {
    expect(
      parseWalletInventoryAuditArgs([
        "--live-read-only",
        "--privy-app-id",
        "test-app-id",
        "--limit",
        "5",
      ]),
    ).toEqual({
      live_read_only: true,
      privy_app_id: "test-app-id",
      limit: 5,
    });
  });

  it("fails closed on unknown flags and duplicates", () => {
    expect(() =>
      parseWalletInventoryAuditArgs([
        "--live-read-only",
        "--live-read-only",
      ]),
    ).toThrow("invalid_cli_arguments");
    expect(() =>
      parseWalletInventoryAuditArgs(["--unexpected-flag"]),
    ).toThrow("invalid_cli_arguments");
    expect(() =>
      parseWalletInventoryAuditArgs(["just-a-positional"]),
    ).toThrow("invalid_cli_arguments");
  });

  it("rejects page limits outside the conservative range", () => {
    expect(() =>
      parseWalletInventoryAuditArgs([
        "--live-read-only",
        "--privy-app-id",
        "test-app-id",
        "--limit",
        "0",
      ]),
    ).toThrow("invalid_cli_arguments");
    expect(() =>
      parseWalletInventoryAuditArgs([
        "--live-read-only",
        "--privy-app-id",
        "test-app-id",
        "--limit",
        "1001",
      ]),
    ).toThrow("invalid_cli_arguments");
  });

  it("validates the live environment only when the app id matches", () => {
    expect(
      validateWalletInventoryAuditLiveConfig({
        live_read_only: true,
        privy_app_id: "test-app-id",
        env: {
          NEXT_PUBLIC_PRIVY_APP_ID: "test-app-id",
          PRIVY_APP_SECRET: "test-app-secret",
        },
      }),
    ).toMatchObject({ ok: true, app_id: "test-app-id" });
  });

  it("blocks unknown flags before adapter invocation", async () => {
    const listUsers = vi.fn<PrivyUsersListFn>();
    const result = await runWalletInventoryAuditCli({
      argv: [
        "--live-read-only",
        "--privy-app-id",
        "test-app-id",
        "--unexpected-flag",
      ],
      env: {
        NEXT_PUBLIC_PRIVY_APP_ID: "test-app-id",
        PRIVY_APP_SECRET: "test-app-secret",
      },
      now: () => startedAt,
      listUsers,
    });

    expect(result.exit_code).toBe(1);
    expect(result.report.error_code).toBe("invalid_cli_arguments");
    expect(listUsers).not.toHaveBeenCalled();
  });
});
