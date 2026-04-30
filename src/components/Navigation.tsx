"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMinimize } from "./providers/MinimizeMenus";
import { useMute } from "./providers/MuteContext";
import Logo from "./ui/Logo";
import { useToggle } from "./providers/ToggleContext";

const BrandMenu = dynamic(() => import("./BrandMenu"));
const NavAuthButton = dynamic(
  () => import("./ui/NavAuthButton"),
  {
    loading: () => (
      <div className="w-full max-w-xs mx-auto block bg-[var(--lghtgrey)] text-black py-2 px-3 mx-2 text-xs uppercase opacity-60">
        Loading
      </div>
    ),
  },
);

export default function Navigation() {
  const { minimized } = useMinimize();
  const { isMuted, toggleMute } = useMute();
  const { toggleManifesto, togglePermapool, toggleSquad, toggleProposals } =
    useToggle();

  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  // 🕓 fade visibility logic
  const [visible, setVisible] = useState(true);
  const fadeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // fade-out delay (ms)
  const FADE_DELAY = 4000;

  const resetFadeTimer = () => {
    setVisible(true);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = setTimeout(() => setVisible(false), FADE_DELAY);
  };

  useEffect(() => {
    // start timer
    resetFadeTimer();

    // show again on mouse move
    const handleMouseMove = () => resetFadeTimer();

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  if (minimized) return null;

  return (
    <div
      className={`fixed z-[10030] mx-3 mb-3 mt-10 w-[98%] bg-white shadow-solid border border-[1px] border-black transition-opacity duration-700 md:mt-3 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
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

              <div className="group relative">
                <button
                  className="w-full max-w-xs mx-auto block bg-[orange] text-black py-2 px-3 transition-colors hover:bg-[green] hover:text-white m-2 text-xs uppercase"
                  onClick={togglePermapool}
                >
                  Permapool
                </button>

                <div className="pointer-events-none absolute right-0 z-50 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                  <div className="bg-white border border-black shadow-lg">
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
                </div>
              </div>

              <Link
                href="/missions"
                className="w-full max-w-xs mx-auto block text-center bg-black text-white py-2 px-3 transition-colors hover:bg-[green] hover:text-white m-2 text-xs uppercase"
              >
                Missions
              </Link>
              <Link
                href="/shop"
                className="w-full max-w-xs mx-auto block text-center bg-black text-white py-2 px-3 transition-colors hover:bg-[green] hover:text-white m-2 text-xs uppercase"
              >
                Shop
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
                href="/shop"
                className="w-full max-w-xs mx-auto block text-center bg-black text-white py-2 px-3 transition-colors hover:bg-[green] hover:text-white m-2 text-xs uppercase"
              >
                Shop
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

        <div className="flex items-center gap-2 md:gap-3 ml-2 md:ml-1">
          {isHome ? (
            <div className="md:hidden flex items-center">
              <button
                type="button"
                aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                aria-pressed={isMuted}
                onClick={toggleMute}
                className="bg-black text-white px-3 py-2 h-full flex items-center justify-center border border-black hover:bg-[green] transition-colors"
              >
                <Image
                  src={isMuted ? "/icons/sound-off.svg" : "/icons/sound-on.svg"}
                  alt=""
                  width={18}
                  height={18}
                  className="brightness-0 invert"
                />
              </button>
            </div>
          ) : null}
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

          <NavAuthButton />
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-nav-menu" role="menu" className="md:hidden px-2 pb-2">
          <div className="mt-2 grid grid-cols-1 gap-2">
            <Link
              href="/shop"
              role="menuitem"
              className="w-full text-center bg-black text-white py-2 px-3 text-xs uppercase hover:bg-[green] hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              Shop
            </Link>
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
