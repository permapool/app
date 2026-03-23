import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

  const label = (() => {
    if (!ready || loading) {
      return "LOADING";
    }

    if (!authenticated) {
      return "LOGIN";
    }

    return user?.username ?? user?.email ?? truncateAddress(user?.wallets[0]?.address ?? "");
  })();

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
        className="w-full max-w-xs mx-auto block bg-[var(--lghtgrey)] text-black py-2 px-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#7C65C1] hover:bg-[green] hover:text-white mx-2 text-xs uppercase"
        onClick={() => void handleClick()}
        onFocus={() => {
          if (authenticated) {
            setMenuOpen(true);
          }
        }}
        disabled={!ready}
      >
        <span className="relative z-20 bg-gradient-to-b from-[#252424] to-[#3C3C3C] bg-clip-text text-transparent hover:text-white">
          {label}
        </span>
      </button>

      {authenticated && menuOpen ? (
        <div className="absolute right-0 mt-[-2px] z-50 p-2">
          <div className="min-w-32 bg-white border border-black shadow-lg">
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
