"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StyledConnectKitButton } from "./ui/StyledConnectKitButton";
import { useMinimize } from "./providers/MinimizeMenus";
import Logo from "./ui/Logo";
import { useToggle } from "./providers/ToggleContext";
import BrandMenu from "./BrandMenu";

export default function Navigation() {
  const { minimized } = useMinimize();
  const { toggleManifesto, togglePermapool, toggleSquad, toggleProposals } =
    useToggle();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const pathname = usePathname();
  const isHome = pathname === "/";

  if (minimized) return null;

  return (
    <div className="fixed z-50 m-3 w-[98%] bg-white shadow-solid border border-[1px] border-black">
      <div className="flex items-center justify-between px-2">
        <BrandMenu>
          <div className="flex items-center flex-grow">
            <Link href="/">
              <Logo />
            </Link>
          </div>
        </BrandMenu>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-2 relative">
          {isHome ? (
            <>
              <button
                className="w-full max-w-xs mx-auto block bg-[var(--lghtgrey)] text-black py-2 px-3 transition-colors hover:bg-[green] hover:text-white m-2 text-xs uppercase"
                onClick={toggleManifesto}
              >
                Manifesto
              </button>

              <div
                className="relative"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <button
                  className="w-full max-w-xs mx-auto block bg-[orange] text-black py-2 px-3 transition-colors hover:bg-[green] hover:text-white m-2 text-xs uppercase"
                  onClick={togglePermapool}
                >
                  Permapool
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-[-2px] bg-white border border-black shadow-lg z-50 p-2">
                    <button
                      className="block w-full text-left px-3 py-2 text-xs uppercase bg-white text-black hover:bg-[green] hover:text-white"
                      onClick={toggleSquad}
                    >
                      Squad
                    </button>
                    <button
                      className="block w-full text-left px-3 py-2 text-xs uppercase bg-white text-black hover:bg-[green] hover:text-white"
                      onClick={toggleProposals}
                    >
                      Proposals
                    </button>
                  </div>
                )}
              </div>

              <Link
                href="/missions"
                className="w-full max-w-xs mx-auto block text-center bg-black text-white py-2 px-3 transition-colors hover:bg-[green] hover:text-white m-2 text-xs uppercase"
              >
                Missions
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="w-full max-w-xs mx-auto block text-center bg-[orange] text-black py-2 px-3 transition-colors hover:bg-[green] hover:text-white m-2 text-xs uppercase"
              >
                ←
              </Link>
              <Link
                href="/missions"
                className="w-full max-w-xs mx-auto block text-center bg-black text-white py-2 px-3 transition-colors hover:bg-[green] hover:text-white m-2 text-xs uppercase"
              >
                Missions
              </Link>
              <Link
                href="/next"
                className="w-full max-w-xs mx-auto block text-center bg-black text-white py-2 px-3 transition-colors hover:bg-[green] hover:text-white m-2 text-xs uppercase"
              >
                Next
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-6 ml-2 md:ml-10">
          <div className="md:hidden">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="bg-black text-white text-xs uppercase px-3 py-2 h-full flex items-center"
            >
              Menu
            </button>
          </div>

          <StyledConnectKitButton />
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-nav-menu" role="menu" className="md:hidden px-2 pb-2">
          <div className="mt-2 grid grid-cols-1 gap-2">
            <button
              role="menuitem"
              className="w-full bg-[var(--lghtgrey)] text-black py-2 px-3 text-xs uppercase hover:bg-[green] hover:text-white"
              onClick={() => {
                toggleManifesto();
                setMobileOpen(false);
              }}
            >
              Manifesto
            </button>
            <button
              role="menuitem"
              className="w-full bg-[orange] text-black py-2 px-3 text-xs uppercase hover:bg-[green] hover:text-white"
              onClick={() => {
                togglePermapool();
                setMobileOpen(false);
              }}
            >
              Permapool
            </button>
            <Link
              href="/missions"
              role="menuitem"
              className="w-full text-center bg-black text-white py-2 px-3 text-xs uppercase hover:bg-[green] hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              Missions
            </Link>
            <button
              role="menuitem"
              className="w-full bg-[var(--lghtgrey)] text-black py-2 px-3 text-xs uppercase hover:bg-[green] hover:text-white"
              onClick={() => {
                toggleSquad();
                setMobileOpen(false);
              }}
            >
              Squad
            </button>
            <button
              role="menuitem"
              className="w-full bg-[var(--lghtgrey)] text-black py-2 px-3 text-xs uppercase hover:bg-[green] hover:text-white"
              onClick={() => {
                toggleProposals();
                setMobileOpen(false);
              }}
            >
              Proposals
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
