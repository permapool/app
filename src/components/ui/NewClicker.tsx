"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  SyntheticEvent,
} from "react";
import { Menu, MenuItem } from "@spaceymonk/react-radial-menu";
import { motion, PanInfo } from "framer-motion";
import Image from "next/image";

export type ClickerProps = {
  switchChannelUp: () => void;
  switchChannelDown: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  className?: string;
};

const DEFAULT_POSITION = { x: 0, y: 0 }; // moved outside to avoid recreation on every render

export default function NewClicker({
  switchChannelUp,
  switchChannelDown,
  isMuted,
  toggleMute,
  className,
}: ClickerProps) {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState(DEFAULT_POSITION);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const outerRadius = 80;

  // button center
  const updateMenuCenter = useCallback(() => {
    const wrapper = containerRef.current;
    const btn = buttonRef.current;
    if (!wrapper || !btn) return;

    const wRect = wrapper.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();

    const cx = bRect.left - wRect.left + bRect.width / 2;
    const cy = bRect.top - wRect.top + bRect.height / 2;
    setCenter({ x: cx, y: cy });
  }, []);

  const toggleMenu = () => {
    updateMenuCenter();
    setExpanded((prev) => !prev);
    setTimeout(() => setShow((prev) => !prev), 150);
  };

  const closeMenu = () => {
    setShow(false);
    setExpanded(false);
  };

  // closes menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };
    if (show) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show]);

  // update center on resize
  useEffect(() => {
    updateMenuCenter();
    const onResize = () => updateMenuCenter();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateMenuCenter, show]);

  // menu item click (typed)
  const handleItemClick = (
    _e: SyntheticEvent,
    _index: number,
    data: string
  ) => {
    switch (data) {
      case "ch+":
        switchChannelUp();
        break;
      case "ch-":
        switchChannelDown();
        break;
      case "mute":
        toggleMute();
        break;
      case "pip": {
        const video = document.getElementById(
          "jumbotron"
        ) as HTMLVideoElement | null;
        if (video && typeof video.requestPictureInPicture === "function") {
          video.requestPictureInPicture().catch((err: unknown) => {
            console.error("Failed to enter Picture-in-Picture mode:", err);
          });
        }
        break;
      }
      default:
        console.log(`[MenuItem] ${data} clicked`);
    }

    const itemsThatCloseMenu = ["pip"];
    if (itemsThatCloseMenu.includes(data)) closeMenu();
  };

  // drag persistence
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setPosition((prev) => {
      const newPos = { x: prev.x + info.offset.x, y: prev.y + info.offset.y };
      localStorage.setItem("clickerPosition", JSON.stringify(newPos));
      return newPos;
    });
    setTimeout(updateMenuCenter, 50);
  };

  // load position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("clickerPosition");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPosition(parsed);
        }
      } catch (e) {
        console.error("Invalid saved clicker position:", e);
      }
    }
  }, []);

  // "h" resets to home
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "h") {
        setPosition(DEFAULT_POSITION);
        localStorage.removeItem("clickerPosition");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // mobile idle reset
  useEffect(() => {
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (!isMobile) return;

    const resetIdleTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        setPosition(DEFAULT_POSITION);
        localStorage.removeItem("clickerPosition");
      }, 15000); // 15s idle timeout
    };

    window.addEventListener("touchstart", resetIdleTimer);
    window.addEventListener("touchmove", resetIdleTimer);
    resetIdleTimer(); // initialize timer

    return () => {
      window.removeEventListener("touchstart", resetIdleTimer);
      window.removeEventListener("touchmove", resetIdleTimer);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  return (
    <>
      {show && (
        <div
          className="fixed inset-0 z-[9998] bg-transparent"
          onClick={closeMenu}
        />
      )}

      <motion.div
        ref={containerRef}
        drag
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={{ x: position.x, y: position.y }}
        transition={{ type: "spring", stiffness: 250, damping: 25 }}
        className={`fixed z-[9999] top-1/2 right-[3.85em] -translate-y-1/2 flex flex-col items-center ${
          className ?? ""
        }`}
      >
        {/* radial menu */}
        {show && (
          <div className="absolute z-[10002] pointer-events-auto inset-0">
            <Menu
              centerX={center.x}
              centerY={center.y}
              innerRadius={20}
              outerRadius={outerRadius}
              show={show}
              animation={["fade", "scale"]}
              animationTimeout={200}
              drawBackground
            >
              <MenuItem onItemClick={handleItemClick} data="ch-">
                CH -
              </MenuItem>
              <MenuItem onItemClick={handleItemClick} data="pip">
                ◲
              </MenuItem>
              <MenuItem onItemClick={handleItemClick} data="mute">
                <Image
                  src={isMuted ? "/icons/sound-off.svg" : "/icons/sound-on.svg"}
                  alt={isMuted ? "Unmute" : "Mute"}
                  width={15}
                  height={15}
                />
              </MenuItem>
              <MenuItem onItemClick={handleItemClick} data="ch+">
                CH +
              </MenuItem>
            </Menu>
          </div>
        )}

        {/* toggle button */}
        <motion.div
          className="relative z-[10003] pointer-events-auto flex items-center justify-center"
          animate={{
            scale: expanded ? 0.8 : 1,
            rotate: expanded ? 360 : 0,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 35 }}
        >
          <button
            ref={buttonRef}
            onClick={toggleMenu}
            className="text-white w-14 aspect-square rounded-full flex items-center justify-center text-lg font-semibold bg-green-600 hover:bg-[var(--amber)] transition-all duration-100 shadow-md select-none touch-manipulation"
          >
            ↑
          </button>
        </motion.div>
      </motion.div>
    </>
  );
}
