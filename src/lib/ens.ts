import "server-only";

import { createPublicClient, getAddress, http, isAddress, type Address } from "viem";
import { mainnet } from "viem/chains";

export const ENS_PROVIDER_TIMEOUT_MS = 5_000;
export const ENS_POSITIVE_CACHE_TTL_MS = 5 * 60_000;
export const ENS_NEGATIVE_CACHE_TTL_MS = 60_000;

const MAX_CACHE_ENTRIES = 500;
const mainnetRpcUrl = process.env.MAINNET_JSON_RPC_URL?.trim();
const ensClient = createPublicClient({
  chain: mainnet,
  transport: http(mainnetRpcUrl || undefined, {
    retryCount: 0,
    timeout: ENS_PROVIDER_TIMEOUT_MS,
  }),
});

type EnsLookup = (address: Address) => Promise<string | null>;

type EnsResolverOptions = {
  lookup?: EnsLookup;
  now?: () => number;
  positiveCacheTtlMs?: number;
  negativeCacheTtlMs?: number;
  providerTimeoutMs?: number;
  maxCacheEntries?: number;
};

function normalizeEnsName(name: string | null) {
  const normalized = name?.trim().toLowerCase();
  return normalized || null;
}

export function createEnsResolver({
  lookup = (address) => ensClient.getEnsName({ address }),
  now = Date.now,
  positiveCacheTtlMs = ENS_POSITIVE_CACHE_TTL_MS,
  negativeCacheTtlMs = ENS_NEGATIVE_CACHE_TTL_MS,
  providerTimeoutMs = ENS_PROVIDER_TIMEOUT_MS,
  maxCacheEntries = MAX_CACHE_ENTRIES,
}: EnsResolverOptions = {}) {
  const cache = new Map<string, { expiresAt: number; name: string | null }>();
  const inFlight = new Map<string, Promise<string | null>>();

  const readProvider = async (address: Address) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      return await Promise.race([
        lookup(address).then(normalizeEnsName),
        new Promise<null>((resolve) => {
          timeout = setTimeout(() => resolve(null), providerTimeoutMs);
        }),
      ]);
    } catch {
      return null;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  };

  return async function resolveEnsName(address: string): Promise<string | null> {
    if (!isAddress(address)) return null;

    const normalizedAddress = getAddress(address);
    const cacheKey = normalizedAddress.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > now()) return cached.name;
    if (cached) cache.delete(cacheKey);

    const pending = inFlight.get(cacheKey);
    if (pending) return pending;

    const lookupPromise = readProvider(normalizedAddress).then((name) => {
      if (cache.size >= maxCacheEntries) {
        const oldestKey = cache.keys().next().value as string | undefined;
        if (oldestKey) cache.delete(oldestKey);
      }

      cache.set(cacheKey, {
        expiresAt: now() + (name ? positiveCacheTtlMs : negativeCacheTtlMs),
        name,
      });
      return name;
    });

    inFlight.set(cacheKey, lookupPromise);

    try {
      return await lookupPromise;
    } finally {
      inFlight.delete(cacheKey);
    }
  };
}

export const resolveEnsName = createEnsResolver();
