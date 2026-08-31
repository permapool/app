import { getAddress, isAddress } from "viem";
import { isAddress as isSolanaAddress } from "@solana/kit";

export type PrivyLinkedAccountType = "wallet" | "smart_wallet" | (string & {});

export type PrivyLinkedWalletAccountInput = {
  type: PrivyLinkedAccountType;
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
};

export type WalletKind = "eoa" | "smart_wallet" | "unknown";
export type WalletOrigin = "embedded" | "external" | "unknown";
export type WalletChainNamespace = "ethereum" | "solana" | "unsupported" | "unknown";
export type WalletAuthority = "user" | "server_signer_present" | "service" | "unknown";
export type WalletSelectionStatus = "candidate" | "ineligible" | "ambiguous";
export type WalletInventoryOutcome =
  | "no_candidate"
  | "exactly_one_candidate"
  | "multiple_candidates"
  | "ambiguous_authority"
  | "duplicates_reconciliation_required";

export type WalletInventoryReasonCode =
  | "embedded_evm_candidate"
  | "authority_unverified"
  | "external_wallet_not_default"
  | "solana_not_eligible_for_base_policy"
  | "smart_wallet_requires_separate_policy"
  | "delegated_server_signer_present"
  | "missing_required_metadata"
  | "unsupported_account_type"
  | "invalid_address"
  | "duplicate_identity_requires_reconciliation";

export interface NormalizedPrivyLinkedWalletAccount {
  inputIndex: number;
  accountType: PrivyLinkedAccountType;
  normalizedAccountId: string | null;
  normalizedAddress: string | null;
  kind: WalletKind;
  origin: WalletOrigin;
  chainNamespace: WalletChainNamespace;
  authority: WalletAuthority;
  delegated: boolean | null;
  imported: boolean | null;
  walletIndex: number | null;
  selectionStatus: WalletSelectionStatus;
  reasonCodes: WalletInventoryReasonCode[];
  normalizationStatus: "valid" | "invalid";
}

export interface WalletInventorySummary {
  status: WalletInventoryOutcome;
  outcomeCodes: WalletInventoryOutcome[];
  candidateCount: number;
  ambiguousCount: number;
  duplicateCount: number;
  candidateIndexes: number[];
  ambiguousIndexes: number[];
  duplicateIndexes: number[];
  reasonCodes: WalletInventoryReasonCode[];
}

export interface WalletInventoryResult {
  records: NormalizedPrivyLinkedWalletAccount[];
  summary: WalletInventorySummary;
}

function compactReasons(reasons: WalletInventoryReasonCode[]) {
  return Array.from(new Set(reasons));
}

function normalizeOptionalText(value: string | null | undefined) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeAccountId(value: string | null | undefined) {
  return normalizeOptionalText(value);
}

function normalizeChainNamespace(
  account: PrivyLinkedWalletAccountInput,
): WalletChainNamespace {
  switch (account.chain_type) {
    case "ethereum":
      return "ethereum";
    case "solana":
      return "solana";
    case undefined:
    case null:
      return "unknown";
    default:
      return "unsupported";
  }
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

function classifyOrigin(account: PrivyLinkedWalletAccountInput): WalletOrigin {
  if (account.type !== "wallet") {
    return "unknown";
  }

  if (
    account.wallet_client === "privy" &&
    account.wallet_client_type === "privy" &&
    account.connector_type === "embedded"
  ) {
    return "embedded";
  }

  if (account.wallet_client_type && account.wallet_client_type !== "privy") {
    return "external";
  }

  return "unknown";
}

function classifyKind(account: PrivyLinkedWalletAccountInput): WalletKind {
  if (account.type === "wallet") {
    return "eoa";
  }

  if (account.type === "smart_wallet") {
    return "smart_wallet";
  }

  return "unknown";
}

function classifyAuthority(
  delegated: boolean | null,
): WalletAuthority {
  if (delegated === true) {
    return "server_signer_present";
  }

  return "unknown";
}

function classifyRecord(
  account: PrivyLinkedWalletAccountInput,
  inputIndex: number,
): NormalizedPrivyLinkedWalletAccount {
  const accountType = account.type;
  const normalizedAccountId = normalizeAccountId(account.id);
  const normalizedReasons: WalletInventoryReasonCode[] = [];
  const kind = classifyKind(account);
  const origin = classifyOrigin(account);
  const chainNamespace = normalizeChainNamespace(account);
  const delegated = typeof account.delegated === "boolean" ? account.delegated : null;
  const imported = typeof account.imported === "boolean" ? account.imported : null;
  const walletIndex =
    typeof account.wallet_index === "number" && Number.isInteger(account.wallet_index)
      ? account.wallet_index
      : null;

  let normalizationStatus: "valid" | "invalid" = "valid";
  let normalizedAddress: string | null = null;
  let selectionStatus: WalletSelectionStatus = "ineligible";
  let authority: WalletAuthority = "unknown";

  if (accountType === "wallet") {
    const address = normalizeOptionalText(account.address);

    if (!address) {
      normalizationStatus = "invalid";
      normalizedReasons.push("missing_required_metadata");
    } else if (chainNamespace === "ethereum") {
      normalizedAddress = normalizeEvmAddress(address);

      if (!normalizedAddress) {
        normalizationStatus = "invalid";
        normalizedReasons.push("invalid_address");
      }
    } else if (chainNamespace === "solana") {
      normalizedAddress = normalizeSolanaAddress(address);

      if (!normalizedAddress) {
        normalizationStatus = "invalid";
        normalizedReasons.push("invalid_address");
      }
    } else if (chainNamespace === "unsupported") {
      normalizationStatus = "invalid";
      normalizedReasons.push("unsupported_account_type");
    } else {
      normalizationStatus = "invalid";
      normalizedReasons.push("missing_required_metadata");
    }

    if (origin === "embedded" && chainNamespace === "ethereum" && normalizedAddress) {
      selectionStatus = "candidate";
      normalizedReasons.push("embedded_evm_candidate");
      authority = classifyAuthority(delegated);

      if (authority === "unknown") {
        normalizedReasons.push("authority_unverified");
      } else {
        normalizedReasons.push("delegated_server_signer_present");
      }
    } else if (origin === "external") {
      selectionStatus = "ineligible";
      normalizedReasons.push("external_wallet_not_default");
    } else if (chainNamespace === "solana") {
      selectionStatus = "ineligible";
      normalizedReasons.push("solana_not_eligible_for_base_policy");
      authority = classifyAuthority(delegated);
      if (authority === "server_signer_present") {
        normalizedReasons.push("delegated_server_signer_present");
      }
    } else if (chainNamespace === "unknown" || chainNamespace === "unsupported") {
      selectionStatus = "ambiguous";
      if (!normalizedReasons.includes("missing_required_metadata")) {
        normalizedReasons.push("missing_required_metadata");
      }
    } else if (origin === "unknown" && chainNamespace === "ethereum" && normalizedAddress) {
      selectionStatus = "ambiguous";
      normalizedReasons.push("authority_unverified");
    }
  } else if (accountType === "smart_wallet") {
    const address = normalizeOptionalText(account.address);

    if (!address) {
      normalizationStatus = "invalid";
      normalizedReasons.push("missing_required_metadata");
    } else if (isAddress(address)) {
      normalizedAddress = getAddress(address);
    } else {
      normalizedAddress = null;
      normalizationStatus = "invalid";
      normalizedReasons.push("invalid_address");
    }

    selectionStatus = "ineligible";
    normalizedReasons.push("smart_wallet_requires_separate_policy");
  } else {
    const address = normalizeOptionalText(account.address);

    if (address) {
      if (isAddress(address)) {
        normalizedAddress = getAddress(address);
      } else if (isSolanaAddress(address)) {
        normalizedAddress = address;
      }
    }

    normalizationStatus = "invalid";
    selectionStatus = "ineligible";
    normalizedReasons.push("unsupported_account_type");
  }

  return {
    inputIndex,
    accountType,
    normalizedAccountId,
    normalizedAddress,
    kind,
    origin,
    chainNamespace,
    authority,
    delegated,
    imported,
    walletIndex,
    selectionStatus,
    reasonCodes: compactReasons(normalizedReasons),
    normalizationStatus,
  };
}

function keyForIdentity(record: NormalizedPrivyLinkedWalletAccount) {
  if (!record.normalizedAddress) {
    return null;
  }

  return `${record.chainNamespace}:${record.normalizedAddress}`;
}

export function classifyPrivyLinkedWalletInventory(
  accounts: ReadonlyArray<PrivyLinkedWalletAccountInput>,
): WalletInventoryResult {
  const records = accounts.map((account, inputIndex) => classifyRecord(account, inputIndex));
  const duplicateKeys = new Map<string, number[]>();
  const duplicateIndexes = new Set<number>();
  const idKeys = new Map<string, number[]>();

  records.forEach((record, index) => {
    if (record.normalizedAccountId) {
      const existing = idKeys.get(record.normalizedAccountId) ?? [];
      existing.push(index);
      idKeys.set(record.normalizedAccountId, existing);
    }

    if (record.normalizationStatus !== "valid") {
      return;
    }

    const identityKey = keyForIdentity(record);

    if (!identityKey) {
      return;
    }

    const existing = duplicateKeys.get(identityKey) ?? [];
    existing.push(index);
    duplicateKeys.set(identityKey, existing);
  });

  const conflictingIndexes = new Set<number>();

  for (const indexes of [ ...duplicateKeys.values(), ...idKeys.values() ]) {
    if (indexes.length < 2) continue;

    for (const index of indexes) {
      conflictingIndexes.add(index);
      duplicateIndexes.add(index);
    }
  }

  const updatedRecords = records.map((record, index) => {
    if (!conflictingIndexes.has(index)) {
      return record;
    }

    return {
      ...record,
      selectionStatus: "ambiguous" as const,
      reasonCodes: compactReasons([
        ...record.reasonCodes,
        "duplicate_identity_requires_reconciliation",
      ]),
    };
  });

  const candidateIndexes = updatedRecords.flatMap((record, index) =>
    record.selectionStatus === "candidate" ? [index] : [],
  );
  const ambiguousIndexes = updatedRecords.flatMap((record, index) =>
    record.selectionStatus === "ambiguous" ? [index] : [],
  );
  const candidateRecords = updatedRecords.filter((record) => record.selectionStatus === "candidate");
  const authorityUnknownCandidates = candidateRecords.filter(
    (record) => record.authority === "unknown",
  );
  const ambiguousRecords = updatedRecords.filter((record) => record.selectionStatus === "ambiguous");

  const duplicateReasonCodes: WalletInventoryReasonCode[] = [];
  if (duplicateIndexes.size > 0) {
    duplicateReasonCodes.push("duplicate_identity_requires_reconciliation");
  }

  let summaryStatus: WalletInventoryOutcome;
  if (duplicateIndexes.size > 0) {
    summaryStatus = "duplicates_reconciliation_required";
  } else if (candidateRecords.length === 1) {
    summaryStatus = "exactly_one_candidate";
  } else if (candidateRecords.length > 1) {
    summaryStatus = "multiple_candidates";
  } else {
    summaryStatus = "no_candidate";
  }

  const outcomeCodes: WalletInventoryOutcome[] = [summaryStatus];
  if (authorityUnknownCandidates.length > 0 || ambiguousRecords.length > 0) {
    outcomeCodes.push("ambiguous_authority");
  }
  if (candidateRecords.length > 1 && !outcomeCodes.includes("multiple_candidates")) {
    outcomeCodes.push("multiple_candidates");
  }
  if (candidateRecords.length === 1 && !outcomeCodes.includes("exactly_one_candidate")) {
    outcomeCodes.push("exactly_one_candidate");
  }
  if (candidateRecords.length === 0 && !outcomeCodes.includes("no_candidate")) {
    outcomeCodes.push("no_candidate");
  }
  if (duplicateIndexes.size > 0 && !outcomeCodes.includes("duplicates_reconciliation_required")) {
    outcomeCodes.push("duplicates_reconciliation_required");
  }

  return {
    records: updatedRecords,
    summary: {
      status: summaryStatus,
      outcomeCodes,
      candidateCount: candidateRecords.length,
      ambiguousCount: ambiguousIndexes.length,
      duplicateCount: duplicateIndexes.size,
      candidateIndexes,
      ambiguousIndexes,
      duplicateIndexes: Array.from(duplicateIndexes).sort((a, b) => a - b),
      reasonCodes: compactReasons([
        ...duplicateReasonCodes,
        ...((authorityUnknownCandidates.length > 0 || ambiguousRecords.length > 0)
          ? (["authority_unverified"] as WalletInventoryReasonCode[])
          : []),
      ]),
    },
  };
}

export function classifyPrivyLinkedWalletAccount(
  account: PrivyLinkedWalletAccountInput,
): NormalizedPrivyLinkedWalletAccount {
  return classifyPrivyLinkedWalletInventory([account]).records[0];
}
