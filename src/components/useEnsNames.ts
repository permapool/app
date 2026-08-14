"use client";

import { useEffect, useMemo, useState } from "react";
import { isAddress } from "viem";

type EnsResponse = { name: string | null };

export function useEnsNames(addresses: string[]) {
  const addressKey = addresses.join(",");
  const validAddresses = useMemo(
    () => Array.from(new Set(addresses.filter((address) => isAddress(address)))),
    // A primitive key prevents contract-hook rerenders from restarting identical lookups.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addressKey],
  );
  const [names, setNames] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (validAddresses.length === 0) {
      setNames({});
      return;
    }

    let active = true;
    const controller = new AbortController();

    void Promise.all(
      validAddresses.map(async (address) => {
        try {
          const response = await fetch(`/api/ens?address=${encodeURIComponent(address)}`, {
            cache: "no-store",
            signal: controller.signal,
          });
          if (!response.ok) return [address, null] as const;

          const body: unknown = await response.json();
          const name =
            body &&
            typeof body === "object" &&
            (typeof (body as EnsResponse).name === "string" ||
              (body as EnsResponse).name === null)
              ? (body as EnsResponse).name
              : null;
          return [address, name] as const;
        } catch {
          return [address, null] as const;
        }
      }),
    ).then((entries) => {
      if (active) setNames(Object.fromEntries(entries));
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [validAddresses]);

  return names;
}
