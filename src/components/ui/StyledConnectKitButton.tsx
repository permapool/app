import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DoorOpenIcon, UserCircleIcon } from "@phosphor-icons/react";
import { usePrivy } from "@privy-io/react-auth";
import { useAuth } from "~/components/providers/AuthProvider";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const StyledConnectKitButton = () => {
  const { user, loading } = useAuth();
  const { ready, authenticated, login, logout } = usePrivy();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const profileLabel =
    user?.username ??
    user?.email ??
    truncateAddress(user?.wallets[0]?.address ?? "");

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [menuOpen]);

  const handleClick = async () => {
    if (!authenticated) {
      login({ loginMethods: ["email", "wallet"] });
      return;
    }

    setMenuOpen(true);
  };

  return (
    <div
      ref={menuRef}
      className="relative"
      onMouseEnter={() => {
        if (authenticated) {
          setMenuOpen(true);
        }
      }}
      onMouseLeave={() => {
        if (authenticated) {
          setMenuOpen(false);
        }
      }}
    >
      <button
        type="button"
        className={`mx-2 flex h-8 w-8 items-center justify-center rounded-full border border-black p-0 transition-colors ${
          authenticated
            ? "bg-black text-[var(--background)] hover:bg-[var(--amber)] hover:text-black"
            : "bg-[var(--green)] text-[var(--background)] hover:bg-[var(--amber)] hover:text-black"
        } disabled:cursor-not-allowed disabled:bg-[var(--lghtgrey)] disabled:text-[var(--grey)]`}
        onClick={() => void handleClick()}
        onFocus={() => {
          if (authenticated) {
            setMenuOpen(true);
          }
        }}
        disabled={!ready}
        aria-label={
          !ready || loading
            ? "Loading account controls"
            : authenticated
              ? `Open account menu for ${profileLabel}`
              : "Log in"
        }
        title={
          authenticated
            ? profileLabel
            : !ready || loading
              ? "Loading"
              : "Login"
        }
      >
        {!ready || loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : authenticated ? (
          <UserCircleIcon size={15} weight="fill" />
        ) : (
          <DoorOpenIcon size={15} weight="bold" />
        )}
      </button>

      {authenticated && menuOpen ? (
        <div className="absolute right-0 mt-[-2px] z-50 p-2">
          <div className="min-w-32 bg-white border border-black">
            <Link
              href="/me"
              className="block px-3 py-2 text-xs uppercase bg-white text-black hover:bg-[green] hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              Profile
            </Link>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-xs uppercase bg-white text-black hover:bg-[green] hover:text-white"
              onClick={() => void logout()}
            >
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
