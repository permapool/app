import { describe, expect, it, vi } from "vitest";
import {
  createWalletSurfaceReconciliationLiveAdapters,
} from "../../../scripts/reconcile-privy-wallet-surfaces";
import {
  createPrivyUsersPageSource,
  createPrivyWalletResourcesPageSource,
  createWalletSurfaceReconciliationAccumulator,
  executeWalletSurfaceReconciliation,
  parseWalletSurfaceReconciliationArgs,
  renderWalletSurfaceReconciliationReport,
  runWalletSurfaceReconciliationCli,
  validateWalletSurfaceReconciliationLiveConfig,
  type ReconciliationDatabaseUserInput,
  type ReconciliationDatabaseUsersPage,
  type ReconciliationPrivyLinkedAccountInput,
  type ReconciliationPrivyUserInput,
  type ReconciliationPrivyUsersPage,
  type ReconciliationPrivyWalletResourceInput,
  type ReconciliationPrivyWalletResourcesPage,
} from "./wallet-surface-reconciliation";

const EVM_ADDRESS_A = "0x1111111111111111111111111111111111111111";
const EVM_ADDRESS_B = "0x2222222222222222222222222222222222222222";
const SOLANA_ADDRESS = "So11111111111111111111111111111111111111112";

const startedAt = new Date("2026-08-31T12:00:00.000Z");
const completedAt = new Date("2026-08-31T12:00:05.000Z");

function embeddedWallet(
  overrides: Partial<ReconciliationPrivyLinkedAccountInput> = {},
): ReconciliationPrivyLinkedAccountInput {
  return {
    type: "wallet",
    id: "embedded-wallet",
    address: EVM_ADDRESS_A,
    chain_type: "ethereum",
    wallet_client: "privy",
    wallet_client_type: "privy",
    connector_type: "embedded",
    delegated: false,
    imported: false,
    wallet_index: 0,
    recovery_method: "privy",
    ...overrides,
  };
}

function externalWallet(
  overrides: Partial<ReconciliationPrivyLinkedAccountInput> = {},
): ReconciliationPrivyLinkedAccountInput {
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
    ...overrides,
  };
}

function walletResource(
  overrides: Partial<ReconciliationPrivyWalletResourceInput> = {},
): ReconciliationPrivyWalletResourceInput {
  return {
    wallet_id: "resource-wallet",
    address: EVM_ADDRESS_A,
    chain_type: "ethereum",
    privy_user_id: "did:privy:user-1",
    owner_id: "key-quorum-1",
    additional_signers: [],
    ...overrides,
  };
}

function databaseWalletRow(address: string = EVM_ADDRESS_A) {
  return {
    id: `wallet-row-${address.slice(-4)}`,
    address,
    chainId: 8453,
  };
}

function privyUser(
  privy_user_id: string,
  linked_accounts: ReadonlyArray<ReconciliationPrivyLinkedAccountInput>,
): ReconciliationPrivyUserInput {
  return { privy_user_id, linked_accounts };
}

function privyPage(
  data: ReadonlyArray<ReconciliationPrivyUserInput>,
  next_cursor = "",
): ReconciliationPrivyUsersPage {
  return { data, next_cursor };
}

function walletResourcePage(
  data: ReadonlyArray<ReconciliationPrivyWalletResourceInput>,
  next_cursor = "",
): ReconciliationPrivyWalletResourcesPage {
  return { data, next_cursor };
}

function databaseUser(
  id: string,
  privyId: string | null,
  wallets: ReconciliationDatabaseUserInput["wallets"],
): ReconciliationDatabaseUserInput {
  return { id, privyId, wallets };
}

function databasePage(
  data: ReadonlyArray<ReconciliationDatabaseUserInput>,
  next_cursor = "",
): ReconciliationDatabaseUsersPage {
  return { data, next_cursor };
}

async function* pages<T>(items: ReadonlyArray<T>) {
  for (const item of items) {
    yield item;
  }
}

function reconciliationPages(
  privyUsers: ReadonlyArray<ReconciliationPrivyUsersPage>,
  privyWalletResourcesForUser: (privyUserId: string) => AsyncIterable<ReconciliationPrivyWalletResourcesPage>,
  databaseUsers: ReadonlyArray<ReconciliationDatabaseUsersPage>,
) {
  return {
    privyUsers: pages(privyUsers),
    privyWalletResourcesForUser,
    databaseUsers: pages(databaseUsers),
  };
}

function walletResourcesForUsers(
  mapping: Record<string, ReadonlyArray<ReconciliationPrivyWalletResourcesPage>> = {},
  fallback: ReadonlyArray<ReconciliationPrivyWalletResourcesPage> = [],
) {
  return (privyUserId: string) => pages(mapping[privyUserId] ?? fallback);
}

function makePrivySdkErrorLike(className: string, status?: number, message = "raw secret") {
  return {
    constructor: { name: className },
    status,
    message,
  } as unknown;
}

describe("wallet-surface reconciliation", () => {
  it("separates ordinary identity records from wallet-shaped records", async () => {
    const result = await executeWalletSurfaceReconciliation(
      reconciliationPages([
        privyPage([
          privyUser("did:privy:user-1", [
            { type: "email" },
            {
              type: "email",
              id: "wallet-shaped-email",
              address: EVM_ADDRESS_A,
              wallet_client: "privy",
            },
          ]),
        ]),
      ], walletResourcesForUsers(), [databasePage([])]),
      startedAt,
      () => completedAt,
    );

    expect(result.exit_code).toBe(0);
    expect(result.report.sources.privy_users).toMatchObject({
      users_scanned: 1,
      linked_accounts_scanned: 2,
      wallet_shaped_records_scanned: 0,
      non_wallet_identity_accounts: 2,
      malformed_wallet_shaped_records: 0,
    });
    expect(result.report.linked_users_containing_invalid_unsupported_records).toBe(0);
    expect(result.report.counts.linked_wallets.by_kind).toMatchObject({
      eoa: 0,
      smart_wallet: 0,
      unknown: 0,
    });
  });

  it("records a full three-surface match without requiring reconciliation", async () => {
    const result = await executeWalletSurfaceReconciliation(
      reconciliationPages([
        privyPage([privyUser("did:privy:user-1", [embeddedWallet()])]),
      ], walletResourcesForUsers({
        "did:privy:user-1": [walletResourcePage([walletResource()])],
      }), [
        databasePage([databaseUser("user-row-1", "did:privy:user-1", [databaseWalletRow()])]),
      ]),
      startedAt,
      () => completedAt,
    );

    expect(result.exit_code).toBe(0);
    expect(result.report.matches).toMatchObject({
      linked_to_wallet_resource: 1,
      linked_to_database_row: 1,
      wallet_resource_to_database_row: 1,
      full_three_surface_match: 1,
      same_user_address_match_with_missing_provenance: 0,
      unmatched_linked_account_wallet: 0,
      unmatched_user_assigned_wallet_resource: 0,
      unmatched_database_row: 0,
    });
    expect(result.report.users_requiring_reconciliation).toBe(0);
    expect(result.report.users_with_conflicting_ownership).toBe(0);
  });

  it("treats malformed wallet and smart-wallet linked accounts safely", async () => {
    const result = await executeWalletSurfaceReconciliation(
      reconciliationPages([
        privyPage([
          privyUser("did:privy:user-wallet", [
            {
              type: "wallet",
              id: "broken-wallet",
              address: "not-an-address",
              chain_type: "ethereum",
            },
            {
              type: "smart_wallet",
              id: "smart-wallet",
              address: EVM_ADDRESS_A,
            },
          ]),
        ]),
      ], walletResourcesForUsers(), [databasePage([])]),
      startedAt,
      () => completedAt,
    );

    expect(result.exit_code).toBe(0);
    expect(result.report.sources.privy_users).toMatchObject({
      wallet_shaped_records_scanned: 2,
      non_wallet_identity_accounts: 0,
      malformed_wallet_shaped_records: 0,
    });
    expect(result.report.linked_users_containing_invalid_unsupported_records).toBe(1);
    expect(result.report.counts.linked_wallets.by_kind).toMatchObject({
      eoa: 1,
      smart_wallet: 1,
      unknown: 0,
    });
    expect(result.report.counts.linked_wallets.by_selection_status.ineligible).toBeGreaterThan(0);
  });

  it("keeps external wallets ineligible even when the database stores the same address", async () => {
    const result = await executeWalletSurfaceReconciliation(
      reconciliationPages([
        privyPage([privyUser("did:privy:user-2", [externalWallet()])]),
      ], walletResourcesForUsers(), [
        databasePage([databaseUser("user-row-2", "did:privy:user-2", [databaseWalletRow(EVM_ADDRESS_B)])]),
      ]),
      startedAt,
      () => completedAt,
    );

    expect(result.exit_code).toBe(0);
    expect(result.report.counts.linked_wallets.by_origin.external).toBe(1);
    expect(result.report.counts.linked_wallets.by_selection_status.ineligible).toBe(1);
    expect(result.report.linked_users_by_candidate_count).toEqual({
      zero: 1,
      one: 0,
      multiple: 0,
    });
    expect(result.report.matches.linked_to_database_row).toBe(1);
    expect(result.report.matches.same_user_address_match_with_missing_provenance).toBe(1);
    expect(result.report.users_with_conflicting_ownership).toBe(0);
    expect(result.report.matches.address_match_with_conflicting_user_ownership).toBe(0);
    expect(result.report.users_requiring_reconciliation).toBe(1);
  });

  it("marks conflicting ownership when the same address is attached to different users", async () => {
    const result = await executeWalletSurfaceReconciliation(
      reconciliationPages([
        privyPage([
          privyUser("did:privy:user-1", [embeddedWallet({ address: EVM_ADDRESS_A })]),
          privyUser("did:privy:user-2", [embeddedWallet({ address: EVM_ADDRESS_B })]),
        ]),
      ], walletResourcesForUsers({
        "did:privy:user-1": [
          walletResourcePage([
            walletResource({
              wallet_id: "resource-user-2",
              privy_user_id: "did:privy:user-1",
              owner_id: "key-quorum-2",
              address: EVM_ADDRESS_A,
            }),
          ]),
        ],
        "did:privy:user-2": [
          walletResourcePage([
            walletResource({
              wallet_id: "resource-user-2",
              privy_user_id: "did:privy:user-2",
              owner_id: "key-quorum-2",
              address: EVM_ADDRESS_A,
            }),
          ]),
        ],
      }), [databasePage([])]),
      startedAt,
      () => completedAt,
    );

    expect(result.report.users_with_conflicting_ownership).toBe(2);
    expect(result.report.matches.address_match_with_conflicting_user_ownership).toBe(1);
    expect(result.report.users_requiring_reconciliation).toBe(2);
  });

  it("keeps service or unassigned wallet resources out of personal selection", async () => {
    const result = await executeWalletSurfaceReconciliation(
      reconciliationPages([
        privyPage([privyUser("did:privy:service", [])]),
      ], walletResourcesForUsers({
        "did:privy:service": [
          walletResourcePage([
            walletResource({
              wallet_id: "service-wallet",
              privy_user_id: null,
              owner_id: "key-quorum-service",
            }),
          ]),
        ],
      }), [databasePage([])]),
      startedAt,
      () => completedAt,
    );

    expect(result.report.sources.privy_wallet_resources).toMatchObject({
      service_or_unassigned_records: 1,
      user_assigned_records: 1,
    });
    expect(result.report.matches.service_or_unassigned_wallet_resource).toBe(1);
    expect(result.report.matches.unmatched_service_or_unassigned_wallet_resource).toBe(1);
  });

  it("keeps owner_id-only wallet resources unresolved instead of treating them as user-owned", async () => {
    const result = await executeWalletSurfaceReconciliation(
      reconciliationPages([
        privyPage([privyUser("did:privy:service", [])]),
      ], walletResourcesForUsers({
        "did:privy:service": [
          walletResourcePage([
            walletResource({
              wallet_id: "owner-only-wallet",
              privy_user_id: null,
              owner_id: "key-quorum-owner-only",
            }),
          ]),
        ],
      }), [databasePage([])]),
      startedAt,
      () => completedAt,
    );

    expect(result.report.sources.privy_wallet_resources).toMatchObject({
      service_or_unassigned_records: 1,
      user_assigned_records: 1,
    });
    expect(result.report.matches.service_or_unassigned_wallet_resource).toBe(1);
    expect(result.report.matches.unmatched_service_or_unassigned_wallet_resource).toBe(1);
  });

  it("reports database-only rows as unmatched rather than orphaned", async () => {
    const result = await executeWalletSurfaceReconciliation(
      reconciliationPages([
        privyPage([]),
      ], walletResourcesForUsers(), [
        databasePage([databaseUser("user-row-3", "did:privy:user-3", [databaseWalletRow()])]),
      ]),
      startedAt,
      () => completedAt,
    );

    expect(result.report.sources.privy_wallet_resources).toMatchObject({
      users_scanned: 0,
      users_completed: 0,
      users_failed: 0,
      users_incomplete: 0,
    });
    expect(result.report.matches.unmatched_database_row).toBe(1);
    expect(result.report.users_requiring_reconciliation).toBe(1);
  });

  it("counts duplicate identities without collapsing them into one winner", async () => {
    const result = await executeWalletSurfaceReconciliation(
      reconciliationPages([
        privyPage([
          privyUser("did:privy:user-4", [
            embeddedWallet({ id: "dup-a", address: EVM_ADDRESS_A }),
            embeddedWallet({ id: "dup-b", address: EVM_ADDRESS_A }),
          ]),
          privyUser("did:privy:user-5", [
            embeddedWallet({ id: "multi-a", address: EVM_ADDRESS_A }),
            embeddedWallet({ id: "multi-b", address: EVM_ADDRESS_B, delegated: true }),
          ]),
        ]),
      ], walletResourcesForUsers(), [databasePage([])]),
      startedAt,
      () => completedAt,
    );

    expect(result.report.linked_users_by_inventory_outcome_code.duplicates_reconciliation_required).toBe(1);
    expect(result.report.linked_users_by_candidate_count.multiple).toBe(1);
    expect(result.report.linked_users_by_inventory_outcome_code.multiple_candidates).toBe(1);
    expect(result.report.users_with_duplicate_identities).toBe(1);
  });

  it("preserves partial aggregate counts when a later page fails", async () => {
    async function* failingUsersPages() {
      yield privyPage([privyUser("did:privy:user-6", [embeddedWallet()])]);
      throw makePrivySdkErrorLike("APIConnectionTimeoutError", 0, "timeout token");
    }

    const result = await executeWalletSurfaceReconciliation(
      {
        privyUsers: failingUsersPages(),
        privyWalletResourcesForUser: async function* () {},
        databaseUsers: pages([]),
      },
      startedAt,
      () => completedAt,
    );

    expect(result.exit_code).toBe(1);
    expect(result.report.complete).toBe(false);
    expect(result.report.pagination_completed).toBe(false);
    expect(result.report.error_code).toBe("connection_timeout");
    expect(result.report.sources.privy_users.users_scanned).toBe(1);
    expect(result.report.sources.privy_users.pages_scanned).toBe(1);
    expect(renderWalletSurfaceReconciliationReport(result.report)).not.toContain("timeout token");
  });

  it("keeps sanitized CLI gates and client construction separate", async () => {
    const createPrivyClient = vi.fn(() => ({
      users: () => ({
        list: vi.fn(async () => ({ data: [], next_cursor: "" })),
      }),
      wallets: () => ({
        list: vi.fn(async () => ({ data: [], next_cursor: "" })),
      }),
    }));
    const createPrismaClient = vi.fn(() => ({
      user: {
        findMany: vi.fn(async () => []),
      },
      $disconnect: vi.fn(async () => undefined),
    }));
    const adapters = createWalletSurfaceReconciliationLiveAdapters({
      createPrivyClient,
      createPrismaClient,
    });

    const result = await runWalletSurfaceReconciliationCli({
      argv: ["--database-read-only", "--privy-app-id", "app", "--limit", "100"],
      env: {
        NEXT_PUBLIC_PRIVY_APP_ID: "app",
        PRIVY_APP_SECRET: "secret",
        DATABASE_URL: "postgres://db",
      },
      now: () => completedAt,
      listPrivyUsers: adapters.listPrivyUsers,
      listPrivyWalletResources: adapters.listPrivyWalletResources,
      listDatabaseUsers: adapters.listDatabaseUsers,
    });

    expect(result.exit_code).toBe(1);
    expect(result.report.error_code).toBe("live_read_only_flag_required");
    expect(createPrivyClient).not.toHaveBeenCalled();
    expect(createPrismaClient).not.toHaveBeenCalled();
    expect(result.rendered).not.toContain("secret");
    expect(result.rendered).not.toContain("postgres://db");
  });

  it("memoizes live clients across all adapters", async () => {
    let privyConstructed = 0;
    let prismaConstructed = 0;
    const adapters = createWalletSurfaceReconciliationLiveAdapters({
      createPrivyClient: () => {
        privyConstructed += 1;
        return {
          users: () => ({
            list: vi.fn(async () => ({ data: [], next_cursor: "" })),
          }),
          wallets: () => ({
            list: vi.fn(async () => ({ data: [], next_cursor: "" })),
          }),
        };
      },
      createPrismaClient: () => {
        prismaConstructed += 1;
        return {
          user: {
            findMany: vi.fn(async () => []),
          },
          $disconnect: vi.fn(async () => undefined),
        };
      },
    });

    await adapters.listPrivyUsers({});
    await adapters.listPrivyWalletResources({ user_id: "did:privy:user-1" });
    await adapters.listDatabaseUsers({});
    await adapters.dispose();

    expect(privyConstructed).toBe(1);
    expect(prismaConstructed).toBe(1);
  });

  it("normalizes SDK user IDs and rejects malformed live SDK user records", async () => {
    const adapters = createWalletSurfaceReconciliationLiveAdapters({
      createPrivyClient: () => ({
        users: () => ({
          list: vi.fn(async () => ({
            data: [
              {
                id: " did:privy:user-1 ",
                linked_accounts: [embeddedWallet()],
              },
            ],
            next_cursor: "",
          })),
        }),
        wallets: () => ({
          list: vi.fn(async () => ({ data: [], next_cursor: "" })),
        }),
      }),
      createPrismaClient: () => ({
        user: {
          findMany: vi.fn(async () => []),
        },
        $disconnect: vi.fn(async () => undefined),
      }),
    });

    await expect(adapters.listPrivyUsers({ limit: 1 })).resolves.toEqual({
      data: [
        {
          privy_user_id: "did:privy:user-1",
          linked_accounts: [embeddedWallet()],
        },
      ],
      next_cursor: "",
    });

    const normalizedPage = await adapters.listPrivyUsers({ limit: 1 });
    expect(normalizedPage.data[0]).not.toHaveProperty("id");
    expect(normalizedPage.data[0]).toMatchObject({
      privy_user_id: "did:privy:user-1",
    });

    const malformedAdapters = createWalletSurfaceReconciliationLiveAdapters({
      createPrivyClient: () => ({
        users: () => ({
          list: vi.fn(async () => ({
            data: [{ id: "   ", linked_accounts: [] }],
            next_cursor: "",
          })),
        }),
        wallets: () => ({
          list: vi.fn(async () => ({ data: [], next_cursor: "" })),
        }),
      }),
      createPrismaClient: () => ({
        user: {
          findMany: vi.fn(async () => []),
        },
        $disconnect: vi.fn(async () => undefined),
      }),
    });

    await expect(malformedAdapters.listPrivyUsers({ limit: 1 })).rejects.toThrow(
      "Invalid Privy user ID",
    );
  });

  it("passes user_id and cursor through per-user wallet-resource paging", async () => {
    const queries: Array<Record<string, unknown>> = [];
    const listWalletResources = vi.fn(async (query: {
      user_id: string;
      cursor?: string;
      limit?: number;
    }) => {
      queries.push(query);
      if (queries.length === 1) {
        return walletResourcePage(
          [
            walletResource({
              wallet_id: "resource-a",
              privy_user_id: query.user_id,
              address: EVM_ADDRESS_A,
            }),
          ],
          "cursor-a",
        );
      }

      return walletResourcePage([], "");
    });

    const pageSource = createPrivyWalletResourcesPageSource(listWalletResources, "did:privy:user-1", {
      limit: 7,
    });

    const pagesSeen: Array<ReconciliationPrivyWalletResourcesPage> = [];
    for await (const page of pageSource) {
      pagesSeen.push(page);
    }

    expect(queries).toEqual([
      { user_id: "did:privy:user-1", limit: 7 },
      { user_id: "did:privy:user-1", cursor: "cursor-a", limit: 7 },
    ]);
    expect(pagesSeen).toHaveLength(2);
  });

  it("scans distinct Privy users sequentially and completes when each wallet-resource page terminates cleanly", async () => {
    const requestedUserIds: string[] = [];
    const privyUsers = Array.from({ length: 35 }, (_, index) =>
      privyUser(`did:privy:user-${index + 1}`, []),
    );

    const result = await executeWalletSurfaceReconciliation(
      reconciliationPages([
        privyPage(privyUsers),
      ], async function* walletResourcesForUser(privyUserId: string) {
        requestedUserIds.push(privyUserId);
        yield walletResourcePage([], "");
      }, [databasePage([])]),
      startedAt,
      () => completedAt,
    );

    expect(requestedUserIds).toHaveLength(35);
    expect(new Set(requestedUserIds).size).toBe(35);
    expect(requestedUserIds.every((value) => typeof value === "string" && value.length > 0)).toBe(
      true,
    );
    expect(result.report.sources.privy_wallet_resources).toMatchObject({
      users_scanned: 35,
      users_completed: 35,
      users_failed: 0,
      users_incomplete: 0,
    });
    expect(result.report.complete).toBe(true);
    expect(result.report.pagination_completed).toBe(true);
    expect(result.report).not.toMatchObject({
      complete: true,
      sources: {
        privy_wallet_resources: {
          users_completed: 1,
          users_incomplete: 36,
        },
      },
    });
  });

  it("deduplicates repeated Privy user IDs without issuing duplicate wallet-resource requests", async () => {
    const requestedUserIds: string[] = [];

    const result = await executeWalletSurfaceReconciliation(
      reconciliationPages([
        privyPage([
          privyUser("did:privy:user-1", []),
          privyUser("did:privy:user-1", []),
        ]),
      ], async function* walletResourcesForUser(privyUserId: string) {
        requestedUserIds.push(privyUserId);
        yield walletResourcePage([], "");
      }, [databasePage([])]),
      startedAt,
      () => completedAt,
    );

    expect(requestedUserIds).toEqual(["did:privy:user-1"]);
    expect(result.report.sources.privy_wallet_resources.users_scanned).toBe(1);
    expect(result.report.sources.privy_wallet_resources.users_completed).toBe(1);
    expect(result.report.sources.privy_wallet_resources.users_incomplete).toBe(0);
    expect(result.report.complete).toBe(true);
  });

  it("treats an unscanned wallet-resource user as incomplete and keeps the report incomplete", () => {
    const accumulator = createWalletSurfaceReconciliationAccumulator(startedAt);
    accumulator.ingestPrivyUsersPage(
      privyPage([privyUser("did:privy:user-1", [embeddedWallet()])]),
    );

    const report = accumulator.finalize({
      complete: true,
      pagination_completed: true,
      error_code: null,
      now: () => completedAt,
    });

    expect(report.sources.privy_wallet_resources.users_scanned).toBe(1);
    expect(report.sources.privy_wallet_resources.users_completed).toBe(0);
    expect(report.sources.privy_wallet_resources.users_failed).toBe(0);
    expect(report.sources.privy_wallet_resources.users_incomplete).toBe(1);
    expect(report.complete).toBe(false);
    expect(report.pagination_completed).toBe(false);
  });

  it("normalizes SDK users pages into reconciliation pages and accepts an empty terminal cursor", async () => {
    const queries: Array<Record<string, unknown>> = [];
    const listUsers = vi.fn(async (query: { cursor?: string; limit?: number }) => {
      queries.push(query);

      if (queries.length === 1) {
        return Object.create(null, {
          data: {
            value: [privyUser("did:privy:user-1", [embeddedWallet()])],
            enumerable: true,
          },
          next_cursor: {
            value: "cursor-a",
            enumerable: true,
          },
        }) as ReconciliationPrivyUsersPage;
      }

      return Object.create(null, {
        data: {
          value: [],
          enumerable: true,
        },
        next_cursor: {
          value: "",
          enumerable: true,
        },
      }) as ReconciliationPrivyUsersPage;
    });

    const result = await executeWalletSurfaceReconciliation(
      {
        privyUsers: createPrivyUsersPageSource(listUsers, { limit: 7 }),
        privyWalletResourcesForUser: () => pages([walletResourcePage([], "")]),
        databaseUsers: pages([databasePage([], "")]),
      },
      startedAt,
      () => completedAt,
    );

    expect(result.exit_code).toBe(0);
    expect(result.report.complete).toBe(true);
    expect(result.report.pagination_completed).toBe(true);
    expect(result.report.sources.privy_users.pages_scanned).toBe(2);
    expect(result.report.sources.privy_users.users_scanned).toBe(1);
    expect(queries).toEqual([
      { limit: 7 },
      { cursor: "cursor-a", limit: 7 },
    ]);
  });

  it("fails closed when a users page has malformed data or cursor", async () => {
    const malformedData = await executeWalletSurfaceReconciliation(
      {
        privyUsers: createPrivyUsersPageSource(
          vi.fn(async () => ({ data: {} as unknown as ReadonlyArray<ReconciliationPrivyUserInput>, next_cursor: "" })),
          { limit: 7 },
        ),
        privyWalletResourcesForUser: () => pages([walletResourcePage([], "")]),
        databaseUsers: pages([databasePage([], "")]),
      },
      startedAt,
      () => completedAt,
    );

    expect(malformedData.exit_code).toBe(1);
    expect(malformedData.report.error_code).toBe("invalid_page_shape");

    const malformedCursor = await executeWalletSurfaceReconciliation(
      {
        privyUsers: createPrivyUsersPageSource(
          vi.fn(async () => ({ data: [], next_cursor: null as unknown as string })),
          { limit: 7 },
        ),
        privyWalletResourcesForUser: () => pages([walletResourcePage([], "")]),
        databaseUsers: pages([databasePage([], "")]),
      },
      startedAt,
      () => completedAt,
    );

    expect(malformedCursor.exit_code).toBe(1);
    expect(malformedCursor.report.error_code).toBe("invalid_page_shape");
  });

  it("fails closed on an empty users page with a continuation cursor and on a repeated users cursor", async () => {
    const emptyContinuation = await executeWalletSurfaceReconciliation(
      {
        privyUsers: createPrivyUsersPageSource(
          vi.fn(async () => ({ data: [], next_cursor: "cursor-a" })),
          { limit: 7 },
        ),
        privyWalletResourcesForUser: () => pages([walletResourcePage([], "")]),
        databaseUsers: pages([databasePage([], "")]),
      },
      startedAt,
      () => completedAt,
    );

    expect(emptyContinuation.exit_code).toBe(1);
    expect(emptyContinuation.report.error_code).toBe("invalid_page_shape");

    const listUsers = vi.fn(async (query: { cursor?: string; limit?: number }) => {
      if (!query.cursor) {
        return privyPage([privyUser("did:privy:user-1", [embeddedWallet()])], "cursor-a");
      }

      return privyPage([privyUser("did:privy:user-2", [embeddedWallet({ id: "embedded-wallet-2" })])], "cursor-a");
    });

    const repeatedCursor = await executeWalletSurfaceReconciliation(
      {
        privyUsers: createPrivyUsersPageSource(listUsers, { limit: 7 }),
        privyWalletResourcesForUser: () => pages([walletResourcePage([], "")]),
        databaseUsers: pages([databasePage([], "")]),
      },
      startedAt,
      () => completedAt,
    );

    expect(repeatedCursor.exit_code).toBe(1);
    expect(repeatedCursor.report.error_code).toBe("pagination_loop_detected");
  });

  it("preserves earlier wallet-resource aggregates when a later user scan fails", async () => {
    async function* walletResourcesForUser(privyUserId: string) {
      if (privyUserId === "did:privy:user-1") {
        yield walletResourcePage([
          walletResource({
            wallet_id: "resource-user-1",
            privy_user_id: privyUserId,
            address: EVM_ADDRESS_A,
          }),
        ]);
        return;
      }

      yield walletResourcePage([
        walletResource({
          wallet_id: "resource-user-2",
          privy_user_id: privyUserId,
          address: EVM_ADDRESS_B,
        }),
      ]);
      throw makePrivySdkErrorLike("APIConnectionTimeoutError", 0, "timeout token");
    }

    const result = await executeWalletSurfaceReconciliation(
      reconciliationPages([
        privyPage([
          privyUser("did:privy:user-1", [embeddedWallet({ address: EVM_ADDRESS_A })]),
          privyUser("did:privy:user-2", [embeddedWallet({ address: EVM_ADDRESS_B })]),
        ]),
      ], walletResourcesForUser, [databasePage([])]),
      startedAt,
      () => completedAt,
    );

    expect(result.exit_code).toBe(1);
    expect(result.report.complete).toBe(false);
    expect(result.report.pagination_completed).toBe(false);
    expect(result.report.error_code).toBe("connection_timeout");
    expect(result.report.sources.privy_wallet_resources.users_completed).toBe(1);
    expect(result.report.sources.privy_wallet_resources.users_failed).toBe(1);
    expect(result.report.sources.privy_wallet_resources.users_incomplete).toBe(0);
    expect(result.report.sources.privy_wallet_resources.records_scanned).toBe(2);
    expect(result.report.sources.privy_wallet_resources.unique_records_scanned).toBe(2);
  });

  it("counts a wallet resource returned under multiple user filters as a conflict", async () => {
    async function* walletResourcesForUser(privyUserId: string) {
      yield walletResourcePage([
        walletResource({
          wallet_id: "resource-shared",
          privy_user_id: privyUserId,
          address: EVM_ADDRESS_A,
        }),
      ]);
    }

    const result = await executeWalletSurfaceReconciliation(
      reconciliationPages([
        privyPage([
          privyUser("did:privy:user-1", [embeddedWallet({ address: EVM_ADDRESS_A })]),
          privyUser("did:privy:user-2", [embeddedWallet({ address: EVM_ADDRESS_B })]),
        ]),
      ], walletResourcesForUser, [databasePage([])]),
      startedAt,
      () => completedAt,
    );

    expect(result.report.sources.privy_wallet_resources.resources_returned_under_multiple_user_filters).toBe(1);
    expect(result.report.sources.privy_wallet_resources.resources_returned_under_exactly_one_user_filter).toBe(0);
    expect(result.report.users_with_conflicting_ownership).toBe(2);
    expect(result.report.users_requiring_reconciliation).toBe(2);
  });

  it("produces the same reconciliation outcome when user order changes", async () => {
    async function* walletResourcesForUser(privyUserId: string) {
      yield walletResourcePage([
        walletResource({
          wallet_id: `resource-${privyUserId.slice(-1)}`,
          privy_user_id: privyUserId,
          address: privyUserId.endsWith("1") ? EVM_ADDRESS_A : EVM_ADDRESS_B,
        }),
      ]);
    }

    const first = await executeWalletSurfaceReconciliation(
      reconciliationPages([
        privyPage([
          privyUser("did:privy:user-1", [embeddedWallet({ address: EVM_ADDRESS_A })]),
          privyUser("did:privy:user-2", [embeddedWallet({ address: EVM_ADDRESS_B })]),
        ]),
      ], walletResourcesForUser, [databasePage([])]),
      startedAt,
      () => completedAt,
    );

    const second = await executeWalletSurfaceReconciliation(
      reconciliationPages([
        privyPage([
          privyUser("did:privy:user-2", [embeddedWallet({ address: EVM_ADDRESS_B })]),
          privyUser("did:privy:user-1", [embeddedWallet({ address: EVM_ADDRESS_A })]),
        ]),
      ], walletResourcesForUser, [databasePage([])]),
      startedAt,
      () => completedAt,
    );

    expect(second.report.counts).toEqual(first.report.counts);
    expect(second.report.matches).toEqual(first.report.matches);
    expect(second.report.linked_users_by_candidate_count).toEqual(
      first.report.linked_users_by_candidate_count,
    );
    expect(second.report.users_requiring_reconciliation).toBe(first.report.users_requiring_reconciliation);
    expect(second.report.users_with_conflicting_ownership).toBe(first.report.users_with_conflicting_ownership);
  });

  it("fails closed on an empty wallet-resource page with a continuation cursor", async () => {
    const listWalletResources = vi.fn(async () => walletResourcePage([], "cursor-a"));

    const result = await executeWalletSurfaceReconciliation(
      reconciliationPages([
        privyPage([privyUser("did:privy:user-1", [embeddedWallet()])]),
      ], async function* walletResourcesForUser() {
        yield* createPrivyWalletResourcesPageSource(
          listWalletResources,
          "did:privy:user-1",
        );
      }, [databasePage([])]),
      startedAt,
      () => completedAt,
    );

    expect(result.exit_code).toBe(1);
    expect(result.report.complete).toBe(false);
    expect(result.report.pagination_completed).toBe(false);
    expect(result.report.error_code).toBe("invalid_page_shape");
    expect(listWalletResources).toHaveBeenCalledWith({
      user_id: "did:privy:user-1",
    });
  });

  it("disconnects Prisma on success and failure through the live adapter cleanup path", async () => {
    const disconnect = vi.fn(async () => undefined);
    const adapters = createWalletSurfaceReconciliationLiveAdapters({
      createPrivyClient: () => ({
        users: () => ({
          list: vi.fn(async () => ({ data: [], next_cursor: "" })),
        }),
        wallets: () => ({
          list: vi.fn(async () => ({ data: [], next_cursor: "" })),
        }),
      }),
      createPrismaClient: () => ({
        user: {
          findMany: vi.fn(async () => []),
        },
        $disconnect: disconnect,
      }),
    });

    await adapters.listDatabaseUsers({ limit: 1 });
    await adapters.dispose();
    expect(disconnect).toHaveBeenCalledTimes(1);

    const failingDisconnect = vi.fn(async () => undefined);
    const failingAdapters = createWalletSurfaceReconciliationLiveAdapters({
      createPrivyClient: () => ({
        users: () => ({
          list: vi.fn(async () => ({ data: [], next_cursor: "" })),
        }),
        wallets: () => ({
          list: vi.fn(async () => ({ data: [], next_cursor: "" })),
        }),
      }),
      createPrismaClient: () => ({
        user: {
          findMany: vi.fn(async () => {
            throw new Error("db read failed");
          }),
        },
        $disconnect: failingDisconnect,
      }),
    });

    await expect(failingAdapters.listDatabaseUsers({ limit: 1 })).rejects.toThrow();
    await failingAdapters.dispose();
    expect(failingDisconnect).toHaveBeenCalledTimes(1);
  });

  it("rejects malformed CLI arguments and unsafe limits", () => {
    expect(() => parseWalletSurfaceReconciliationArgs(["--bogus"])).toThrow();
    expect(() => parseWalletSurfaceReconciliationArgs(["--limit", "0"])).toThrow();
    expect(() => parseWalletSurfaceReconciliationArgs(["--limit", "101"])).toThrow();
    expect(
      validateWalletSurfaceReconciliationLiveConfig({
        live_read_only: true,
        database_read_only: true,
        privy_app_id: "app",
        env: {
          NEXT_PUBLIC_PRIVY_APP_ID: "app",
          PRIVY_APP_SECRET: "secret",
        },
      }),
    ).toMatchObject({ ok: false, error_code: "missing_database_environment" });
  });

  it("does not echo identifiers or raw SDK errors in the rendered report", async () => {
    const result = await executeWalletSurfaceReconciliation(
      reconciliationPages([
        privyPage([privyUser("did:privy:user-7", [embeddedWallet({ id: "wallet-id-7" })])]),
      ], walletResourcesForUsers({
        "did:privy:user-7": [
          walletResourcePage([
            walletResource({
              wallet_id: "wallet-resource-7",
              privy_user_id: "did:privy:user-7",
              address: EVM_ADDRESS_A,
            }),
          ]),
        ],
      }), [databasePage([])]),
      startedAt,
      () => completedAt,
    );

    const rendered = renderWalletSurfaceReconciliationReport(result.report);
    expect(rendered).not.toContain("did:privy:user-7");
    expect(rendered).not.toContain("wallet-id-7");
    expect(rendered).not.toContain("wallet-resource-7");
    expect(rendered).not.toContain("secret");
    expect(rendered).not.toContain("timeout token");
  });
});
