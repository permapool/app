import type {
  NormalizedPrivyLinkedWalletAccount,
  PrivyLinkedWalletAccountInput,
  WalletAuthority,
  WalletChainNamespace,
  WalletInventoryOutcome,
  WalletInventoryReasonCode,
  WalletKind,
  WalletOrigin,
  WalletSelectionStatus,
} from "./wallet-inventory";
import { classifyPrivyLinkedWalletInventory } from "./wallet-inventory";

export type WalletInventoryAuditErrorCode =
  | "live_read_only_flag_required"
  | "missing_privy_environment"
  | "missing_privy_app_context"
  | "inconsistent_privy_app_id"
  | "missing_privy_live_adapter"
  | "invalid_cli_arguments"
  | "invalid_page_shape"
  | "pagination_loop_detected"
  | "pagination_failed"
  | "authentication_failed"
  | "permission_denied"
  | "rate_limited"
  | "connection_failed"
  | "connection_timeout"
  | "invalid_request"
  | "upstream_failed"
  | "unknown_sdk_failure";

type BucketKey<T extends string> = T | "unknown";

export type WalletKindBucket = BucketKey<WalletKind>;
export type WalletOriginBucket = BucketKey<WalletOrigin>;
export type WalletChainNamespaceBucket = BucketKey<WalletChainNamespace>;
export type WalletAuthorityBucket = BucketKey<WalletAuthority>;
export type WalletSelectionStatusBucket = BucketKey<WalletSelectionStatus>;
export type WalletInventoryOutcomeBucket = BucketKey<WalletInventoryOutcome>;
export type WalletInventoryReasonCodeBucket = BucketKey<WalletInventoryReasonCode>;

export interface WalletInventoryAuditUser {
  linked_accounts: ReadonlyArray<PrivyLinkedWalletAccountInput>;
}

export interface WalletInventoryAuditPage {
  users: ReadonlyArray<WalletInventoryAuditUser>;
}

export interface PrivyUsersListQuery {
  cursor?: string;
  limit?: number;
}

export interface PrivyUsersListPage {
  data: ReadonlyArray<WalletInventoryAuditUser>;
  next_cursor: string;
}

export type PrivyUsersListFn = (
  query: PrivyUsersListQuery,
) => Promise<PrivyUsersListPage>;

export interface PrivyUsersClientLike {
  list(query: PrivyUsersListQuery): Promise<PrivyUsersListPage>;
}

export interface WalletInventoryAuditCounts {
  wallet_kind: Record<WalletKindBucket, number>;
  origin: Record<WalletOriginBucket, number>;
  chain_namespace: Record<WalletChainNamespaceBucket, number>;
  authority: Record<WalletAuthorityBucket, number>;
  selection_status: Record<WalletSelectionStatusBucket, number>;
  reason_code: Record<WalletInventoryReasonCodeBucket, number>;
}

export interface WalletInventoryAuditReport {
  schema_version: 1;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  complete: boolean;
  pagination_completed: boolean;
  users_scanned: number;
  pages_scanned: number;
  linked_accounts_scanned: number;
  counts: WalletInventoryAuditCounts;
  users_by_candidate_count: {
    zero: number;
    one: number;
    multiple: number;
  };
  users_by_inventory_outcome_code: Record<WalletInventoryOutcomeBucket, number>;
  users_requiring_duplicate_reconciliation: number;
  users_containing_invalid_unsupported_records: number;
  users_containing_ambiguous_authority: number;
  error_code: WalletInventoryAuditErrorCode | null;
}

export interface WalletInventoryAuditExecution {
  report: WalletInventoryAuditReport;
  exit_code: number;
}

export interface WalletInventoryAuditLiveConfig {
  live_read_only: boolean;
  privy_app_id: string | null;
  env: Readonly<Record<string, string | undefined>>;
}

export interface WalletInventoryAuditCliOptions {
  argv: ReadonlyArray<string>;
  env: Readonly<Record<string, string | undefined>>;
  now?: () => Date;
  limit?: number;
  listUsers?: PrivyUsersListFn;
}

export interface WalletInventoryAuditCliResult extends WalletInventoryAuditExecution {
  rendered: string;
}

const WALLET_KIND_BUCKETS = ["eoa", "smart_wallet", "unknown"] as const;
const WALLET_ORIGIN_BUCKETS = ["embedded", "external", "unknown"] as const;
const WALLET_CHAIN_BUCKETS = [
  "ethereum",
  "solana",
  "unsupported",
  "unknown",
] as const;
const WALLET_AUTHORITY_BUCKETS = [
  "user",
  "server_signer_present",
  "service",
  "unknown",
] as const;
const WALLET_SELECTION_BUCKETS = [
  "candidate",
  "ineligible",
  "ambiguous",
  "unknown",
] as const;
const WALLET_OUTCOME_BUCKETS = [
  "no_candidate",
  "exactly_one_candidate",
  "multiple_candidates",
  "ambiguous_authority",
  "duplicates_reconciliation_required",
  "unknown",
] as const;
const WALLET_REASON_BUCKETS = [
  "embedded_evm_candidate",
  "authority_unverified",
  "external_wallet_not_default",
  "solana_not_eligible_for_base_policy",
  "smart_wallet_requires_separate_policy",
  "delegated_server_signer_present",
  "missing_required_metadata",
  "unsupported_account_type",
  "invalid_address",
  "duplicate_identity_requires_reconciliation",
  "unknown",
] as const;

const MAX_PAGE_LIMIT = 1000;

class WalletInventoryAuditError extends Error {
  code: WalletInventoryAuditErrorCode;

  constructor(code: WalletInventoryAuditErrorCode) {
    super(code);
    this.code = code;
  }
}

function createBucketRecord<const Keys extends ReadonlyArray<string>>(
  keys: Keys,
) {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<
    Keys[number],
    number
  >;
}

function bucketFromSet<T extends string>(
  value: string,
  allowed: readonly T[],
): BucketKey<T> {
  return (allowed as readonly string[]).includes(value) ? (value as T) : "unknown";
}

function getPrivySdkErrorClassName(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const constructorName = (error as { constructor?: { name?: string } }).constructor?.name;
  return typeof constructorName === "string" ? constructorName : null;
}

function getPrivySdkErrorStatus(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : null;
}

export function classifyPrivySdkError(error: unknown): WalletInventoryAuditErrorCode | null {
  const className = getPrivySdkErrorClassName(error);
  const status = getPrivySdkErrorStatus(error);

  if (className === "APIConnectionTimeoutError") {
    return "connection_timeout";
  }

  if (className === "APIConnectionError") {
    return "connection_failed";
  }

  if (className === "AuthenticationError") {
    return "authentication_failed";
  }

  if (className === "PermissionDeniedError") {
    return "permission_denied";
  }

  if (className === "RateLimitError") {
    return "rate_limited";
  }

  if (
    className === "BadRequestError" ||
    className === "NotFoundError" ||
    className === "ConflictError" ||
    className === "UnprocessableEntityError"
  ) {
    return "invalid_request";
  }

  if (className === "InternalServerError") {
    return "upstream_failed";
  }

  if (className === "APIError") {
    if (status === 401) {
      return "authentication_failed";
    }

    if (status === 403) {
      return "permission_denied";
    }

    if (status === 429) {
      return "rate_limited";
    }

    if (status != null && status >= 400 && status < 500) {
      return "invalid_request";
    }

    if (status != null && status >= 500) {
      return "upstream_failed";
    }

    return "unknown_sdk_failure";
  }

  if (className === "PrivyAPIError") {
    return "unknown_sdk_failure";
  }

  return null;
}

export function bucketWalletKind(value: string): WalletKindBucket {
  return bucketFromSet(value, WALLET_KIND_BUCKETS);
}

export function bucketWalletOrigin(value: string): WalletOriginBucket {
  return bucketFromSet(value, WALLET_ORIGIN_BUCKETS);
}

export function bucketWalletChainNamespace(value: string): WalletChainNamespaceBucket {
  return bucketFromSet(value, WALLET_CHAIN_BUCKETS);
}

export function bucketWalletAuthority(value: string): WalletAuthorityBucket {
  return bucketFromSet(value, WALLET_AUTHORITY_BUCKETS);
}

export function bucketWalletSelectionStatus(
  value: string,
): WalletSelectionStatusBucket {
  return bucketFromSet(value, WALLET_SELECTION_BUCKETS);
}

export function bucketWalletInventoryOutcome(
  value: string,
): WalletInventoryOutcomeBucket {
  return bucketFromSet(value, WALLET_OUTCOME_BUCKETS);
}

export function bucketWalletInventoryReasonCode(
  value: string,
): WalletInventoryReasonCodeBucket {
  return bucketFromSet(value, WALLET_REASON_BUCKETS);
}

export function createPrivyUsersListFn(
  createUsersClient: () => PrivyUsersClientLike,
): PrivyUsersListFn {
  let usersClient: PrivyUsersClientLike | null = null;

  return async (query) => {
    usersClient ??= createUsersClient();
    const page = await usersClient.list(query);

    return {
      data: page.data,
      next_cursor: page.next_cursor,
    };
  };
}

export function createEmptyWalletInventoryAuditReport(
  startedAt: Date,
): WalletInventoryAuditReport {
  return {
    schema_version: 1,
    started_at: startedAt.toISOString(),
    completed_at: null,
    duration_ms: null,
    complete: false,
    pagination_completed: false,
    users_scanned: 0,
    pages_scanned: 0,
    linked_accounts_scanned: 0,
    counts: {
      wallet_kind: createBucketRecord(WALLET_KIND_BUCKETS),
      origin: createBucketRecord(WALLET_ORIGIN_BUCKETS),
      chain_namespace: createBucketRecord(WALLET_CHAIN_BUCKETS),
      authority: createBucketRecord(WALLET_AUTHORITY_BUCKETS),
      selection_status: createBucketRecord(WALLET_SELECTION_BUCKETS),
      reason_code: createBucketRecord(WALLET_REASON_BUCKETS),
    },
    users_by_candidate_count: {
      zero: 0,
      one: 0,
      multiple: 0,
    },
    users_by_inventory_outcome_code: createBucketRecord(WALLET_OUTCOME_BUCKETS),
    users_requiring_duplicate_reconciliation: 0,
    users_containing_invalid_unsupported_records: 0,
    users_containing_ambiguous_authority: 0,
    error_code: null,
  };
}

function countBucket(counts: Record<string, number>, key: string) {
  counts[key] = (counts[key] ?? 0) + 1;
}

function countRecordDimensions(
  report: WalletInventoryAuditReport,
  record: NormalizedPrivyLinkedWalletAccount,
) {
  countBucket(report.counts.wallet_kind, bucketWalletKind(record.kind));
  countBucket(report.counts.origin, bucketWalletOrigin(record.origin));
  countBucket(
    report.counts.chain_namespace,
    bucketWalletChainNamespace(record.chainNamespace),
  );
  countBucket(report.counts.authority, bucketWalletAuthority(record.authority));
  countBucket(
    report.counts.selection_status,
    bucketWalletSelectionStatus(record.selectionStatus),
  );

  for (const reasonCode of record.reasonCodes) {
    countBucket(report.counts.reason_code, bucketWalletInventoryReasonCode(reasonCode));
  }
}

function countUserOutcomeDimensions(
  report: WalletInventoryAuditReport,
  outcomeCode: string,
) {
  countBucket(
    report.users_by_inventory_outcome_code,
    bucketWalletInventoryOutcome(outcomeCode),
  );
}

function countClassifierReport(report: WalletInventoryAuditReport, linkedAccounts: ReadonlyArray<PrivyLinkedWalletAccountInput>) {
  const classification = classifyPrivyLinkedWalletInventory(linkedAccounts);

  for (const record of classification.records) {
    countRecordDimensions(report, record);
    report.linked_accounts_scanned += 1;
  }

  switch (classification.summary.candidateCount) {
    case 0:
      report.users_by_candidate_count.zero += 1;
      break;
    case 1:
      report.users_by_candidate_count.one += 1;
      break;
    default:
      report.users_by_candidate_count.multiple += 1;
      break;
  }

  for (const outcomeCode of classification.summary.outcomeCodes) {
    countUserOutcomeDimensions(report, outcomeCode);
  }

  if (
    classification.summary.outcomeCodes.includes(
      "duplicates_reconciliation_required",
    )
  ) {
    report.users_requiring_duplicate_reconciliation += 1;
  }

  if (
    classification.summary.outcomeCodes.includes("ambiguous_authority")
  ) {
    report.users_containing_ambiguous_authority += 1;
  }

  if (
    classification.records.some(
      (record) => record.normalizationStatus === "invalid",
    )
  ) {
    report.users_containing_invalid_unsupported_records += 1;
  }

  return classification;
}

export async function executeWalletInventoryAudit(
  pages: AsyncIterable<WalletInventoryAuditPage>,
  startedAt = new Date(),
  now: () => Date = () => new Date(),
): Promise<WalletInventoryAuditExecution> {
  const report = createEmptyWalletInventoryAuditReport(startedAt);

  try {
    for await (const page of pages) {
      report.pages_scanned += 1;

      if (!page || !Array.isArray(page.users)) {
        throw new WalletInventoryAuditError("invalid_page_shape");
      }

      for (const user of page.users) {
        report.users_scanned += 1;
        countClassifierReport(report, user.linked_accounts ?? []);
      }
    }

    report.complete = true;
    report.pagination_completed = true;
    report.completed_at = now().toISOString();
    report.duration_ms = Date.parse(report.completed_at) - Date.parse(report.started_at);

    return { report, exit_code: 0 };
  } catch (_error) {
    report.complete = false;
    report.pagination_completed = false;
    report.completed_at = now().toISOString();
    report.duration_ms = Date.parse(report.completed_at) - Date.parse(report.started_at);
    report.error_code =
      _error instanceof WalletInventoryAuditError
        ? _error.code
        : classifyPrivySdkError(_error) ?? "pagination_failed";

    return { report, exit_code: 1 };
  }
}

export async function* createPrivyUsersPageSource(
  listUsers: PrivyUsersListFn,
  options: { limit?: number } = {},
): AsyncGenerator<WalletInventoryAuditPage> {
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  let pageCount = 0;
  const pageLimit = options.limit;

  while (true) {
    if (cursor && seenCursors.has(cursor)) {
      throw new WalletInventoryAuditError("pagination_loop_detected");
    }

    if (cursor) {
      seenCursors.add(cursor);
    }

    let page: PrivyUsersListPage;
    try {
      page = await listUsers({
        cursor,
        limit: pageLimit,
      });
    } catch (_error) {
      throw new WalletInventoryAuditError(
        classifyPrivySdkError(_error) ?? "pagination_failed",
      );
    }

    if (
      !page ||
      !Array.isArray(page.data) ||
      typeof page.next_cursor !== "string"
    ) {
      throw new WalletInventoryAuditError("invalid_page_shape");
    }

    pageCount += 1;
    yield {
      users: page.data.map((user) => ({
        linked_accounts: user.linked_accounts ?? [],
      })),
    };

    if (!page.next_cursor) {
      return;
    }

    cursor = page.next_cursor;

    if (pageCount > 10_000) {
      throw new WalletInventoryAuditError("pagination_loop_detected");
    }
  }
}

export function parseWalletInventoryAuditArgs(argv: ReadonlyArray<string>) {
  const args = {
    live_read_only: false,
    privy_app_id: null as string | null,
    limit: undefined as number | undefined,
  };
  const seenFlags = new Set<string>();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith("--")) {
      throw new WalletInventoryAuditError("invalid_cli_arguments");
    }

    if (seenFlags.has(arg)) {
      throw new WalletInventoryAuditError("invalid_cli_arguments");
    }

    if (arg === "--live-read-only") {
      seenFlags.add(arg);
      args.live_read_only = true;
      continue;
    }

    if (arg === "--privy-app-id") {
      seenFlags.add(arg);
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new WalletInventoryAuditError("invalid_cli_arguments");
      }

      args.privy_app_id = value;
      index += 1;
      continue;
    }

    if (arg === "--limit") {
      seenFlags.add(arg);
      const value = argv[index + 1];
      const parsed = Number(value);
      if (
        !value ||
        value.startsWith("--") ||
        !Number.isInteger(parsed) ||
        parsed <= 0 ||
        parsed > MAX_PAGE_LIMIT
      ) {
        throw new WalletInventoryAuditError("invalid_cli_arguments");
      }

      args.limit = parsed;
      index += 1;
      continue;
    }

    throw new WalletInventoryAuditError("invalid_cli_arguments");
  }

  return args;
}

export function validateWalletInventoryAuditLiveConfig(
  config: WalletInventoryAuditLiveConfig,
) {
  const publicAppId = config.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() || null;
  const secret = config.env.PRIVY_APP_SECRET?.trim() || null;
  const optionalServerAppId = config.env.PRIVY_APP_ID?.trim() || null;

  if (!config.live_read_only) {
    return {
      ok: false as const,
      error_code: "live_read_only_flag_required" as const,
    };
  }

  if (!publicAppId || !secret) {
    return {
      ok: false as const,
      error_code: "missing_privy_environment" as const,
    };
  }

  if (optionalServerAppId && optionalServerAppId !== publicAppId) {
    return {
      ok: false as const,
      error_code: "inconsistent_privy_app_id" as const,
    };
  }

  if (!config.privy_app_id) {
    return {
      ok: false as const,
      error_code: "missing_privy_app_context" as const,
    };
  }

  if (config.privy_app_id !== publicAppId) {
    return {
      ok: false as const,
      error_code: "inconsistent_privy_app_id" as const,
    };
  }

  return {
    ok: true as const,
    app_id: publicAppId,
  };
}

export function renderWalletInventoryAuditReport(
  report: WalletInventoryAuditReport,
) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function finalizeFailedExecution(
  startedAt: Date,
  now: () => Date,
  errorCode: WalletInventoryAuditErrorCode,
): WalletInventoryAuditExecution {
  const report = createEmptyWalletInventoryAuditReport(startedAt);
  report.complete = false;
  report.pagination_completed = false;
  report.completed_at = now().toISOString();
  report.duration_ms = Date.parse(report.completed_at) - Date.parse(report.started_at);
  report.error_code = errorCode;
  return { report, exit_code: 1 };
}

export async function runWalletInventoryAuditCli(
  options: WalletInventoryAuditCliOptions,
): Promise<WalletInventoryAuditCliResult> {
  const startedAt = options.now?.() ?? new Date();
  let parsed: ReturnType<typeof parseWalletInventoryAuditArgs>;

  try {
    parsed = parseWalletInventoryAuditArgs(options.argv);
  } catch (_error) {
    const execution = finalizeFailedExecution(
      startedAt,
      options.now ?? (() => new Date()),
      _error instanceof WalletInventoryAuditError
        ? _error.code
        : "invalid_cli_arguments",
    );

    return {
      ...execution,
      rendered: renderWalletInventoryAuditReport(execution.report),
    };
  }

  const validation = validateWalletInventoryAuditLiveConfig({
    live_read_only: parsed.live_read_only,
    privy_app_id: parsed.privy_app_id,
    env: options.env,
  });

  if (!validation.ok) {
    const execution = finalizeFailedExecution(
      startedAt,
      options.now ?? (() => new Date()),
      validation.error_code,
    );

    return {
      ...execution,
      rendered: renderWalletInventoryAuditReport(execution.report),
    };
  }

  if (!options.listUsers) {
    const execution = finalizeFailedExecution(
      startedAt,
      options.now ?? (() => new Date()),
      "missing_privy_live_adapter",
    );

    return {
      ...execution,
      rendered: renderWalletInventoryAuditReport(execution.report),
    };
  }

  const pages = createPrivyUsersPageSource(options.listUsers, {
    limit: parsed.limit,
  });
  const execution = await executeWalletInventoryAudit(
    pages,
    startedAt,
    options.now ?? (() => new Date()),
  );

  return {
    ...execution,
    rendered: renderWalletInventoryAuditReport(execution.report),
  };
}
