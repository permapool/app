import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrivyClient } from "@privy-io/node";
import {
  runWalletSurfaceReconciliationCli,
  type ReconciliationDatabaseUsersListFn,
  type ReconciliationPrivyLinkedAccountInput,
  type ReconciliationPrivyUsersListFn,
  type ReconciliationPrivyWalletResourcesListQuery,
  type ReconciliationPrivyWalletResourcesListFn,
  type ReconciliationListQuery,
  type ReconciliationPrivyUsersPage,
  type ReconciliationPrivyWalletResourcesPage,
} from "../src/lib/auth/wallet-surface-reconciliation";

interface LivePrivyClientLike {
  users(): {
    list(query?: ReconciliationListQuery): Promise<LivePrivyUsersPage>;
  };
  wallets(): {
    list(query: ReconciliationPrivyWalletResourcesListQuery): Promise<LivePrivyWalletResourcesPage>;
  };
}

interface LivePrivyUser {
  id: string;
  linked_accounts: ReadonlyArray<ReconciliationPrivyLinkedAccountInput>;
}

interface LivePrivyUsersPage {
  data: ReadonlyArray<LivePrivyUser>;
  next_cursor: string;
}

interface LivePrivyWalletResource {
  id: string;
  address: string;
  chain_type: "ethereum" | "solana" | (string & {});
  owner_id: string | null;
  additional_signers: ReadonlyArray<{
    signer_id: string;
    override_policy_ids?: ReadonlyArray<string>;
  }>;
  imported_at: number | null;
  exported_at: number | null;
}

interface LivePrivyWalletResourcesPage {
  data: ReadonlyArray<LivePrivyWalletResource>;
  next_cursor: string;
}

interface LivePrismaUserRow {
  id: string;
  privyId: string | null;
  wallets: ReadonlyArray<{
    id: string;
    address: string;
    chainId: number;
  }>;
}

interface LivePrismaClientLike {
  $disconnect?: () => Promise<void>;
  user: {
    findMany(args: {
      cursor?: { id: string };
      skip?: number;
      take: number;
      orderBy: { id: "asc" };
      select: {
        id: true;
        privyId: true;
        wallets: {
          select: {
            id: true;
            address: true;
            chainId: true;
          };
        };
      };
    }): Promise<ReadonlyArray<LivePrismaUserRow>>;
  };
}

export interface CreateWalletSurfaceReconciliationLiveAdaptersOptions {
  createPrivyClient: () => LivePrivyClientLike;
  createPrismaClient: () => LivePrismaClientLike;
}

function normalizeLivePrivyUsersPage(page: LivePrivyUsersPage): ReconciliationPrivyUsersPage {
  if (!page || !Array.isArray(page.data) || typeof page.next_cursor !== "string") {
    throw new Error("Invalid Privy users page shape");
  }

  return {
    data: page.data.map((user) => {
      const privyUserId = typeof user.id === "string" ? user.id.trim() : "";
      if (!privyUserId) {
        throw new Error("Invalid Privy user ID");
      }

      return {
        privy_user_id: privyUserId,
        linked_accounts: Array.isArray(user.linked_accounts)
          ? (user.linked_accounts as ReadonlyArray<ReconciliationPrivyLinkedAccountInput>)
          : [],
      };
    }),
    next_cursor: page.next_cursor,
  };
}

export function createWalletSurfaceReconciliationLiveAdapters(
  options: CreateWalletSurfaceReconciliationLiveAdaptersOptions,
) {
  let privyClient: LivePrivyClientLike | null = null;
  let prismaClient: LivePrismaClientLike | null = null;

  const getPrivyClient = () => {
    privyClient ??= options.createPrivyClient();
    return privyClient;
  };

  const getPrismaClient = () => {
    prismaClient ??= options.createPrismaClient();
    return prismaClient;
  };

  const listPrivyUsers: ReconciliationPrivyUsersListFn = async (query) => {
    const page = await getPrivyClient().users().list(query);
    return normalizeLivePrivyUsersPage(page);
  };

  const listPrivyWalletResources: ReconciliationPrivyWalletResourcesListFn = async (query) => {
    const page = await getPrivyClient().wallets().list(query);
    return {
      data: page.data.map((wallet) => ({
        wallet_id: wallet.id,
        address: wallet.address,
        chain_type: wallet.chain_type,
        privy_user_id: query.user_id,
        owner_id: wallet.owner_id,
        additional_signers: wallet.additional_signers,
        imported_at: wallet.imported_at,
        exported_at: wallet.exported_at,
      })),
      next_cursor: page.next_cursor,
    };
  };

  const listDatabaseUsers: ReconciliationDatabaseUsersListFn = async (query) => {
    const take = query.limit ?? 100;
    const rows = await getPrismaClient().user.findMany({
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : undefined,
      take: take + 1,
      orderBy: { id: "asc" },
      select: {
        id: true,
        privyId: true,
        wallets: {
          select: {
            id: true,
            address: true,
            chainId: true,
          },
        },
      },
    });

    const data = rows.slice(0, take).map((row) => ({
      id: row.id,
      privyId: row.privyId,
      wallets: row.wallets,
    }));

    return {
      data,
      next_cursor: rows.length > take ? data[data.length - 1]?.id ?? "" : "",
    };
  };

  return {
    listPrivyUsers,
    listPrivyWalletResources,
    listDatabaseUsers,
    async dispose() {
      if (prismaClient?.$disconnect) {
        await prismaClient.$disconnect();
      }
    },
  };
}

function createLivePrivyClient(): LivePrivyClientLike {
  return new PrivyClient({
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "",
    appSecret: process.env.PRIVY_APP_SECRET ?? "",
  }) as unknown as LivePrivyClientLike;
}

function createLivePrismaClient(): LivePrismaClientLike {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  }) as unknown as LivePrismaClientLike;
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const adapters = createWalletSurfaceReconciliationLiveAdapters({
    createPrivyClient: createLivePrivyClient,
    createPrismaClient: createLivePrismaClient,
  });

  try {
    const result = await runWalletSurfaceReconciliationCli({
      argv,
      env,
      now: () => new Date(),
      listPrivyUsers: adapters.listPrivyUsers,
      listPrivyWalletResources: adapters.listPrivyWalletResources,
      listDatabaseUsers: adapters.listDatabaseUsers,
    });

    process.stdout.write(result.rendered);
    process.exitCode = result.exit_code;
  } finally {
    await adapters.dispose();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(() => {
    process.exitCode = 1;
  });
}
