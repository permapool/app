import { getAddress, isAddress } from "viem";
import { isAddress as isSolanaAddress } from "@solana/kit";
import {
  classifyPrivyLinkedWalletInventory,
  type PrivyLinkedWalletAccountInput,
  type WalletAuthority,
  type WalletChainNamespace,
  type WalletInventoryOutcome,
  type WalletInventoryReasonCode,
  type WalletKind,
  type WalletOrigin,
  type WalletSelectionStatus,
} from "./wallet-inventory";
import { classifyPrivySdkError } from "./wallet-inventory-audit";

export type WalletSurfaceReconciliationErrorCode =
  | "live_read_only_flag_required"
  | "database_read_authorization_required"
  | "missing_privy_environment"
  | "missing_privy_app_context"
  | "missing_database_environment"
  | "inconsistent_privy_app_id"
  | "inconsistent_database_url"
  | "missing_privy_live_adapter"
  | "missing_database_live_adapter"
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
  | "unknown_sdk_failure"
  | "database_authentication_failed"
  | "database_permission_denied"
  | "database_rate_limited"
  | "database_connection_failed"
  | "database_connection_timeout"
  | "database_invalid_request"
  | "database_upstream_failed"
  | "database_unknown_failure";

type BucketKey<T extends string> = T | "unknown";

export type WalletKindBucket = BucketKey<WalletKind>;
export type WalletOriginBucket = BucketKey<WalletOrigin>;
export type WalletChainNamespaceBucket = BucketKey<WalletChainNamespace>;
export type WalletAuthorityBucket = BucketKey<WalletAuthority>;
export type WalletSelectionStatusBucket = BucketKey<WalletSelectionStatus>;
export type WalletInventoryOutcomeBucket = BucketKey<WalletInventoryOutcome>;
export type WalletInventoryReasonCodeBucket = BucketKey<WalletInventoryReasonCode>;

export type WalletResourceAssignmentBucket = "user" | "service_or_unassigned" | "unknown";
export type WalletResourceAuthorityBucket = "single_owner" | "delegated" | "unknown";
export type WalletResourceStateBucket = "active" | "archived" | "exported" | "imported" | "unknown";

export interface ReconciliationPrivyLinkedAccountInput {
  type: string;
  id?: string | null;
  address?: string | null;
  chain_type?: "ethereum" | "solana" | (string & {}) | null;
  wallet_client?: string | null;
  wallet_client_type?: string | null;
  connector_type?: string | null;
  delegated?: boolean | null;
  imported?: boolean | null;
  wallet_index?: number | null;
  recovery_method?: string | null;
}

export interface ReconciliationPrivyUserInput {
  privy_user_id: string;
  linked_accounts: ReadonlyArray<ReconciliationPrivyLinkedAccountInput>;
}

export interface ReconciliationPrivyWalletResourceInput {
  wallet_id?: string | null;
  address?: string | null;
  chain_type?: "ethereum" | "solana" | (string & {}) | null;
  /**
   * Optional explicit user association from a user-filtered source.
   * Do not infer this from owner_id.
   */
  privy_user_id?: string | null;
  /**
   * Owner/quorum metadata from Privy. This is not a user ID.
   */
  owner_id?: string | null;
  additional_signers?: ReadonlyArray<{
    signer_id: string;
    override_policy_ids?: ReadonlyArray<string>;
  }>;
  imported_at?: number | null;
  exported_at?: number | null;
  archived_at?: number | null;
}

export interface ReconciliationDatabaseWalletRowInput {
  id: string;
  address: string;
  chainId: number;
}

export interface ReconciliationDatabaseUserInput {
  id: string;
  privyId: string | null;
  wallets: ReadonlyArray<ReconciliationDatabaseWalletRowInput>;
}

export interface ReconciliationPrivyUsersPage {
  data: ReadonlyArray<ReconciliationPrivyUserInput>;
  next_cursor: string;
}

export interface ReconciliationPrivyWalletResourcesPage {
  data: ReadonlyArray<ReconciliationPrivyWalletResourceInput>;
  next_cursor: string;
}

export interface ReconciliationDatabaseUsersPage {
  data: ReadonlyArray<ReconciliationDatabaseUserInput>;
  next_cursor: string;
}

export interface ReconciliationListQuery {
  cursor?: string;
  limit?: number;
}

export interface ReconciliationPrivyWalletResourcesListQuery extends ReconciliationListQuery {
  user_id: string;
}

export type ReconciliationPrivyUsersListFn = (
  query: ReconciliationListQuery,
) => Promise<ReconciliationPrivyUsersPage>;

export type ReconciliationPrivyWalletResourcesListFn = (
  query: ReconciliationPrivyWalletResourcesListQuery,
) => Promise<ReconciliationPrivyWalletResourcesPage>;

export type ReconciliationDatabaseUsersListFn = (
  query: ReconciliationListQuery,
) => Promise<ReconciliationDatabaseUsersPage>;

export interface WalletSurfaceReconciliationCounts {
  linked_wallets: {
    by_kind: Record<WalletKindBucket, number>;
    by_origin: Record<WalletOriginBucket, number>;
    by_chain_namespace: Record<WalletChainNamespaceBucket, number>;
    by_authority: Record<WalletAuthorityBucket, number>;
    by_selection_status: Record<WalletSelectionStatusBucket, number>;
    by_reason_code: Record<WalletInventoryReasonCodeBucket, number>;
  };
  wallet_resources: {
    by_chain_namespace: Record<WalletChainNamespaceBucket, number>;
    by_assignment: Record<WalletResourceAssignmentBucket, number>;
    by_authority: Record<WalletResourceAuthorityBucket, number>;
    by_state: Record<WalletResourceStateBucket, number>;
  };
  database_wallet_rows: {
    by_chain_namespace: Record<WalletChainNamespaceBucket, number>;
  };
}

export interface WalletSurfaceReconciliationReport {
  schema_version: 1;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  complete: boolean;
  pagination_completed: boolean;
  error_code: WalletSurfaceReconciliationErrorCode | null;
  sources: {
    privy_users: {
      pages_scanned: number;
      users_scanned: number;
      linked_accounts_scanned: number;
      wallet_shaped_records_scanned: number;
      non_wallet_identity_accounts: number;
      malformed_wallet_shaped_records: number;
    };
    privy_wallet_resources: {
      pages_scanned: number;
      requests_scanned: number;
      users_scanned: number;
      users_completed: number;
      users_failed: number;
      users_incomplete: number;
      records_scanned: number;
      associated_users_scanned: number;
      user_assigned_records: number;
      service_or_unassigned_records: number;
      unique_records_scanned: number;
      duplicate_record_appearances: number;
      resources_returned_under_exactly_one_user_filter: number;
      resources_returned_under_multiple_user_filters: number;
      ownership_unresolved_records: number;
      active_records: number;
      archived_records: number;
      exported_records: number;
      imported_records: number;
    };
    database_users: {
      pages_scanned: number;
      users_scanned: number;
      wallet_rows_scanned: number;
    };
  };
  counts: WalletSurfaceReconciliationCounts;
  wallet_resource_records_invalid: number;
  database_wallet_rows_invalid: number;
  linked_users_by_candidate_count: {
    zero: number;
    one: number;
    multiple: number;
  };
  linked_users_by_inventory_outcome_code: Record<WalletInventoryOutcomeBucket, number>;
  linked_users_containing_invalid_unsupported_records: number;
  linked_users_containing_ambiguous_authority: number;
  users_requiring_reconciliation: number;
  users_with_duplicate_identities: number;
  users_with_conflicting_ownership: number;
  users_with_missing_provenance: number;
  matches: {
    linked_to_wallet_resource: number;
    linked_to_database_row: number;
    wallet_resource_to_database_row: number;
    full_three_surface_match: number;
    address_match_with_conflicting_user_ownership: number;
    same_user_address_match_with_missing_provenance: number;
    unmatched_linked_account_wallet: number;
    unmatched_user_assigned_wallet_resource: number;
    unmatched_service_or_unassigned_wallet_resource: number;
    unmatched_database_row: number;
    service_or_unassigned_wallet_resource: number;
  };
}

export interface WalletSurfaceReconciliationExecution {
  report: WalletSurfaceReconciliationReport;
  exit_code: number;
}

export interface WalletSurfaceReconciliationLiveConfig {
  live_read_only: boolean;
  database_read_only: boolean;
  privy_app_id: string | null;
  env: Readonly<Record<string, string | undefined>>;
}

export interface WalletSurfaceReconciliationCliOptions {
  argv: ReadonlyArray<string>;
  env: Readonly<Record<string, string | undefined>>;
  now?: () => Date;
  limit?: number;
  listPrivyUsers?: ReconciliationPrivyUsersListFn;
  listPrivyWalletResources?: ReconciliationPrivyWalletResourcesListFn;
  listDatabaseUsers?: ReconciliationDatabaseUsersListFn;
}

export interface WalletSurfaceReconciliationCliResult extends WalletSurfaceReconciliationExecution {
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
const WALLET_RESOURCE_ASSIGNMENT_BUCKETS = [
  "user",
  "service_or_unassigned",
  "unknown",
] as const;
const WALLET_RESOURCE_AUTHORITY_BUCKETS = [
  "single_owner",
  "delegated",
  "unknown",
] as const;
const WALLET_RESOURCE_STATE_BUCKETS = [
  "active",
  "archived",
  "exported",
  "imported",
  "unknown",
] as const;

const MAX_PAGE_LIMIT = 100;
const BASE_CHAIN_ID = 8453;

type ReconciliationPages = {
  privyUsers: AsyncIterable<ReconciliationPrivyUsersPage>;
  privyWalletResourcesForUser: (
    privyUserId: string,
  ) => AsyncIterable<ReconciliationPrivyWalletResourcesPage>;
  databaseUsers: AsyncIterable<ReconciliationDatabaseUsersPage>;
};

interface ReconciliationUserState {
  privyUserId: string;
  linkedWallets: ReturnType<typeof classifyPrivyLinkedWalletInventory>["records"];
  linkedIdentityKeys: Set<string>;
  linkedDuplicateIdentityKeys: Set<string>;
  walletResourceIdentityKeys: Set<string>;
  walletResourceDuplicateIdentityKeys: Set<string>;
  databaseIdentityKeys: Set<string>;
  databaseDuplicateIdentityKeys: Set<string>;
  walletResourceCount: number;
  databaseWalletRowCount: number;
  hasDuplicateIdentity: boolean;
  hasConflictingOwnership: boolean;
  hasMissingProvenance: boolean;
  requiresReconciliation: boolean;
}

interface ReconciliationWalletResourceState {
  walletIdentityKey: string;
  walletId: string | null;
  identityKey: string | null;
  privyUserIds: Set<string>;
  assignment: WalletResourceAssignmentBucket;
  authority: WalletResourceAuthorityBucket;
  state: WalletResourceStateBucket;
  appearanceCount: number;
  hasConflictingOwnership: boolean;
  hasConflictingPayload: boolean;
}

interface ReconciliationDatabaseWalletState {
  rowId: string;
  identityKey: string | null;
  chainNamespace: WalletChainNamespaceBucket;
  isDuplicateIdentity: boolean;
}

interface ReconciliationAccumulatorState {
  startedAt: Date;
  report: WalletSurfaceReconciliationReport;
  users: Map<string, ReconciliationUserState>;
  walletResourceQueryUserIds: string[];
  walletResourceQueryUserIdSet: Set<string>;
  walletResources: Map<string, ReconciliationWalletResourceState>;
  databaseUsers: Map<string, { privyId: string | null; rowIds: Set<string> }>;
  databaseWalletRows: Map<string, ReconciliationDatabaseWalletState>;
  linkedIdentityToUsers: Map<string, Set<string>>;
  resourceIdentityToUsers: Map<string, Set<string>>;
  databaseIdentityToUsers: Map<string, Set<string>>;
  conflictingOwnershipKeys: Set<string>;
  conflictingOwnershipUsers: Set<string>;
  walletResourceScanStatusByUser: Map<string, "pending" | "complete" | "failed">;
}

class WalletSurfaceReconciliationError extends Error {
  code: WalletSurfaceReconciliationErrorCode;

  constructor(code: WalletSurfaceReconciliationErrorCode) {
    super(code);
    this.code = code;
  }
}

function createBucketRecord<const Keys extends ReadonlyArray<string>>(keys: Keys) {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<Keys[number], number>;
}

function bucketFromSet<T extends string>(value: string, allowed: readonly T[]): BucketKey<T> {
  return (allowed as readonly string[]).includes(value) ? (value as T) : "unknown";
}

function normalizeOptionalText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizePrivyUserId(value: string | null | undefined) {
  return normalizeOptionalText(value);
}

function normalizeEvmAddress(address: string) {
  if (!isAddress(address)) {
    return null;
  }

  return getAddress(address);
}

function normalizeSolanaAddress(address: string) {
  const trimmed = address.trim();
  if (!trimmed || !isSolanaAddress(trimmed)) {
    return null;
  }

  return trimmed;
}

function normalizeWalletResourceChainNamespace(
  chainType: string | null | undefined,
): WalletChainNamespaceBucket {
  if (chainType === "ethereum") {
    return "ethereum";
  }

  if (chainType === "solana") {
    return "solana";
  }

  if (chainType == null) {
    return "unknown";
  }

  return "unsupported";
}

function normalizeDatabaseChainNamespace(chainId: number) {
  if (chainId === BASE_CHAIN_ID) {
    return "ethereum";
  }

  if (Number.isInteger(chainId) && chainId > 0) {
    return "unsupported";
  }

  return "unknown";
}

function routeLinkedAccounts(accounts: ReadonlyArray<ReconciliationPrivyLinkedAccountInput>) {
  const walletAccounts: PrivyLinkedWalletAccountInput[] = [];
  let nonWalletIdentityAccounts = 0;
  let malformedWalletShapedRecords = 0;

  for (const account of accounts) {
    if (account.type === "wallet" || account.type === "smart_wallet") {
      walletAccounts.push(account as PrivyLinkedWalletAccountInput);
      continue;
    }

    nonWalletIdentityAccounts += 1;
  }

  return {
    walletAccounts,
    nonWalletIdentityAccounts,
    malformedWalletShapedRecords,
  };
}

function normalizeWalletResourceState(
  resource: ReconciliationPrivyWalletResourceInput,
): WalletResourceStateBucket {
  if (resource.archived_at != null) {
    return "archived";
  }

  if (resource.exported_at != null) {
    return "exported";
  }

  if (resource.imported_at != null) {
    return "imported";
  }

  if (normalizeOptionalText(resource.address)) {
    return "active";
  }

  return "unknown";
}

function classifyWalletResourceAuthority(
  resource: ReconciliationPrivyWalletResourceInput,
): WalletResourceAuthorityBucket {
  if (Array.isArray(resource.additional_signers) && resource.additional_signers.length > 0) {
    return "delegated";
  }

  if (normalizeOptionalText(resource.owner_id)) {
    return "single_owner";
  }

  return "unknown";
}

function classifyWalletResourceAssignment(
  resource: ReconciliationPrivyWalletResourceInput,
): WalletResourceAssignmentBucket {
  // Only an explicit user association can produce a user assignment.
  // owner_id is owner/quorum metadata and remains non-user ownership evidence.
  if (normalizeOptionalText(resource.privy_user_id)) {
    return "user";
  }

  if (
    normalizeOptionalText(resource.wallet_id) ||
    normalizeOptionalText(resource.address) ||
    normalizeOptionalText(resource.owner_id)
  ) {
    return "service_or_unassigned";
  }

  return "unknown";
}

function createEmptyWalletSurfaceReconciliationReport(
  startedAt: Date,
): WalletSurfaceReconciliationReport {
  return {
    schema_version: 1,
    started_at: startedAt.toISOString(),
    completed_at: null,
    duration_ms: null,
    complete: false,
    pagination_completed: false,
    error_code: null,
    sources: {
      privy_users: {
        pages_scanned: 0,
        users_scanned: 0,
        linked_accounts_scanned: 0,
        wallet_shaped_records_scanned: 0,
        non_wallet_identity_accounts: 0,
        malformed_wallet_shaped_records: 0,
      },
      privy_wallet_resources: {
        pages_scanned: 0,
        requests_scanned: 0,
        users_scanned: 0,
        users_completed: 0,
        users_failed: 0,
        users_incomplete: 0,
        records_scanned: 0,
        associated_users_scanned: 0,
        user_assigned_records: 0,
        service_or_unassigned_records: 0,
        unique_records_scanned: 0,
        duplicate_record_appearances: 0,
        resources_returned_under_exactly_one_user_filter: 0,
        resources_returned_under_multiple_user_filters: 0,
        ownership_unresolved_records: 0,
        active_records: 0,
        archived_records: 0,
        exported_records: 0,
        imported_records: 0,
      },
      database_users: {
        pages_scanned: 0,
        users_scanned: 0,
        wallet_rows_scanned: 0,
      },
    },
    counts: {
      linked_wallets: {
        by_kind: createBucketRecord(WALLET_KIND_BUCKETS),
        by_origin: createBucketRecord(WALLET_ORIGIN_BUCKETS),
        by_chain_namespace: createBucketRecord(WALLET_CHAIN_BUCKETS),
        by_authority: createBucketRecord(WALLET_AUTHORITY_BUCKETS),
        by_selection_status: createBucketRecord(WALLET_SELECTION_BUCKETS),
        by_reason_code: createBucketRecord(WALLET_REASON_BUCKETS),
      },
      wallet_resources: {
        by_chain_namespace: createBucketRecord(WALLET_CHAIN_BUCKETS),
        by_assignment: createBucketRecord(WALLET_RESOURCE_ASSIGNMENT_BUCKETS),
        by_authority: createBucketRecord(WALLET_RESOURCE_AUTHORITY_BUCKETS),
        by_state: createBucketRecord(WALLET_RESOURCE_STATE_BUCKETS),
      },
      database_wallet_rows: {
        by_chain_namespace: createBucketRecord(WALLET_CHAIN_BUCKETS),
      },
    },
    wallet_resource_records_invalid: 0,
    database_wallet_rows_invalid: 0,
    linked_users_by_candidate_count: {
      zero: 0,
      one: 0,
      multiple: 0,
    },
    linked_users_by_inventory_outcome_code: createBucketRecord(WALLET_OUTCOME_BUCKETS),
    linked_users_containing_invalid_unsupported_records: 0,
    linked_users_containing_ambiguous_authority: 0,
    users_requiring_reconciliation: 0,
    users_with_duplicate_identities: 0,
    users_with_conflicting_ownership: 0,
    users_with_missing_provenance: 0,
    matches: {
      linked_to_wallet_resource: 0,
      linked_to_database_row: 0,
      wallet_resource_to_database_row: 0,
      full_three_surface_match: 0,
      address_match_with_conflicting_user_ownership: 0,
      same_user_address_match_with_missing_provenance: 0,
      unmatched_linked_account_wallet: 0,
      unmatched_user_assigned_wallet_resource: 0,
      unmatched_service_or_unassigned_wallet_resource: 0,
      unmatched_database_row: 0,
      service_or_unassigned_wallet_resource: 0,
    },
  };
}

function countBucket(counts: Record<string, number>, key: string) {
  counts[key] = (counts[key] ?? 0) + 1;
}

function bucketWalletKind(value: string): WalletKindBucket {
  return bucketFromSet(value, WALLET_KIND_BUCKETS);
}

function bucketWalletOrigin(value: string): WalletOriginBucket {
  return bucketFromSet(value, WALLET_ORIGIN_BUCKETS);
}

function bucketWalletChainNamespace(value: string): WalletChainNamespaceBucket {
  return bucketFromSet(value, WALLET_CHAIN_BUCKETS);
}

function bucketWalletAuthority(value: string): WalletAuthorityBucket {
  return bucketFromSet(value, WALLET_AUTHORITY_BUCKETS);
}

function bucketWalletSelectionStatus(value: string): WalletSelectionStatusBucket {
  return bucketFromSet(value, WALLET_SELECTION_BUCKETS);
}

function bucketWalletInventoryOutcome(value: string): WalletInventoryOutcomeBucket {
  return bucketFromSet(value, WALLET_OUTCOME_BUCKETS);
}

function bucketWalletInventoryReasonCode(value: string): WalletInventoryReasonCodeBucket {
  return bucketFromSet(value, WALLET_REASON_BUCKETS);
}

function bucketWalletResourceAssignment(value: string): WalletResourceAssignmentBucket {
  return bucketFromSet(value, WALLET_RESOURCE_ASSIGNMENT_BUCKETS);
}

function bucketWalletResourceAuthority(value: string): WalletResourceAuthorityBucket {
  return bucketFromSet(value, WALLET_RESOURCE_AUTHORITY_BUCKETS);
}

function bucketWalletResourceState(value: string): WalletResourceStateBucket {
  return bucketFromSet(value, WALLET_RESOURCE_STATE_BUCKETS);
}

function identityKeyForWallet(
  chainNamespace: WalletChainNamespaceBucket,
  normalizedAddress: string | null,
) {
  if (!normalizedAddress || chainNamespace === "unknown" || chainNamespace === "unsupported") {
    return null;
  }

  return `${chainNamespace}:${normalizedAddress}`;
}

function normalizeWalletResourceAddress(
  resource: ReconciliationPrivyWalletResourceInput,
) {
  const address = normalizeOptionalText(resource.address);
  if (!address) {
    return null;
  }

  const chainNamespace = normalizeWalletResourceChainNamespace(resource.chain_type);
  if (chainNamespace === "ethereum") {
    return normalizeEvmAddress(address);
  }

  return null;
}

function normalizeDatabaseWalletAddress(
  walletRow: ReconciliationDatabaseWalletRowInput,
) {
  const address = normalizeOptionalText(walletRow.address);
  if (!address) {
    return null;
  }

  const chainNamespace = normalizeDatabaseChainNamespace(walletRow.chainId);
  if (chainNamespace === "ethereum") {
    return normalizeEvmAddress(address);
  }

  return null;
}

function classifyDatabaseWalletRow(
  walletRow: ReconciliationDatabaseWalletRowInput,
) {
  const chainNamespace = bucketWalletChainNamespace(
    normalizeDatabaseChainNamespace(walletRow.chainId),
  );
  const normalizedAddress = normalizeDatabaseWalletAddress(walletRow);
  const identityKey = identityKeyForWallet(chainNamespace, normalizedAddress);

  return {
    chainNamespace,
    normalizedAddress,
    identityKey,
    isInvalid: normalizedAddress == null,
  };
}

function createUserState(privyUserId: string): ReconciliationUserState {
  return {
    privyUserId,
    linkedWallets: [],
    linkedIdentityKeys: new Set(),
    linkedDuplicateIdentityKeys: new Set(),
    walletResourceIdentityKeys: new Set(),
    walletResourceDuplicateIdentityKeys: new Set(),
    databaseIdentityKeys: new Set(),
    databaseDuplicateIdentityKeys: new Set(),
    walletResourceCount: 0,
    databaseWalletRowCount: 0,
    hasDuplicateIdentity: false,
    hasConflictingOwnership: false,
    hasMissingProvenance: false,
    requiresReconciliation: false,
  };
}

function getUserState(
  state: ReconciliationAccumulatorState,
  privyUserId: string,
) {
  const existing = state.users.get(privyUserId);
  if (existing) {
    return existing;
  }

  const created = createUserState(privyUserId);
  state.users.set(privyUserId, created);
  return created;
}

function incrementIdentityUsers(
  map: Map<string, Set<string>>,
  identityKey: string,
  privyUserId: string,
) {
  const users = map.get(identityKey) ?? new Set<string>();
  users.add(privyUserId);
  map.set(identityKey, users);
}

function recordOwnershipConflict(
  _state: ReconciliationAccumulatorState,
  _identityKey: string,
) {
  void _state;
  void _identityKey;
}

function applyOwnershipConflicts(state: ReconciliationAccumulatorState) {
  state.conflictingOwnershipUsers.clear();
  let conflictMatches = 0;

  const identityKeys = new Set<string>();
  for (const identityKey of state.linkedIdentityToUsers.keys()) identityKeys.add(identityKey);
  for (const identityKey of state.resourceIdentityToUsers.keys()) identityKeys.add(identityKey);
  for (const identityKey of state.databaseIdentityToUsers.keys()) identityKeys.add(identityKey);

  for (const identityKey of identityKeys) {
    const owners = new Set<string>();
    state.linkedIdentityToUsers.get(identityKey)?.forEach((owner) => owners.add(owner));
    state.resourceIdentityToUsers.get(identityKey)?.forEach((owner) => owners.add(owner));
    state.databaseIdentityToUsers.get(identityKey)?.forEach((owner) => owners.add(owner));

    if (owners.size < 2) {
      continue;
    }

    conflictMatches += 1;
    owners.forEach((owner) => {
      state.conflictingOwnershipUsers.add(owner);
      const user = getUserState(state, owner);
      user.hasConflictingOwnership = true;
      user.requiresReconciliation = true;
    });
  }

  state.report.matches.address_match_with_conflicting_user_ownership = conflictMatches;
}

function ingestLinkedWalletRecord(
  state: ReconciliationAccumulatorState,
  privyUserId: string,
  record: ReturnType<typeof classifyPrivyLinkedWalletInventory>["records"][number],
) {
  const user = getUserState(state, privyUserId);

  const identityKey = identityKeyForWallet(record.chainNamespace, record.normalizedAddress);
  if (identityKey) {
    if (user.linkedIdentityKeys.has(identityKey)) {
      user.linkedDuplicateIdentityKeys.add(identityKey);
      user.hasDuplicateIdentity = true;
      user.requiresReconciliation = true;
    }
    user.linkedIdentityKeys.add(identityKey);
    incrementIdentityUsers(state.linkedIdentityToUsers, identityKey, privyUserId);
    recordOwnershipConflict(state, identityKey);
  }
}

function ingestPrivyUserPage(
  state: ReconciliationAccumulatorState,
  page: ReconciliationPrivyUsersPage,
) {
  state.report.sources.privy_users.pages_scanned += 1;

  if (!page || !Array.isArray(page.data) || typeof page.next_cursor !== "string") {
    throw new WalletSurfaceReconciliationError("invalid_page_shape");
  }

  for (const user of page.data) {
    state.report.sources.privy_users.users_scanned += 1;

    const privyUserId = normalizePrivyUserId(user.privy_user_id);
    if (!privyUserId) {
      throw new WalletSurfaceReconciliationError("invalid_page_shape");
    }

    if (!state.walletResourceQueryUserIdSet.has(privyUserId)) {
      state.walletResourceQueryUserIdSet.add(privyUserId);
      state.walletResourceQueryUserIds.push(privyUserId);
    }

    state.walletResourceScanStatusByUser.set(privyUserId, "pending");
    const routed = routeLinkedAccounts(user.linked_accounts ?? []);
    state.report.sources.privy_users.linked_accounts_scanned += user.linked_accounts?.length ?? 0;
    state.report.sources.privy_users.wallet_shaped_records_scanned += routed.walletAccounts.length;
    state.report.sources.privy_users.non_wallet_identity_accounts +=
      routed.nonWalletIdentityAccounts;
    state.report.sources.privy_users.malformed_wallet_shaped_records +=
      routed.malformedWalletShapedRecords;

    const classification = classifyPrivyLinkedWalletInventory(routed.walletAccounts);
    let hasInvalidLinkedRecord = false;

    switch (classification.summary.candidateCount) {
      case 0:
        state.report.linked_users_by_candidate_count.zero += 1;
        break;
      case 1:
        state.report.linked_users_by_candidate_count.one += 1;
        break;
      default:
        state.report.linked_users_by_candidate_count.multiple += 1;
        break;
    }

    for (const record of classification.records) {
      countBucket(
        state.report.counts.linked_wallets.by_kind,
        bucketWalletKind(record.kind),
      );
      countBucket(
        state.report.counts.linked_wallets.by_origin,
        bucketWalletOrigin(record.origin),
      );
      countBucket(
        state.report.counts.linked_wallets.by_chain_namespace,
        bucketWalletChainNamespace(record.chainNamespace),
      );
      countBucket(
        state.report.counts.linked_wallets.by_authority,
        bucketWalletAuthority(record.authority),
      );
      countBucket(
        state.report.counts.linked_wallets.by_selection_status,
        bucketWalletSelectionStatus(record.selectionStatus),
      );

      for (const reasonCode of record.reasonCodes) {
        countBucket(
          state.report.counts.linked_wallets.by_reason_code,
          bucketWalletInventoryReasonCode(reasonCode),
        );
      }

      if (record.normalizationStatus === "invalid") {
        hasInvalidLinkedRecord = true;
      }
    }

    for (const outcomeCode of classification.summary.outcomeCodes) {
      countBucket(
        state.report.linked_users_by_inventory_outcome_code,
        bucketWalletInventoryOutcome(outcomeCode),
      );
    }

    if (classification.summary.outcomeCodes.includes("ambiguous_authority")) {
      state.report.linked_users_containing_ambiguous_authority += 1;
    }

    if (hasInvalidLinkedRecord) {
      state.report.linked_users_containing_invalid_unsupported_records += 1;
    }

    const userState = getUserState(state, privyUserId);
    userState.linkedWallets = classification.records;
    userState.hasDuplicateIdentity =
      classification.summary.status === "duplicates_reconciliation_required";
    userState.requiresReconciliation =
      userState.hasDuplicateIdentity ||
      classification.summary.status === "multiple_candidates" ||
      classification.summary.status === "ambiguous_authority";

    for (const record of classification.records) {
      ingestLinkedWalletRecord(state, privyUserId, record);
    }
  }
}

function ingestPrivyWalletResourcePage(
  state: ReconciliationAccumulatorState,
  page: ReconciliationPrivyWalletResourcesPage,
  privyUserId: string,
) {
  state.report.sources.privy_wallet_resources.pages_scanned += 1;
  state.report.sources.privy_wallet_resources.requests_scanned += 1;

  if (!page || !Array.isArray(page.data) || typeof page.next_cursor !== "string") {
    throw new WalletSurfaceReconciliationError("invalid_page_shape");
  }

  for (const resource of page.data) {
    state.report.sources.privy_wallet_resources.records_scanned += 1;

    const walletId = normalizeOptionalText(resource.wallet_id);
    const resourcePrivyUserId = normalizeOptionalText(resource.privy_user_id) ?? privyUserId;
    const normalizedAddress = normalizeWalletResourceAddress(resource);
    const chainNamespace = normalizeWalletResourceChainNamespace(resource.chain_type);
    const identityKey = identityKeyForWallet(chainNamespace, normalizedAddress);
    const assignment = bucketWalletResourceAssignment(classifyWalletResourceAssignment(resource));
    const authority = bucketWalletResourceAuthority(classifyWalletResourceAuthority(resource));
    const stateBucket = bucketWalletResourceState(normalizeWalletResourceState(resource));
    const resourceIdentityKey =
      walletId ??
      (identityKey ?
        `${resourcePrivyUserId}:${identityKey}`
      : `${resourcePrivyUserId}:unresolved:${state.report.sources.privy_wallet_resources.records_scanned}`);

    countBucket(state.report.counts.wallet_resources.by_chain_namespace, chainNamespace);
    countBucket(state.report.counts.wallet_resources.by_assignment, assignment);
    countBucket(state.report.counts.wallet_resources.by_authority, authority);
    countBucket(state.report.counts.wallet_resources.by_state, stateBucket);

    state.report.sources.privy_wallet_resources.associated_users_scanned += 1;
    state.report.sources.privy_wallet_resources.user_assigned_records += 1;

    if (assignment === "service_or_unassigned") {
      state.report.sources.privy_wallet_resources.service_or_unassigned_records += 1;
      state.report.matches.service_or_unassigned_wallet_resource += 1;
      state.report.matches.unmatched_service_or_unassigned_wallet_resource += 1;
    }

    if (stateBucket === "active") state.report.sources.privy_wallet_resources.active_records += 1;
    if (stateBucket === "archived")
      state.report.sources.privy_wallet_resources.archived_records += 1;
    if (stateBucket === "exported")
      state.report.sources.privy_wallet_resources.exported_records += 1;
    if (stateBucket === "imported")
      state.report.sources.privy_wallet_resources.imported_records += 1;

    const userState = getUserState(state, resourcePrivyUserId);
    userState.walletResourceCount += 1;
    if (!identityKey || !walletId) {
      userState.hasMissingProvenance = true;
      userState.requiresReconciliation = true;
      state.report.wallet_resource_records_invalid += 1;
      state.report.sources.privy_wallet_resources.ownership_unresolved_records += 1;
    }

    if (identityKey && userState.walletResourceIdentityKeys.has(identityKey)) {
      userState.walletResourceDuplicateIdentityKeys.add(identityKey);
      userState.hasDuplicateIdentity = true;
      userState.requiresReconciliation = true;
    }
    if (identityKey) {
      userState.walletResourceIdentityKeys.add(identityKey);
      incrementIdentityUsers(state.resourceIdentityToUsers, identityKey, resourcePrivyUserId);
      recordOwnershipConflict(state, identityKey);
    }

    const existing = state.walletResources.get(resourceIdentityKey);
    if (existing) {
      existing.appearanceCount += 1;
      if (existing.walletId !== walletId || existing.identityKey !== identityKey) {
        existing.hasConflictingPayload = true;
      }
      if (!existing.privyUserIds.has(resourcePrivyUserId)) {
        existing.privyUserIds.add(resourcePrivyUserId);
        existing.hasConflictingOwnership = existing.privyUserIds.size > 1;
      }
      state.report.sources.privy_wallet_resources.duplicate_record_appearances += 1;
    } else {
      state.report.sources.privy_wallet_resources.unique_records_scanned += 1;
      state.walletResources.set(resourceIdentityKey, {
        walletIdentityKey: resourceIdentityKey,
        walletId,
        identityKey,
        privyUserIds: new Set([resourcePrivyUserId]),
        assignment,
        authority,
        state: stateBucket,
        appearanceCount: 1,
        hasConflictingOwnership: false,
        hasConflictingPayload: false,
      });
    }
  }
}

function ingestDatabaseUserPage(
  state: ReconciliationAccumulatorState,
  page: ReconciliationDatabaseUsersPage,
) {
  state.report.sources.database_users.pages_scanned += 1;

  if (!page || !Array.isArray(page.data) || typeof page.next_cursor !== "string") {
    throw new WalletSurfaceReconciliationError("invalid_page_shape");
  }

  for (const user of page.data) {
    state.report.sources.database_users.users_scanned += 1;
    const privyId = normalizeOptionalText(user.privyId);
    const userState = privyId ? getUserState(state, privyId) : null;

    for (const walletRow of user.wallets ?? []) {
      state.report.sources.database_users.wallet_rows_scanned += 1;

      const classified = classifyDatabaseWalletRow(walletRow);
      countBucket(
        state.report.counts.database_wallet_rows.by_chain_namespace,
        classified.chainNamespace,
      );

      if (classified.isInvalid) {
        state.report.database_wallet_rows_invalid += 1;
      }

      if (!classified.identityKey || !privyId) {
        if (userState) {
          userState.requiresReconciliation = true;
        }
        continue;
      }

      userState!.databaseWalletRowCount += 1;
      if (userState!.databaseIdentityKeys.has(classified.identityKey)) {
        userState!.databaseDuplicateIdentityKeys.add(classified.identityKey);
        userState!.hasDuplicateIdentity = true;
        userState!.requiresReconciliation = true;
      }
      userState!.databaseIdentityKeys.add(classified.identityKey);
      incrementIdentityUsers(state.databaseIdentityToUsers, classified.identityKey, privyId);
      recordOwnershipConflict(state, classified.identityKey);
      state.databaseWalletRows.set(walletRow.id, {
        rowId: walletRow.id,
        identityKey: classified.identityKey,
        chainNamespace: classified.chainNamespace,
        isDuplicateIdentity: false,
      });
    }
  }
}

function countMatchesForUser(state: ReconciliationAccumulatorState, user: ReconciliationUserState) {
  const linked = user.linkedIdentityKeys;
  const resource = user.walletResourceIdentityKeys;
  const database = user.databaseIdentityKeys;
  const linkedAcrossAllUsers = state.linkedIdentityToUsers;
  const resourceAcrossAllUsers = state.resourceIdentityToUsers;
  const databaseAcrossAllUsers = state.databaseIdentityToUsers;

  const linkedResource = [...linked].filter((identity) => resource.has(identity));
  const linkedDatabase = [...linked].filter((identity) => database.has(identity));
  const resourceDatabase = [...resource].filter((identity) => database.has(identity));
  const triple = linkedResource.filter((identity) => database.has(identity));

  state.report.matches.linked_to_wallet_resource += linkedResource.length;
  state.report.matches.linked_to_database_row += linkedDatabase.length;
  state.report.matches.wallet_resource_to_database_row += resourceDatabase.length;
  state.report.matches.full_three_surface_match += triple.length;

  const pairwiseOnly = new Set<string>();
  for (const identity of linkedResource) pairwiseOnly.add(identity);
  for (const identity of linkedDatabase) pairwiseOnly.add(identity);
  for (const identity of resourceDatabase) pairwiseOnly.add(identity);

  for (const identity of triple) {
    pairwiseOnly.delete(identity);
  }

  if (pairwiseOnly.size > 0) {
    user.hasMissingProvenance = true;
    user.requiresReconciliation = true;
    state.report.matches.same_user_address_match_with_missing_provenance += pairwiseOnly.size;
  }

  const unmatchedLinked = [...linked].filter(
    (identity) =>
      !resource.has(identity) &&
      !database.has(identity) &&
      !resourceAcrossAllUsers.has(identity) &&
      !databaseAcrossAllUsers.has(identity),
  );
  const unmatchedResource = [...resource].filter(
    (identity) =>
      !linked.has(identity) &&
      !database.has(identity) &&
      !linkedAcrossAllUsers.has(identity) &&
      !databaseAcrossAllUsers.has(identity),
  );
  const unmatchedDatabase = [...database].filter(
    (identity) =>
      !linked.has(identity) &&
      !resource.has(identity) &&
      !linkedAcrossAllUsers.has(identity) &&
      !resourceAcrossAllUsers.has(identity),
  );

  state.report.matches.unmatched_linked_account_wallet += unmatchedLinked.length;
  state.report.matches.unmatched_user_assigned_wallet_resource += unmatchedResource.length;
  state.report.matches.unmatched_database_row += unmatchedDatabase.length;

  if (unmatchedLinked.length > 0 || unmatchedResource.length > 0 || unmatchedDatabase.length > 0) {
    user.requiresReconciliation = true;
  }

  // Cross-user conflicts are recorded at ingestion time.
}

function applyWalletResourceObservations(state: ReconciliationAccumulatorState) {
  const queriedUserCount = state.walletResourceQueryUserIds.length;
  state.report.sources.privy_wallet_resources.users_scanned = queriedUserCount;

  let uniqueSingleUserResources = 0;
  let multiUserResources = 0;
  let duplicateAppearances = 0;
  let ownershipUnresolved = 0;

  for (const user of state.users.values()) {
    user.walletResourceIdentityKeys.clear();
    user.walletResourceDuplicateIdentityKeys.clear();
    user.walletResourceCount = 0;
  }

  for (const resource of state.walletResources.values()) {
    const userIds = [...resource.privyUserIds];
    const isSingleUser = userIds.length === 1;

    if (resource.appearanceCount > 1) {
      duplicateAppearances += resource.appearanceCount - 1;
    }

    if (!resource.walletId || !resource.identityKey) {
      ownershipUnresolved += 1;
    }

    if (isSingleUser) {
      uniqueSingleUserResources += 1;
      const user = getUserState(state, userIds[0]!);
      if (resource.identityKey) {
        if (user.walletResourceIdentityKeys.has(resource.identityKey)) {
          user.walletResourceDuplicateIdentityKeys.add(resource.identityKey);
          user.hasDuplicateIdentity = true;
          user.requiresReconciliation = true;
        }
        user.walletResourceIdentityKeys.add(resource.identityKey);
      }
      if (resource.appearanceCount > 1 || resource.hasConflictingPayload) {
        user.hasDuplicateIdentity = true;
        user.requiresReconciliation = true;
      }
      if (!resource.identityKey || !resource.walletId) {
        user.hasMissingProvenance = true;
        user.requiresReconciliation = true;
      }
      continue;
    }

    multiUserResources += 1;
    for (const userId of userIds) {
      state.conflictingOwnershipUsers.add(userId);
      const user = getUserState(state, userId);
      user.hasConflictingOwnership = true;
      user.requiresReconciliation = true;
    }
  }

  state.report.sources.privy_wallet_resources.unique_records_scanned = uniqueSingleUserResources + multiUserResources;
  state.report.sources.privy_wallet_resources.resources_returned_under_exactly_one_user_filter =
    uniqueSingleUserResources;
  state.report.sources.privy_wallet_resources.resources_returned_under_multiple_user_filters =
    multiUserResources;
  state.report.sources.privy_wallet_resources.duplicate_record_appearances = duplicateAppearances;
  state.report.sources.privy_wallet_resources.ownership_unresolved_records = ownershipUnresolved;

  const completedUsers = state.walletResourceQueryUserIds.filter(
    (privyUserId) => state.walletResourceScanStatusByUser.get(privyUserId) === "complete",
  ).length;
  const failedUsers = state.walletResourceQueryUserIds.filter(
    (privyUserId) => state.walletResourceScanStatusByUser.get(privyUserId) === "failed",
  ).length;
  const incompleteUsers = queriedUserCount - completedUsers - failedUsers;

  state.report.sources.privy_wallet_resources.users_completed = completedUsers;
  state.report.sources.privy_wallet_resources.users_failed = failedUsers;
  state.report.sources.privy_wallet_resources.users_incomplete = incompleteUsers;

  state.report.users_with_conflicting_ownership = state.conflictingOwnershipUsers.size;
}

export function createWalletSurfaceReconciliationAccumulator(startedAt: Date) {
  const state: ReconciliationAccumulatorState = {
    startedAt,
    report: createEmptyWalletSurfaceReconciliationReport(startedAt),
    users: new Map(),
    walletResourceQueryUserIds: [],
    walletResourceQueryUserIdSet: new Set(),
    walletResources: new Map(),
    databaseUsers: new Map(),
    databaseWalletRows: new Map(),
    linkedIdentityToUsers: new Map(),
    resourceIdentityToUsers: new Map(),
    databaseIdentityToUsers: new Map(),
    conflictingOwnershipKeys: new Set(),
    conflictingOwnershipUsers: new Set(),
    walletResourceScanStatusByUser: new Map(),
  };

  return {
    ingestPrivyUsersPage(page: ReconciliationPrivyUsersPage) {
      ingestPrivyUserPage(state, page);
    },
    ingestPrivyWalletResourcesPage(page: ReconciliationPrivyWalletResourcesPage, privyUserId: string) {
      ingestPrivyWalletResourcePage(state, page, privyUserId);
    },
    ingestDatabaseUsersPage(page: ReconciliationDatabaseUsersPage) {
      ingestDatabaseUserPage(state, page);
    },
    getWalletResourceQueryUserIds() {
      return [...state.walletResourceQueryUserIds];
    },
    markWalletResourceScanComplete(privyUserId: string) {
      state.walletResourceScanStatusByUser.set(privyUserId, "complete");
    },
    markWalletResourceScanFailed(privyUserId: string) {
      state.walletResourceScanStatusByUser.set(privyUserId, "failed");
    },
    finalize(args: {
      complete: boolean;
      pagination_completed: boolean;
      error_code: WalletSurfaceReconciliationErrorCode | null;
      now: () => Date;
    }): WalletSurfaceReconciliationReport {
      applyOwnershipConflicts(state);
      applyWalletResourceObservations(state);
      state.report.users_with_conflicting_ownership = state.conflictingOwnershipUsers.size;

      for (const user of state.users.values()) {
        countMatchesForUser(state, user);
      }

      state.report.users_with_duplicate_identities = [...state.users.values()].filter(
        (user) =>
          user.hasDuplicateIdentity ||
          user.linkedDuplicateIdentityKeys.size > 0 ||
          user.walletResourceDuplicateIdentityKeys.size > 0 ||
          user.databaseDuplicateIdentityKeys.size > 0,
      ).length;
      state.report.users_with_missing_provenance = [...state.users.values()].filter(
        (user) => user.hasMissingProvenance,
      ).length;
      state.report.users_requiring_reconciliation = [...state.users.values()].filter(
        (user) => user.requiresReconciliation,
      ).length;

      const walletResourceScansComplete =
        state.walletResourceQueryUserIds.length === 0 ||
        (state.report.sources.privy_wallet_resources.users_completed ===
          state.walletResourceQueryUserIds.length &&
          state.report.sources.privy_wallet_resources.users_failed === 0 &&
          state.report.sources.privy_wallet_resources.users_incomplete === 0);

      state.report.complete = args.complete && walletResourceScansComplete;
      state.report.pagination_completed = args.pagination_completed && walletResourceScansComplete;
      state.report.error_code = args.error_code;
      state.report.completed_at = args.now().toISOString();
      state.report.duration_ms =
        Date.parse(state.report.completed_at) - Date.parse(state.report.started_at);

      return state.report;
    },
  };
}

function classifyDatabaseError(error: unknown): WalletSurfaceReconciliationErrorCode | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const className = (error as { constructor?: { name?: string } }).constructor?.name ?? null;
  const code = (error as { code?: unknown }).code;

  if (className === "PrismaClientInitializationError") {
    return "database_connection_failed";
  }

  if (className === "PrismaClientRustPanicError") {
    return "database_upstream_failed";
  }

  if (className === "PrismaClientValidationError") {
    return "database_invalid_request";
  }

  if (className === "PrismaClientKnownRequestError" && typeof code === "string") {
    switch (code) {
      case "P1000":
        return "database_authentication_failed";
      case "P1001":
      case "P1017":
        return "database_connection_failed";
      case "P1002":
      case "P1008":
        return "database_connection_timeout";
      case "P2000":
      case "P2001":
      case "P2002":
      case "P2003":
      case "P2004":
      case "P2005":
      case "P2006":
      case "P2007":
      case "P2008":
      case "P2009":
      case "P2010":
      case "P2011":
      case "P2012":
      case "P2013":
      case "P2014":
      case "P2015":
      case "P2016":
      case "P2018":
      case "P2021":
      case "P2022":
      case "P2024":
      case "P2025":
      case "P2026":
      case "P2027":
      case "P2030":
        return "database_invalid_request";
      default:
        return "database_unknown_failure";
    }
  }

  if (className === "PrismaClientUnknownRequestError") {
    return "database_unknown_failure";
  }

  return null;
}

export function createCursorPageSource<Page, Item>(
  listPage: (query: ReconciliationListQuery) => Promise<Page>,
  getPageData: (page: Page) => ReadonlyArray<Item>,
  getNextCursor: (page: Page) => string,
  classifyError: (error: unknown) => WalletSurfaceReconciliationErrorCode | null,
  limit?: number,
): AsyncGenerator<Page> {
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  let pageCount = 0;

  return (async function* () {
    while (true) {
      if (cursor && seenCursors.has(cursor)) {
        throw new WalletSurfaceReconciliationError("pagination_loop_detected");
      }

      if (cursor) {
        seenCursors.add(cursor);
      }

      let page: Page;
      try {
        page = await listPage({ cursor, limit });
      } catch (error) {
        throw new WalletSurfaceReconciliationError(
          classifyError(error) ?? "pagination_failed",
        );
      }

      const data = getPageData(page);
      const nextCursor = getNextCursor(page);
      if (!Array.isArray(data) || typeof nextCursor !== "string") {
        throw new WalletSurfaceReconciliationError("invalid_page_shape");
      }

      if (data.length === 0 && nextCursor) {
        throw new WalletSurfaceReconciliationError("invalid_page_shape");
      }

      pageCount += 1;
      yield page;

      if (!nextCursor) {
        return;
      }

      cursor = nextCursor;

      if (pageCount > 10_000) {
        throw new WalletSurfaceReconciliationError("pagination_loop_detected");
      }
    }
  })();
}

export function createPrivyUsersPageSource(
  listUsers: ReconciliationPrivyUsersListFn,
  options: { limit?: number } = {},
): AsyncGenerator<ReconciliationPrivyUsersPage> {
  return createCursorPageSource(
    listUsers,
    (page) => page.data,
    (page) => page.next_cursor,
    (error) => classifyPrivySdkError(error) ?? "pagination_failed",
    options.limit,
  ) as AsyncGenerator<ReconciliationPrivyUsersPage>;
}

export function createPrivyWalletResourcesPageSource(
  listWalletResources: ReconciliationPrivyWalletResourcesListFn,
  privyUserId: string,
  options: { limit?: number } = {},
): AsyncGenerator<ReconciliationPrivyWalletResourcesPage> {
  return createCursorPageSource(
    (query) => listWalletResources({ ...query, user_id: privyUserId }),
    (page) => page.data,
    (page) => page.next_cursor,
    (error) => classifyPrivySdkError(error) ?? "pagination_failed",
    options.limit,
  ) as AsyncGenerator<ReconciliationPrivyWalletResourcesPage>;
}

export function createDatabaseUsersPageSource(
  listDatabaseUsers: ReconciliationDatabaseUsersListFn,
  options: { limit?: number } = {},
): AsyncGenerator<ReconciliationDatabaseUsersPage> {
  return createCursorPageSource(
    listDatabaseUsers,
    (page) => page.data,
    (page) => page.next_cursor,
    (error) => classifyDatabaseError(error) ?? "database_unknown_failure",
    options.limit,
  ) as AsyncGenerator<ReconciliationDatabaseUsersPage>;
}

export function parseWalletSurfaceReconciliationArgs(argv: ReadonlyArray<string>) {
  const args = {
    live_read_only: false,
    database_read_only: false,
    privy_app_id: null as string | null,
    limit: undefined as number | undefined,
  };
  const seenFlags = new Set<string>();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith("--")) {
      throw new WalletSurfaceReconciliationError("invalid_cli_arguments");
    }

    if (seenFlags.has(arg)) {
      throw new WalletSurfaceReconciliationError("invalid_cli_arguments");
    }

    if (arg === "--live-read-only") {
      seenFlags.add(arg);
      args.live_read_only = true;
      continue;
    }

    if (arg === "--database-read-only") {
      seenFlags.add(arg);
      args.database_read_only = true;
      continue;
    }

    if (arg === "--privy-app-id") {
      seenFlags.add(arg);
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new WalletSurfaceReconciliationError("invalid_cli_arguments");
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
        throw new WalletSurfaceReconciliationError("invalid_cli_arguments");
      }

      args.limit = parsed;
      index += 1;
      continue;
    }

    throw new WalletSurfaceReconciliationError("invalid_cli_arguments");
  }

  return args;
}

export function validateWalletSurfaceReconciliationLiveConfig(
  config: WalletSurfaceReconciliationLiveConfig,
) {
  const publicAppId = config.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() || null;
  const secret = config.env.PRIVY_APP_SECRET?.trim() || null;
  const databaseUrl = config.env.DATABASE_URL?.trim() || null;
  const optionalServerAppId = config.env.PRIVY_APP_ID?.trim() || null;

  if (!config.live_read_only) {
    return {
      ok: false as const,
      error_code: "live_read_only_flag_required" as const,
    };
  }

  if (!config.database_read_only) {
    return {
      ok: false as const,
      error_code: "database_read_authorization_required" as const,
    };
  }

  if (!publicAppId || !secret) {
    return {
      ok: false as const,
      error_code: "missing_privy_environment" as const,
    };
  }

  if (!databaseUrl) {
    return {
      ok: false as const,
      error_code: "missing_database_environment" as const,
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
    database_url: databaseUrl,
  };
}

export function renderWalletSurfaceReconciliationReport(
  report: WalletSurfaceReconciliationReport,
) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function finalizeFailedExecution(
  startedAt: Date,
  now: () => Date,
  errorCode: WalletSurfaceReconciliationErrorCode,
): WalletSurfaceReconciliationExecution {
  const report = createEmptyWalletSurfaceReconciliationReport(startedAt);
  report.complete = false;
  report.pagination_completed = false;
  report.completed_at = now().toISOString();
  report.duration_ms = Date.parse(report.completed_at) - Date.parse(report.started_at);
  report.error_code = errorCode;
  return { report, exit_code: 1 };
}

export async function executeWalletSurfaceReconciliation(
  pages: ReconciliationPages,
  startedAt = new Date(),
  now: () => Date = () => new Date(),
): Promise<WalletSurfaceReconciliationExecution> {
  const accumulator = createWalletSurfaceReconciliationAccumulator(startedAt);

  try {
    for await (const page of pages.privyUsers) {
      accumulator.ingestPrivyUsersPage(page);
    }

    for (const privyUserId of accumulator.getWalletResourceQueryUserIds()) {
      try {
        for await (const page of pages.privyWalletResourcesForUser(privyUserId)) {
          accumulator.ingestPrivyWalletResourcesPage(page, privyUserId);
        }
        accumulator.markWalletResourceScanComplete(privyUserId);
      } catch (error) {
        accumulator.markWalletResourceScanFailed(privyUserId);
        throw error;
      }
    }

    for await (const page of pages.databaseUsers) {
      accumulator.ingestDatabaseUsersPage(page);
    }

    return {
      report: accumulator.finalize({
        complete: true,
        pagination_completed: true,
        error_code: null,
        now,
      }),
      exit_code: 0,
    };
  } catch (error) {
    const errorCode =
      error instanceof WalletSurfaceReconciliationError
        ? error.code
        : classifyPrivySdkError(error) ??
          classifyDatabaseError(error) ??
          "pagination_failed";

    return {
      report: accumulator.finalize({
        complete: false,
        pagination_completed: false,
        error_code: errorCode,
        now,
      }),
      exit_code: 1,
    };
  }
}

export async function runWalletSurfaceReconciliationCli(
  options: WalletSurfaceReconciliationCliOptions,
): Promise<WalletSurfaceReconciliationCliResult> {
  const startedAt = options.now?.() ?? new Date();

  let parsed: ReturnType<typeof parseWalletSurfaceReconciliationArgs>;
  try {
    parsed = parseWalletSurfaceReconciliationArgs(options.argv);
  } catch (error) {
    const execution = finalizeFailedExecution(
      startedAt,
      options.now ?? (() => new Date()),
      error instanceof WalletSurfaceReconciliationError
        ? error.code
        : "invalid_cli_arguments",
    );

    return {
      ...execution,
      rendered: renderWalletSurfaceReconciliationReport(execution.report),
    };
  }

  const validation = validateWalletSurfaceReconciliationLiveConfig({
    live_read_only: parsed.live_read_only,
    database_read_only: parsed.database_read_only,
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
      rendered: renderWalletSurfaceReconciliationReport(execution.report),
    };
  }

  if (!options.listPrivyUsers) {
    const execution = finalizeFailedExecution(
      startedAt,
      options.now ?? (() => new Date()),
      "missing_privy_live_adapter",
    );

    return {
      ...execution,
      rendered: renderWalletSurfaceReconciliationReport(execution.report),
    };
  }

  if (!options.listPrivyWalletResources) {
    const execution = finalizeFailedExecution(
      startedAt,
      options.now ?? (() => new Date()),
      "missing_privy_live_adapter",
    );

    return {
      ...execution,
      rendered: renderWalletSurfaceReconciliationReport(execution.report),
    };
  }

  if (!options.listDatabaseUsers) {
    const execution = finalizeFailedExecution(
      startedAt,
      options.now ?? (() => new Date()),
      "missing_database_live_adapter",
    );

    return {
      ...execution,
      rendered: renderWalletSurfaceReconciliationReport(execution.report),
    };
  }

  const listPrivyWalletResources = options.listPrivyWalletResources;
  const listDatabaseUsers = options.listDatabaseUsers;

  const execution = await executeWalletSurfaceReconciliation(
    {
      privyUsers: createPrivyUsersPageSource(options.listPrivyUsers, {
        limit: parsed.limit,
      }),
      privyWalletResourcesForUser: (privyUserId) =>
        createPrivyWalletResourcesPageSource(
          listPrivyWalletResources,
          privyUserId,
          {
            limit: parsed.limit,
          },
        ),
      databaseUsers: createDatabaseUsersPageSource(listDatabaseUsers, {
        limit: parsed.limit,
      }),
    },
    startedAt,
    options.now ?? (() => new Date()),
  );

  return {
    ...execution,
    rendered: renderWalletSurfaceReconciliationReport(execution.report),
  };
}
