import type { User as PrivyUser } from "@privy-io/node";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { prisma } from "~/lib/prisma";
import { getPrivyEmail, getPrivyWallets } from "~/lib/auth/privy-server";
import {
  generateUniqueUsername,
  isUniqueConstraintError,
} from "~/lib/auth/user-profile";
import type { AppUser } from "~/types/auth";

const BASE_CHAIN_ID = 8453;
const USER_SYNC_ATTEMPTS = 5;
const mainnetRpcUrl = process.env.MAINNET_JSON_RPC_URL?.trim();
const ensClient = createPublicClient({
  chain: mainnet,
  transport: mainnetRpcUrl ? http(mainnetRpcUrl) : http(),
});

async function resolveEnsName(address: string) {
  try {
    return await ensClient.getEnsName({ address: address as `0x${string}` });
  } catch {
    return null;
  }
}

class WalletOwnershipError extends Error {
  constructor(address: string) {
    super(`Wallet ${address} is already linked to another user`);
    this.name = "WalletOwnershipError";
  }
}

export async function syncPrivyUser(privyUser: PrivyUser): Promise<AppUser> {
  const email = getPrivyEmail(privyUser);
  const wallets = getPrivyWallets(privyUser);
  const primaryWallet = wallets[0]?.address?.toLowerCase();
  const ensDisplayName = primaryWallet ? await resolveEnsName(primaryWallet) : null;

  let syncedUserId: string | null = null;

  for (let attempt = 0; attempt < USER_SYNC_ATTEMPTS; attempt += 1) {
    try {
      syncedUserId = await prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
          where: { privyId: privyUser.id },
          select: {
            id: true,
            username: true,
            hasCustomHandle: true,
          },
        });

        const user =
          existingUser
            ? await tx.user.update({
                where: { id: existingUser.id },
                data: {
                  email,
                  ...(ensDisplayName && !existingUser.hasCustomHandle
                    ? { displayName: ensDisplayName }
                    : {}),
                },
              })
            : await tx.user.create({
                data: {
                  privyId: privyUser.id,
                  email,
                  username: await generateUniqueUsername(tx),
                  displayName: ensDisplayName,
                  hasCustomHandle: false,
                },
              });

        for (const wallet of wallets) {
          const normalizedAddress = wallet.address.toLowerCase();
          const existingWallet = await tx.wallet.findUnique({
            where: {
              address_chainId: {
                address: normalizedAddress,
                chainId: BASE_CHAIN_ID,
              },
            },
            select: {
              id: true,
              userId: true,
            },
          });

          if (existingWallet && existingWallet.userId !== user.id) {
            throw new WalletOwnershipError(normalizedAddress);
          }

          await tx.wallet.upsert({
            where: {
              address_chainId: {
                address: normalizedAddress,
                chainId: BASE_CHAIN_ID,
              },
            },
            update: {
              userId: user.id,
            },
            create: {
              address: normalizedAddress,
              chainId: BASE_CHAIN_ID,
              userId: user.id,
            },
          });
        }

        return user.id;
      });

      break;
    } catch (error) {
      if (isUniqueConstraintError(error, "username")) {
        continue;
      }

      throw error;
    }
  }

  if (!syncedUserId) {
    throw new Error("Unable to sync user after repeated username collisions");
  }

  const resolvedUser = await prisma.user.findUniqueOrThrow({
    where: { id: syncedUserId },
    include: {
      wallets: true,
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  return {
    userId: resolvedUser.id,
    privyId: resolvedUser.privyId,
    email: resolvedUser.email,
    username: resolvedUser.username,
    displayName: resolvedUser.displayName,
    hasCustomHandle: resolvedUser.hasCustomHandle,
    wallets: resolvedUser.wallets.map(
      (wallet: { id: string; address: string; chainId: number }) => ({
        id: wallet.id,
        address: wallet.address,
        chainId: wallet.chainId,
      }),
    ),
    roles: resolvedUser.userRoles.map(({ role }: { role: { id: string; name: string } }) => ({
      id: role.id,
      name: role.name,
    })),
  };
}
