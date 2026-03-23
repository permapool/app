"use client";

import { FormEvent, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAuth } from "~/components/providers/AuthProvider";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function MePage() {
  const { user, loading } = useAuth();
  const { getAccessToken, linkWallet } = usePrivy();
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const display = useMemo(() => {
    if (!user) {
      return "";
    }

    return user.displayName || user.username;
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error("Missing Privy access token");
      }

      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Failed to update username");
      }

      window.location.reload();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to update username",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="p-6">Loading...</main>;
  }

  if (!user) {
    return <main className="p-6">Not authenticated</main>;
  }

  return (
    <main className="p-6 space-y-6 max-w-[800px]">
      <section className="space-y-2">
        <h1>Me</h1>
        <div>@{user.username}</div>
        <div>{display}</div>
        <div>{user.email || "No email"}</div>
        <div className="text-xs opacity-70">{user.userId}</div>
      </section>

      <section className="space-y-2">
        <h2>Wallets</h2>
        {user.wallets.length === 0 ? (
          <div className="space-y-2">
            <div>No wallets linked</div>
            <button
              type="button"
              className="border px-3 py-1"
              onClick={() => linkWallet({ walletChainType: "ethereum-only" })}
            >
              Link wallet
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <ul>
              {user.wallets.map((wallet) => (
                <li key={wallet.id}>
                  {shortenAddress(wallet.address)} ({wallet.chainId})
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="border px-3 py-1"
              onClick={() => linkWallet({ walletChainType: "ethereum-only" })}
            >
              Link wallet
            </button>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2>Roles</h2>
        <div className="flex gap-2 flex-wrap">
          {user.roles.map((role) => (
            <span key={role.id} className="border px-2 py-1 text-xs">
              {role.name}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2>Update username</h2>
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="new username"
            className="border px-2 py-1"
          />
          <button type="submit" disabled={submitting} className="border px-3 py-1">
            {submitting ? "Saving..." : "Save"}
          </button>
        </form>
        {error ? <div>{error}</div> : null}
      </section>
    </main>
  );
}
