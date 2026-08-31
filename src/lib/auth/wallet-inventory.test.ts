import { describe, expect, it } from "vitest";
import {
  classifyPrivyLinkedWalletAccount,
  classifyPrivyLinkedWalletInventory,
  type PrivyLinkedWalletAccountInput,
} from "./wallet-inventory";

const EVM_ADDRESS_A = "0x1111111111111111111111111111111111111111";
const EVM_ADDRESS_B = "0x2222222222222222222222222222222222222222";
const SOLANA_ADDRESS = "So11111111111111111111111111111111111111112";

function wallet(
  overrides: Partial<PrivyLinkedWalletAccountInput> = {},
): PrivyLinkedWalletAccountInput {
  return {
    type: "wallet",
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

describe("classifyPrivyLinkedWalletInventory", () => {
  it("classifies an embedded EVM wallet as a candidate with embedded provenance", () => {
    const result = classifyPrivyLinkedWalletInventory([
      wallet({
        id: "wallet-id-a",
        address: EVM_ADDRESS_A,
      }),
    ]);

    expect(result.records[0]).toMatchObject({
      accountType: "wallet",
      normalizedAccountId: "wallet-id-a",
      normalizedAddress: EVM_ADDRESS_A,
      kind: "eoa",
      origin: "embedded",
      chainNamespace: "ethereum",
      authority: "unknown",
      delegated: false,
      imported: false,
      walletIndex: 0,
      selectionStatus: "candidate",
      normalizationStatus: "valid",
    });
    expect(result.records[0].reasonCodes).toEqual([
      "embedded_evm_candidate",
      "authority_unverified",
    ]);
    expect(result.summary).toMatchObject({
      status: "exactly_one_candidate",
      candidateCount: 1,
      ambiguousCount: 0,
      duplicateCount: 0,
      candidateIndexes: [0],
      ambiguousIndexes: [],
      duplicateIndexes: [],
    });
    expect(result.summary.outcomeCodes).toEqual([
      "exactly_one_candidate",
      "ambiguous_authority",
    ]);
  });

  it("keeps delegated embedded wallets distinct from service-owned records", () => {
    const result = classifyPrivyLinkedWalletInventory([
      wallet({
        id: "delegated-wallet",
        address: EVM_ADDRESS_B,
        delegated: true,
      }),
    ]);

    expect(result.records[0]).toMatchObject({
      origin: "embedded",
      authority: "server_signer_present",
      selectionStatus: "candidate",
    });
    expect(result.records[0].reasonCodes).toEqual([
      "embedded_evm_candidate",
      "delegated_server_signer_present",
    ]);
    expect(result.summary.status).toBe("exactly_one_candidate");
    expect(result.summary.outcomeCodes).toEqual(["exactly_one_candidate"]);
  });

  it("marks external EVM wallets ineligible for the default application wallet", () => {
    const result = classifyPrivyLinkedWalletInventory([
      wallet({
        id: null,
        address: EVM_ADDRESS_B,
        wallet_client: "metamask",
        wallet_client_type: "metamask",
        connector_type: "injected",
      }),
    ]);

    expect(result.records[0]).toMatchObject({
      kind: "eoa",
      origin: "external",
      chainNamespace: "ethereum",
      authority: "unknown",
      selectionStatus: "ineligible",
      normalizationStatus: "valid",
    });
    expect(result.records[0].reasonCodes).toContain("external_wallet_not_default");
    expect(result.summary.status).toBe("no_candidate");
    expect(result.summary.outcomeCodes).toEqual(["no_candidate"]);
  });

  it("marks embedded Solana wallets ineligible for the Base-only application policy", () => {
    const result = classifyPrivyLinkedWalletInventory([
      wallet({
        id: "sol-wallet",
        address: SOLANA_ADDRESS,
        chain_type: "solana",
      }),
    ]);

    expect(result.records[0]).toMatchObject({
      kind: "eoa",
      origin: "embedded",
      chainNamespace: "solana",
      selectionStatus: "ineligible",
      normalizationStatus: "valid",
    });
    expect(result.records[0].normalizedAddress).toBe(SOLANA_ADDRESS);
    expect(result.records[0].reasonCodes).toEqual([
      "solana_not_eligible_for_base_policy",
    ]);
    expect(result.summary.status).toBe("no_candidate");
    expect(result.summary.outcomeCodes).toEqual(["no_candidate"]);
  });

  it("marks external Solana wallets ineligible without changing case", () => {
    const externalSolana = classifyPrivyLinkedWalletAccount(
      wallet({
        id: null,
        address: SOLANA_ADDRESS,
        chain_type: "solana",
        wallet_client: "phantom",
        wallet_client_type: "phantom",
        connector_type: "wallet_connect",
      }),
    );

    expect(externalSolana).toMatchObject({
      origin: "external",
      chainNamespace: "solana",
      normalizedAddress: SOLANA_ADDRESS,
      selectionStatus: "ineligible",
    });
  });

  it("keeps smart wallets separate from ordinary wallets", () => {
    const result = classifyPrivyLinkedWalletInventory([
      {
        type: "smart_wallet",
        id: "smart-wallet",
        address: EVM_ADDRESS_A,
      },
    ]);

    expect(result.records[0]).toMatchObject({
      kind: "smart_wallet",
      origin: "unknown",
      chainNamespace: "unknown",
      authority: "unknown",
      selectionStatus: "ineligible",
      normalizationStatus: "valid",
    });
    expect(result.records[0].reasonCodes).toEqual([
      "smart_wallet_requires_separate_policy",
    ]);
    expect(result.summary.status).toBe("no_candidate");
    expect(result.summary.outcomeCodes).toEqual(["no_candidate"]);
  });

  it("treats imported embedded wallets as embedded without promoting them to service-owned", () => {
    const result = classifyPrivyLinkedWalletInventory([
      wallet({
        id: "imported-wallet",
        address: EVM_ADDRESS_A,
        imported: true,
      }),
    ]);

    expect(result.records[0]).toMatchObject({
      origin: "embedded",
      imported: true,
      authority: "unknown",
      selectionStatus: "candidate",
    });
    expect(result.records[0].reasonCodes).toContain("authority_unverified");
    expect(result.summary.outcomeCodes).toEqual([
      "exactly_one_candidate",
      "ambiguous_authority",
    ]);
  });

  it("preserves embedded wallets with missing client metadata as ambiguous rather than guessing", () => {
    const result = classifyPrivyLinkedWalletInventory([
      wallet({
        id: "missing-metadata",
        address: EVM_ADDRESS_A,
        wallet_client: undefined,
        wallet_client_type: undefined,
        connector_type: undefined,
      }),
    ]);

    expect(result.records[0]).toMatchObject({
      origin: "unknown",
      chainNamespace: "ethereum",
      normalizedAddress: EVM_ADDRESS_A,
      selectionStatus: "ambiguous",
      normalizationStatus: "valid",
    });
    expect(result.records[0].reasonCodes).toContain("authority_unverified");
    expect(result.summary.status).toBe("no_candidate");
    expect(result.summary.outcomeCodes).toEqual([
      "no_candidate",
      "ambiguous_authority",
    ]);
  });

  it("returns a typed invalid result for unsupported account types", () => {
    const result = classifyPrivyLinkedWalletInventory([
      {
        type: "email",
        address: "dev@example.test",
      },
    ]);

    expect(result.records[0]).toMatchObject({
      kind: "unknown",
      origin: "unknown",
      chainNamespace: "unknown",
      authority: "unknown",
      selectionStatus: "ineligible",
      normalizationStatus: "invalid",
    });
    expect(result.records[0].reasonCodes).toContain("unsupported_account_type");
    expect(result.summary.outcomeCodes).toEqual(["no_candidate"]);
  });

  it("rejects invalid EVM addresses", () => {
    const result = classifyPrivyLinkedWalletInventory([
      wallet({
        id: "bad-evm",
        address: "0x1234",
      }),
    ]);

    expect(result.records[0]).toMatchObject({
      normalizationStatus: "invalid",
      selectionStatus: "ineligible",
      normalizedAddress: null,
    });
    expect(result.records[0].reasonCodes).toContain("invalid_address");
    expect(result.summary.outcomeCodes).toEqual(["no_candidate"]);
  });

  it("preserves Solana case-sensitive addresses exactly", () => {
    const result = classifyPrivyLinkedWalletInventory([
      wallet({
        id: "sol-case",
        address: SOLANA_ADDRESS,
        chain_type: "solana",
      }),
    ]);

    expect(result.records[0].normalizedAddress).toBe(SOLANA_ADDRESS);
  });

  it("flags duplicate account IDs for reconciliation", () => {
    const result = classifyPrivyLinkedWalletInventory([
      wallet({
        id: "duplicate-wallet",
        address: EVM_ADDRESS_A,
      }),
      wallet({
        id: "duplicate-wallet",
        address: EVM_ADDRESS_B,
      }),
    ]);

    expect(result.records[0].selectionStatus).toBe("ambiguous");
    expect(result.records[1].selectionStatus).toBe("ambiguous");
    expect(result.records[0].reasonCodes).toContain(
      "duplicate_identity_requires_reconciliation",
    );
    expect(result.summary.status).toBe("duplicates_reconciliation_required");
    expect(result.summary.duplicateCount).toBe(2);
  });

  it("flags duplicate IDs even when one record is unsupported", () => {
    const result = classifyPrivyLinkedWalletInventory([
      wallet({
        id: "mixed-duplicate",
        address: EVM_ADDRESS_A,
      }),
      {
        type: "email",
        id: "mixed-duplicate",
        address: "dev@example.test",
      },
    ]);

    expect(result.records[0].selectionStatus).toBe("ambiguous");
    expect(result.records[1].selectionStatus).toBe("ambiguous");
    expect(result.records[1].reasonCodes).toContain(
      "duplicate_identity_requires_reconciliation",
    );
    expect(result.summary.status).toBe("duplicates_reconciliation_required");
    expect(result.summary.duplicateCount).toBe(2);
  });

  it("flags duplicate normalized EVM addresses across surfaces", () => {
    const result = classifyPrivyLinkedWalletInventory([
      wallet({
        id: "embedded-a",
        address: EVM_ADDRESS_A,
      }),
      wallet({
        id: null,
        address: EVM_ADDRESS_A,
        wallet_client: "rainbow",
        wallet_client_type: "rainbow",
        connector_type: "wallet_connect",
      }),
    ]);

    expect(result.records[0].selectionStatus).toBe("ambiguous");
    expect(result.records[1].selectionStatus).toBe("ambiguous");
    expect(result.summary.status).toBe("duplicates_reconciliation_required");
    expect(result.summary.duplicateCount).toBe(2);
  });

  it("marks multiple delegated embedded EVM candidates without choosing a winner", () => {
    const result = classifyPrivyLinkedWalletInventory([
      wallet({
        id: "delegated-a",
        address: EVM_ADDRESS_A,
        delegated: true,
      }),
      wallet({
        id: "delegated-b",
        address: EVM_ADDRESS_B,
        delegated: true,
      }),
    ]);

    expect(result.summary).toMatchObject({
      status: "multiple_candidates",
      candidateCount: 2,
      ambiguousCount: 0,
      duplicateCount: 0,
      candidateIndexes: [0, 1],
    });
  });

  it("returns an empty inventory without a candidate", () => {
    const result = classifyPrivyLinkedWalletInventory([]);

    expect(result.records).toEqual([]);
    expect(result.summary).toMatchObject({
      status: "no_candidate",
      candidateCount: 0,
      ambiguousCount: 0,
      duplicateCount: 0,
      candidateIndexes: [],
      ambiguousIndexes: [],
      duplicateIndexes: [],
    });
    expect(result.summary.outcomeCodes).toEqual(["no_candidate"]);
  });

  it("produces identical output on repeated classification", () => {
    const inventory = [
      wallet({
        id: "repeat-a",
        address: EVM_ADDRESS_A,
      }),
      wallet({
        id: "repeat-b",
        address: EVM_ADDRESS_B,
        delegated: true,
      }),
      {
        type: "smart_wallet",
        id: "repeat-smart",
        address: EVM_ADDRESS_A,
      },
    ] satisfies PrivyLinkedWalletAccountInput[];

    expect(classifyPrivyLinkedWalletInventory(inventory)).toEqual(
      classifyPrivyLinkedWalletInventory(inventory),
    );
  });

  it("preserves inventory order without using it as a selection rule", () => {
    const first = classifyPrivyLinkedWalletInventory([
      wallet({
        id: "ordered-a",
        address: EVM_ADDRESS_A,
      }),
      wallet({
        id: "ordered-b",
        address: EVM_ADDRESS_B,
        wallet_client: "coinbase_wallet",
        wallet_client_type: "coinbase_wallet",
        connector_type: "coinbase_wallet",
      }),
    ]);
    const second = classifyPrivyLinkedWalletInventory([
      wallet({
        id: "ordered-b",
        address: EVM_ADDRESS_B,
        wallet_client: "coinbase_wallet",
        wallet_client_type: "coinbase_wallet",
        connector_type: "coinbase_wallet",
      }),
      wallet({
        id: "ordered-a",
        address: EVM_ADDRESS_A,
      }),
    ]);

    expect(first.records.map((record) => record.normalizedAccountId)).toEqual([
      "ordered-a",
      "ordered-b",
    ]);
    expect(second.records.map((record) => record.normalizedAccountId)).toEqual([
      "ordered-b",
      "ordered-a",
    ]);
    expect(first.summary.status).toBe(second.summary.status);
    expect(first.summary.candidateCount).toBe(second.summary.candidateCount);
  });
});
