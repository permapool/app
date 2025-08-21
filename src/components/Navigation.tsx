"use client";
import React, { useState } from "react";
import Link from "next/link";
import { StyledConnectKitButton } from "./ui/StyledConnectKitButton";
import { useMinimize } from "./providers/MinimizeMenus";
import Logo from "./ui/Logo";
import { useToggle } from "./providers/ToggleContext";

export default function Navigation() {
  const { minimized } = useMinimize();
  const { toggleManifesto, togglePermapool, toggleSquad, toggleProposals } =
    useToggle();

  const [mobileOpen, setMobileOpen] = useState(false);

  if (minimized) return null;

  return (
    <div className="fixed z-50 m-3 w-[98%] bg-white shadow-solid border border-[1px] border-black">
      <div className="flex items-center justify-between px-2">
        {/* Left: Logo */}
        <div className="flex items-center flex-grow">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <button
            className="w-full max-w-xs mx-auto block bg-[var(--lghtgrey)] text-black py-2 px-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[green] hover:text-white m-2 text-xs uppercase"
            onClick={toggleManifesto}
          >
            Manifesto
          </button>
          <button
            className="w-full max-w-xs mx-auto block bg-[orange] text-black py-2 px-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[green] hover:text-white m-2 text-xs uppercase"
            onClick={togglePermapool}
          >
            Permapool
          </button>
          <button
            className="w-full max-w-xs mx-auto block bg-black text-white py-2 px-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[green] hover:text-white m-2 text-xs uppercase"
            onClick={toggleSquad}
          >
            Squad
          </button>
          <button
            className="w-full max-w-xs mx-auto block bg-[var(--lghtgrey)] text-black py-2 px-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[green] hover:text-white m-2 text-xs uppercase"
            onClick={toggleProposals}
          >
            Proposals
          </button>
        </div>

        {/* Right: Connect button & Mobile Menu */}
        <div className="flex items-center gap-2 md:gap-6 ml-2 md:ml-10">
          {/* Mobile menu trigger (now left of login button) */}
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

          {/* Connect/Login button */}
          <StyledConnectKitButton />
        </div>
      </div>

      {/* Mobile dropdown */}
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
            <button
              role="menuitem"
              className="w-full bg-black text-white py-2 px-3 text-xs uppercase hover:bg-[green] hover:text-white"
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
