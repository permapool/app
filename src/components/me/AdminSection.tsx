"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAuth } from "~/components/providers/AuthProvider";

type ListedUser = {
  userId: string;
  username: string;
  displayName: string | null;
  roles: string[];
};

function errorMessage(status: number) {
  if (status === 401) return "Sign in again to manage producer access.";
  if (status === 403) return "Admin access is required.";
  if (status === 404) return "That user is no longer available.";
  return "Could not update producer access. Try again.";
}

export default function AdminSection({ currentUserId }: { currentUserId: string }) {
  const { getAccessToken } = usePrivy();
  const { refreshUser } = useAuth();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<ListedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async (search: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("AUTH_REQUIRED");
      const response = await fetch(`/api/admin/users?query=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(errorMessage(response.status));
      const body = await response.json() as { users: ListedUser[] };
      setUsers(body.users);
    } catch (cause) {
      setError(cause instanceof Error && cause.message !== "AUTH_REQUIRED" ? cause.message : "Sign in again to manage producer access.");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => { void loadUsers(""); }, [loadUsers]);

  async function changeProducer(user: ListedUser) {
    const producer = user.roles.includes("producer");
    setBusyUserId(user.userId);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("AUTH_REQUIRED");
      const response = await fetch(`/api/admin/users/${user.userId}/producer`, {
        method: producer ? "DELETE" : "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(errorMessage(response.status));
      setUsers((current) => current.map((item) => item.userId === user.userId
        ? { ...item, roles: producer ? item.roles.filter((role) => role !== "producer") : [...item.roles, "producer"] }
        : item));
      if (user.userId === currentUserId) await refreshUser();
    } catch (cause) {
      setError(cause instanceof Error && cause.message !== "AUTH_REQUIRED" ? cause.message : "Sign in again to manage producer access.");
    } finally {
      setBusyUserId(null);
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadUsers(query.trim());
  }

  return (
    <section className="space-y-4 border-t border-black pt-5" aria-label="Admin">
      <h2>Admin</h2>
      <div className="space-y-2">
        <h3>Producer access</h3>
        <form onSubmit={submitSearch} className="flex flex-wrap gap-2">
          <input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={80} placeholder="Search username or display name" className="min-w-0 flex-1 border px-2 py-1" />
          <button type="submit" className="border px-3 py-1">Search</button>
        </form>
        {error ? <p role="alert">{error}</p> : null}
        {loading ? <p>Loading users...</p> : users.length === 0 ? <p>No users found.</p> : (
          <ul className="space-y-2">
            {users.map((user) => {
              const producer = user.roles.includes("producer");
              return (
                <li key={user.userId} className="flex flex-wrap items-center justify-between gap-3 border p-3">
                  <div>
                    <p>{user.displayName || `@${user.username}`}</p>
                    {user.displayName ? <p className="text-xs">@{user.username}</p> : null}
                    <p className="text-xs">{producer ? "Producer access active" : "No producer access"}</p>
                  </div>
                  <button type="button" disabled={busyUserId !== null} onClick={() => void changeProducer(user)} className="border px-3 py-1 text-sm">
                    {busyUserId === user.userId ? "Saving..." : producer ? "Revoke producer" : "Grant producer"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
