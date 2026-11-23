"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePrivy } from "@privy-io/react-auth";

type SessionForm = {
  requestId: string;
  title: string;
  date: string;
  time: string;
  timezone: string;
  shortDescription: string;
  publicJoinUrl: string;
  showId: string;
};

type CreatedEpisode = {
  episodeId: string;
  path: string;
  state: string;
  scheduledStartAt: string;
  timezone: string;
};

type StoredDraft = { form: SessionForm; created: CreatedEpisode | null };
type ManagedShow = { id: string; title: string };
type ManagedEpisode = {
  id: string;
  slug: string;
  title: string;
  scheduledStartAt: string;
  timezone: string;
  state: string;
  show: { title: string } | null;
  path: string;
};

function newDraft(): StoredDraft {
  return {
    form: {
      requestId: crypto.randomUUID(),
      title: "",
      date: "",
      time: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      shortDescription: "",
      publicJoinUrl: "",
      showId: "",
    },
    created: null,
  };
}

function errorMessage(code: string | undefined, message?: string) {
  if (code === "VALIDATION_ERROR") return message || "Check the session details.";
  if (code === "AUTH_REQUIRED") return "Sign in again to host a session.";
  if (code === "FORBIDDEN") return "You do not have access to this Show.";
  if (code === "NOT_FOUND") return "That Show is no longer available.";
  if (code === "CONFLICT") return "This submission changed after it was created. Start a new session.";
  return "Unable to save the session. Try again.";
}

function localStart(episode: ManagedEpisode) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: episode.timezone,
    }).format(new Date(episode.scheduledStartAt));
  } catch {
    return episode.scheduledStartAt;
  }
}

export default function ProducerSection({ userId }: { userId: string }) {
  const { getAccessToken } = usePrivy();
  const [draft, setDraft] = useState<StoredDraft | null>(null);
  const [shows, setShows] = useState<ManagedShow[]>([]);
  const [episodes, setEpisodes] = useState<ManagedEpisode[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const storageKey = `higher:host-session:${userId}`;

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredDraft;
        if (parsed?.form?.requestId && typeof parsed.form.title === "string") {
          setDraft(parsed);
          return;
        }
      }
    } catch {
      // Private browsing or a stale draft should not prevent hosting.
    }

    setDraft(newDraft());
  }, [storageKey]);

  useEffect(() => {
    if (!draft) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {
      // The server-side request ID remains the authoritative retry key.
    }
  }, [draft, storageKey]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const token = await getAccessToken();
        if (!token) throw new Error("AUTH_REQUIRED");
        const response = await fetch("/api/me/sessions", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: controller.signal,
        });
        const body = (await response.json()) as {
          error?: string;
          shows?: ManagedShow[];
          episodes?: ManagedEpisode[];
        };
        if (!response.ok) throw new Error(body.error || "INTERNAL_ERROR");
        if (controller.signal.aborted) return;
        setShows(body.shows ?? []);
        setEpisodes(body.episodes ?? []);
        setListError(null);
      } catch (error) {
        if (controller.signal.aborted) return;
        setListError(errorMessage(error instanceof Error ? error.message : undefined));
      }
    }

    void load();
    return () => controller.abort();
  }, [getAccessToken, refresh]);

  function update(field: keyof SessionForm, value: string) {
    setDraft((current) => current && {
      ...current,
      form: { ...current.form, [field]: value },
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || submitting) return;
    setSubmitting(true);
    setFormError(null);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("AUTH_REQUIRED");
      const response = await fetch("/api/episodes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...draft.form,
          showId: draft.form.showId || null,
        }),
      });
      const body = (await response.json()) as CreatedEpisode & {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        setFormError(errorMessage(body.error, body.message));
        return;
      }

      const saved = { form: draft.form, created: body };
      setDraft(saved);
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(saved));
      } catch {
        // The created Episode is already durable on the server.
      }
      setRefresh((value) => value + 1);
    } catch (error) {
      setFormError(errorMessage(error instanceof Error ? error.message : undefined));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-5 border-t pt-6" aria-label="Producer">
      <h2>Producer</h2>

      <div className="space-y-3">
        <h3>Host a Session</h3>
        {draft?.created ? (
          <div role="status" className="space-y-2 border p-4">
            <p>Session scheduled.</p>
            <p>Canonical path: <code>{draft.created.path}</code></p>
            <p className="text-xs opacity-70">The session page is coming next.</p>
            <button type="button" className="border px-3 py-1" onClick={() => setDraft(newDraft())}>
              Host another session
            </button>
          </div>
        ) : draft ? (
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 sm:col-span-2">
              Title
              <input className="border px-2 py-1" required maxLength={120} value={draft.form.title} onChange={(event) => update("title", event.target.value)} />
            </label>
            <label className="grid gap-1">
              Date
              <input className="border px-2 py-1" type="date" required value={draft.form.date} onChange={(event) => update("date", event.target.value)} />
            </label>
            <label className="grid gap-1">
              Time
              <input className="border px-2 py-1" type="time" required value={draft.form.time} onChange={(event) => update("time", event.target.value)} />
            </label>
            <label className="grid gap-1 sm:col-span-2">
              Timezone (IANA)
              <input className="border px-2 py-1" required value={draft.form.timezone} onChange={(event) => update("timezone", event.target.value)} placeholder="America/New_York" />
            </label>
            <label className="grid gap-1 sm:col-span-2">
              Short description
              <textarea className="border px-2 py-1" required maxLength={500} value={draft.form.shortDescription} onChange={(event) => update("shortDescription", event.target.value)} />
            </label>
            <label className="grid gap-1 sm:col-span-2">
              Public join URL
              <input className="border px-2 py-1" type="url" required value={draft.form.publicJoinUrl} onChange={(event) => update("publicJoinUrl", event.target.value)} placeholder="https://" />
            </label>
            <label className="grid gap-1 sm:col-span-2">
              Show (optional)
              <select className="border px-2 py-1" value={draft.form.showId} onChange={(event) => update("showId", event.target.value)}>
                <option value="">Standalone session</option>
                {shows.map((show) => <option key={show.id} value={show.id}>{show.title}</option>)}
              </select>
            </label>
            {formError ? <p role="alert" className="sm:col-span-2">{formError}</p> : null}
            <button className="border px-3 py-1 sm:col-span-2" type="submit" disabled={submitting}>
              {submitting ? "Scheduling..." : "Schedule session"}
            </button>
          </form>
        ) : <p>Loading form...</p>}
      </div>

      <div className="space-y-2">
        <h3>Upcoming / assigned</h3>
        {listError ? <p role="alert">{listError}</p> : null}
        {!listError && episodes.length === 0 ? <p>No upcoming sessions yet.</p> : null}
        {episodes.length > 0 ? (
          <ul className="space-y-2">
            {episodes.map((episode) => (
              <li key={episode.id} className="border p-3 space-y-1">
                <div className="font-medium">{episode.title}</div>
                <div>{localStart(episode)} · {episode.timezone}</div>
                <div className="text-xs">{episode.state}{episode.show ? ` · ${episode.show.title}` : ""}</div>
                <code className="text-xs break-all">{episode.path}</code>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
