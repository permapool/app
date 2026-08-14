// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import React, { StrictMode, useEffect } from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const lifecycle = vi.hoisted(() => ({
  activePrivyProviders: 0,
  privyMounts: 0,
  privyUnmounts: 0,
  configs: [] as unknown[],
}));

vi.mock("@privy-io/react-auth", () => ({
  PrivyProvider: ({
    children,
    config,
  }: {
    children: React.ReactNode;
    config: unknown;
  }) => {
    useEffect(() => {
      lifecycle.activePrivyProviders += 1;
      lifecycle.privyMounts += 1;

      return () => {
        lifecycle.activePrivyProviders -= 1;
        lifecycle.privyUnmounts += 1;
      };
    }, []);

    lifecycle.configs.push(config);
    return <div data-provider="privy">{children}</div>;
  },
  usePrivy: () => ({
    getAccessToken: vi.fn(),
    linkWallet: vi.fn(),
  }),
}));

vi.mock("~/components/providers/WagmiProvider", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-provider="wagmi">{children}</div>
  ),
}));

vi.mock("~/components/providers/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-provider="auth">{children}</div>
  ),
  useAuth: () => ({ loading: false, user: null }),
}));

vi.mock("~/components/providers/MinimizeMenus", () => ({
  MinimizeMenusProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("~/components/providers/MuteContext", () => ({
  MuteProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("~/components/providers/ToggleContext", () => ({
  ToggleProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("~/components/ui/StyledConnectKitButton", () => ({
  StyledConnectKitButton: () => <button type="button">Account</button>,
}));
vi.mock("~/app/Room", () => ({
  Room: ({ children }: { children: React.ReactNode }) => <div data-testid="room">{children}</div>,
}));
vi.mock("~/components/HomeInitialLoader", () => ({
  default: () => <div data-testid="home-loader" />,
}));
vi.mock("next/dynamic", () => ({
  default: () => function DynamicComponent() {
    return <div data-testid="dynamic-component" />;
  },
}));

import Client from "./client";
import HomePageClient from "./HomePageClient";
import MePage from "./me/page";
import { privyConfig } from "~/components/providers/PrivyAuthProvider";
import NavAuthButton from "~/components/ui/NavAuthButton";

const source = (relativePath: string) =>
  readFileSync(resolve(import.meta.dirname, relativePath), "utf8");

describe("application-wide Privy provider composition", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_PRIVY_APP_ID = "public-test-app-id";
    lifecycle.activePrivyProviders = 0;
    lifecycle.privyMounts = 0;
    lifecycle.privyUnmounts = 0;
    lifecycle.configs.length = 0;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  });

  it("mounts one correctly ordered provider tree around navigation and routed content", () => {
    const { container } = render(
      <Client>
        <div data-testid="route-content" />
      </Client>,
    );

    const privy = container.querySelector<HTMLElement>('[data-provider="privy"]');
    const wagmi = container.querySelector<HTMLElement>('[data-provider="wagmi"]');
    const auth = container.querySelector<HTMLElement>('[data-provider="auth"]');

    expect(container.querySelectorAll('[data-provider="privy"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-provider="wagmi"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-provider="auth"]')).toHaveLength(1);
    expect(privy).toContainElement(wagmi);
    expect(wagmi).toContainElement(auth);
    expect(auth).toContainElement(screen.getByTestId("dynamic-component"));
    expect(auth).toContainElement(screen.getByTestId("route-content"));
  });

  it("keeps the root provider mounted across route-content changes and Strict Mode replay", () => {
    const { rerender, unmount } = render(
      <StrictMode>
        <Client>
          <div data-testid="route-a" />
        </Client>
      </StrictMode>,
    );

    expect(lifecycle.activePrivyProviders).toBe(1);
    const mountsAfterStrictModeReplay = lifecycle.privyMounts;
    const unmountsAfterStrictModeReplay = lifecycle.privyUnmounts;

    rerender(
      <StrictMode>
        <Client>
          <div data-testid="route-b" />
        </Client>
      </StrictMode>,
    );

    expect(screen.getByTestId("route-b")).toBeInTheDocument();
    expect(lifecycle.activePrivyProviders).toBe(1);
    expect(lifecycle.privyMounts).toBe(mountsAfterStrictModeReplay);
    expect(lifecycle.privyUnmounts).toBe(unmountsAfterStrictModeReplay);
    expect(new Set(lifecycle.configs)).toEqual(new Set([privyConfig]));

    unmount();
    expect(lifecycle.activePrivyProviders).toBe(0);
  });

  it("preserves the reviewed Privy wallet and network configuration", () => {
    expect(privyConfig.loginMethods).toEqual(["email", "wallet"]);
    expect(privyConfig.appearance).toMatchObject({
      showWalletLoginFirst: false,
      walletChainType: "ethereum-only",
    });
    expect(privyConfig.embeddedWallets?.ethereum?.createOnLogin).toBe("off");
    expect(privyConfig.defaultChain?.id).toBe(8453);
    expect(privyConfig.supportedChains?.map(({ id }) => id)).toEqual([8453]);
  });

  it("leaves navigation, homepage, and profile consumers free of local provider roots", () => {
    render(<NavAuthButton />);
    expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();

    const { unmount } = render(<HomePageClient />);
    expect(screen.getByTestId("room")).toBeInTheDocument();
    unmount();

    render(<MePage />);
    expect(screen.getByText("Not authenticated")).toBeInTheDocument();

    for (const relativePath of [
      "HomePageClient.tsx",
      "me/page.tsx",
      "../components/ui/NavAuthButton.tsx",
    ]) {
      const contents = source(relativePath);
      expect(contents).not.toContain("PrivyAuthProvider");
      expect(contents).not.toContain("<PrivyProvider");
      expect(contents).not.toContain("<WagmiProvider");
      expect(contents).not.toContain("<AuthProvider");
    }

    const rootContents = source("client.tsx");
    expect(rootContents.match(/<PrivyAuthProvider>/g)).toHaveLength(1);
    expect(rootContents).not.toMatch(/<PrivyAuthProvider[^>]*\bkey=/);
  });
});
