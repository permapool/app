// @vitest-environment jsdom

import {
  StrictMode,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppUser } from "~/types/auth";

const privy = vi.hoisted(() => ({
  state: {
    ready: true,
    authenticated: true,
    user: { id: "privy-a" } as { id: string } | null,
  },
  getAccessToken: vi.fn(),
}));

vi.mock("@privy-io/react-auth", () => ({
  usePrivy: () => ({ ...privy.state, getAccessToken: privy.getAccessToken }),
}));

import { AuthProvider, useAuth } from "./AuthProvider";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

type PendingRequest = Deferred<Response> & { signal?: AbortSignal };

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function appUser(label: string): AppUser {
  return {
    userId: `database-${label}`,
    privyId: `privy-${label}`,
    email: `${label}@example.test`,
    username: label,
    displayName: label,
    hasCustomHandle: false,
    wallets: [],
    roles: [],
  };
}

function responseFor(user: AppUser) {
  return new Response(JSON.stringify(user), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function Probe({
  onState,
  onLayoutCommit,
}: {
  onState?: (value: string) => void;
  onLayoutCommit?: (value: string) => void;
}) {
  const { user, loading, refreshUser } = useAuth();
  const [result, setResult] = useState("idle");
  const value = `${user?.username ?? "none"}:${loading ? "loading" : "ready"}`;

  useEffect(() => {
    onState?.(value);
  }, [onState, value]);

  useLayoutEffect(() => {
    onLayoutCommit?.(value);
  }, [onLayoutCommit, value]);

  return (
    <div>
      <output aria-label="auth state">{value}</output>
      <output aria-label="refresh result">{result}</output>
      <button
        type="button"
        onClick={() => {
          setResult("pending");
          void refreshUser().then(
            () => setResult("done"),
            (error: unknown) =>
              setResult(error instanceof Error ? error.message : "unknown failure"),
          );
        }}
      >
        Refresh
      </button>
    </div>
  );
}

function wrapper(children: ReactNode, strict = false) {
  const content = <AuthProvider>{children}</AuthProvider>;
  return strict ? <StrictMode>{content}</StrictMode> : content;
}

describe("AuthProvider request lifecycle", () => {
  let requests: PendingRequest[];

  beforeEach(() => {
    requests = [];
    privy.state.ready = true;
    privy.state.authenticated = true;
    privy.state.user = { id: "privy-a" };
    privy.getAccessToken.mockReset().mockResolvedValue("access-token");
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        const request = deferred<Response>() as PendingRequest;
        request.signal = init?.signal as AbortSignal | undefined;
        requests.push(request);
        return request.promise;
      }),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  async function waitForRequests(count: number) {
    await waitFor(() => expect(requests).toHaveLength(count));
  }

  async function resolveRequest(index: number, user: AppUser) {
    await act(async () => requests[index].resolve(responseFor(user)));
  }

  it("synchronizes the initial authenticated session", async () => {
    render(wrapper(<Probe />));
    await waitForRequests(1);
    expect(requests[0].signal).toBeInstanceOf(AbortSignal);

    await resolveRequest(0, appUser("alice"));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("alice:ready");
  });

  it("aborts on unmount and cannot commit a later completion", async () => {
    const states: string[] = [];
    const view = render(wrapper(<Probe onState={(state) => states.push(state)} />));
    await waitForRequests(1);
    const stateCount = states.length;

    view.unmount();
    expect(requests[0].signal?.aborted).toBe(true);
    await act(async () => requests[0].resolve(responseFor(appUser("stale"))));
    expect(states).toHaveLength(stateCount);
  });

  it("leaves only the current Strict Mode synchronization able to commit", async () => {
    render(wrapper(<Probe />, true));
    await waitForRequests(1);
    expect(privy.getAccessToken).toHaveBeenCalledTimes(2);

    await resolveRequest(0, appUser("strict-current"));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("strict-current:ready");
  });

  it("prevents an older manual request from overwriting a newer result", async () => {
    render(wrapper(<Probe />));
    await waitForRequests(1);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitForRequests(2);
    expect(requests[0].signal?.aborted).toBe(true);

    await resolveRequest(1, appUser("newer"));
    await resolveRequest(0, appUser("older"));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("newer:ready");
  });

  it("clears logout state immediately and rejects the previous session commit", async () => {
    const view = render(wrapper(<Probe />));
    await waitForRequests(1);
    await resolveRequest(0, appUser("alice"));

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitForRequests(2);
    privy.state.authenticated = false;
    privy.state.user = null;
    view.rerender(wrapper(<Probe />));

    expect(screen.getByLabelText("auth state")).toHaveTextContent("none:ready");
    expect(requests[1].signal?.aborted).toBe(true);
    await resolveRequest(1, appUser("restored-stale"));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("none:ready");
  });

  it("synchronizes a new login after logout", async () => {
    privy.state.authenticated = false;
    privy.state.user = null;
    const view = render(wrapper(<Probe />));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("none:ready");

    privy.state.authenticated = true;
    privy.state.user = { id: "privy-b" };
    view.rerender(wrapper(<Probe />));
    await waitForRequests(1);
    await resolveRequest(0, appUser("bob"));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("bob:ready");
  });

  it("prevents a previous authenticated user from committing after identity changes", async () => {
    const view = render(wrapper(<Probe />));
    await waitForRequests(1);

    privy.state.user = { id: "privy-b" };
    view.rerender(wrapper(<Probe />));
    await waitForRequests(2);
    expect(requests[0].signal?.aborted).toBe(true);

    await resolveRequest(1, appUser("bob"));
    await resolveRequest(0, appUser("alice"));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("bob:ready");
  });

  it("invalidates identity A during the B commit before passive cleanup", async () => {
    const states: string[] = [];
    let resolveAOnCommit = false;
    const onLayoutCommit = (state: string) => {
      states.push(state);
      if (resolveAOnCommit) {
        resolveAOnCommit = false;
        requests[0].resolve(responseFor(appUser("alice")));
      }
    };
    const view = render(wrapper(<Probe onLayoutCommit={onLayoutCommit} />));
    await waitForRequests(1);

    resolveAOnCommit = true;
    privy.state.user = { id: "privy-b" };
    view.rerender(wrapper(<Probe onLayoutCommit={onLayoutCommit} />));
    await waitForRequests(2);

    expect(requests[0].signal?.aborted).toBe(true);
    expect(states).not.toContain("alice:ready");
    expect(screen.getByLabelText("auth state")).toHaveTextContent("none:loading");

    await resolveRequest(1, appUser("bob"));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("bob:ready");
  });

  it("hides already committed state while a different identity synchronizes", async () => {
    const view = render(wrapper(<Probe />));
    await waitForRequests(1);
    await resolveRequest(0, appUser("alice"));

    privy.state.user = { id: "privy-b" };
    view.rerender(wrapper(<Probe />));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("none:loading");

    await waitForRequests(2);
    await resolveRequest(1, appUser("bob"));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("bob:ready");
  });

  it("does not surface an aborted request as a failure", async () => {
    const view = render(wrapper(<Probe />));
    await waitForRequests(1);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitForRequests(2);

    privy.state.authenticated = false;
    privy.state.user = null;
    view.rerender(wrapper(<Probe />));
    await act(async () => requests[1].reject(new DOMException("Aborted", "AbortError")));
    expect(screen.getByLabelText("refresh result")).toHaveTextContent("done");
  });

  it("invalidates a deferred request during the logout commit", async () => {
    const states: string[] = [];
    let resolveOnLogout = false;
    const onLayoutCommit = (state: string) => {
      states.push(state);
      if (resolveOnLogout) {
        resolveOnLogout = false;
        requests[0].resolve(responseFor(appUser("alice")));
      }
    };
    const view = render(wrapper(<Probe onLayoutCommit={onLayoutCommit} />));
    await waitForRequests(1);

    resolveOnLogout = true;
    privy.state.authenticated = false;
    privy.state.user = null;
    view.rerender(wrapper(<Probe onLayoutCommit={onLayoutCommit} />));

    expect(requests[0].signal?.aborted).toBe(true);
    expect(states).not.toContain("alice:ready");
    expect(screen.getByLabelText("auth state")).toHaveTextContent("none:ready");
  });

  it("hides the user while not ready and resynchronizes when readiness returns", async () => {
    const view = render(wrapper(<Probe />));
    await waitForRequests(1);
    await resolveRequest(0, appUser("alice"));

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitForRequests(2);
    privy.state.ready = false;
    view.rerender(wrapper(<Probe />));

    expect(requests[1].signal?.aborted).toBe(true);
    expect(screen.getByLabelText("auth state")).toHaveTextContent("none:loading");
    await resolveRequest(1, appUser("stale"));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("none:loading");

    privy.state.ready = true;
    view.rerender(wrapper(<Probe />));
    await waitForRequests(3);
    await resolveRequest(2, appUser("current"));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("current:ready");
  });

  it("settles logged out when readiness loss is followed by logout", async () => {
    const view = render(wrapper(<Probe />));
    await waitForRequests(1);

    privy.state.ready = false;
    view.rerender(wrapper(<Probe />));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("none:loading");

    privy.state.authenticated = false;
    privy.state.user = null;
    view.rerender(wrapper(<Probe />));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("none:loading");

    privy.state.ready = true;
    view.rerender(wrapper(<Probe />));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("none:ready");
    expect(requests).toHaveLength(1);
  });

  it("binds a manual refresh to the currently committed identity", async () => {
    const view = render(wrapper(<Probe />));
    await waitForRequests(1);
    await resolveRequest(0, appUser("alice"));

    privy.state.user = { id: "privy-b" };
    view.rerender(wrapper(<Probe />));
    await waitForRequests(2);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitForRequests(3);

    expect(requests[1].signal?.aborted).toBe(true);
    await resolveRequest(1, appUser("wrong-b"));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("none:loading");
    await resolveRequest(2, appUser("bob"));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("bob:ready");
  });

  it("preserves the stable generic error for a current real failure", async () => {
    render(wrapper(<Probe />));
    await waitForRequests(1);
    await resolveRequest(0, appUser("alice"));

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitForRequests(2);
    await act(async () => requests[1].reject(new Error("raw provider detail")));

    expect(screen.getByLabelText("refresh result")).toHaveTextContent(
      "Failed to load current user",
    );
    expect(screen.getByLabelText("refresh result")).not.toHaveTextContent(
      "raw provider detail",
    );
  });

  it("lets only the current request clear loading", async () => {
    render(wrapper(<Probe />));
    await waitForRequests(1);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitForRequests(2);

    await resolveRequest(0, appUser("stale"));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("none:loading");
    await resolveRequest(1, appUser("current"));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("current:ready");
  });
});
