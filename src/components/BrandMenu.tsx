"use client";

import { useState, useRef, useEffect } from "react";

interface BrandMenuProps {
  children: React.ReactNode;
}

export default function BrandMenu({ children }: BrandMenuProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuVisible(false);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.pageX, y: e.pageY });
    setMenuVisible(true);
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMenuVisible(false);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  /* const downloadAssets = async () => {
    try {
      const zipUrl = "/brand-assets.zip";
      const response = await fetch(zipUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "HIGHER_ZIP_Brand_Assets.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setMenuVisible(false);
    } catch (err) {
      console.error("Error downloading brand assets:", err);
    }
  }; */

  const stampSVG = `<?xml version="1.0" encoding="UTF-8"?><svg id="b" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 955.18 306.97"><defs><style>.d{fill:#010101;}</style></defs><g id="c"><path class="d" d="M463.36,306.97c-21.96,0-39.83-17.87-39.83-39.83s17.87-39.83,39.83-39.83,39.83,17.87,39.83,39.83-17.87,39.83-39.83,39.83Z"/><path class="d" d="M955.18,0H403.55l-28.64,104.11h-191.94c9.57-34.73,19.1-69.42,28.67-104.11h-127.78L0,304.78h127.78c9.53-34.69,19.1-69.38,28.64-104.11h191.94c-9.53,34.69-19.1,69.38-28.64,104.11h90.91c-7.6-10.62-12.1-23.61-12.1-37.64,0-35.75,29.08-64.83,64.83-64.83,4.2,0,8.3.42,12.28,1.18,9.81-35.64,19.6-71.28,29.41-106.92h215.82c-79.86,36.09-159.76,72.18-239.63,108.27,27.07,7.79,46.94,32.76,46.94,62.3,0,14.03-4.49,27.02-12.1,37.64h355.25c10.66-38.75,15.99-58.11,26.64-96.86h-223.62c84.75-37.12,169.5-74.24,254.25-111.36,10.62-38.64,15.95-57.93,26.57-96.57Z"/><path class="d" d="M503.19,267.14c0-22-17.83-39.83-39.83-39.83s-39.83,17.83-39.83,39.83c0,17.43,11.21,32.24,26.8,37.64h26.06c15.6-5.4,26.8-20.21,26.8-37.64Z"/></g></svg>`;
  const wordmarkSVG = `
  <?xml version="1.0" encoding="UTF-8"?><svg id="b" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 951.05 102.16"><defs><style>.d{fill:#010101;}</style></defs><g id="c"><path class="d" d="M42.8,66.51c-3.05,11.08-6.1,22.17-9.15,33.25H0C8.93,67.31,17.86,34.84,26.79,2.39h33.65c-3.05,11.08-6.1,22.17-9.15,33.25h50.55c3.05-11.08,6.1-22.17,9.15-33.25h33.72c-8.93,32.46-17.86,64.92-26.79,97.38h-33.72c3.05-11.08,6.1-22.17,9.15-33.25h-50.55Z"/><path class="d" d="M183.89,2.39c-8.93,32.46-17.86,64.92-26.79,97.38h-33.66c8.93-32.46,17.86-64.92,26.79-97.38h33.66Z"/><path class="d" d="M236,46.3h58.64c-5.12,18.62-10.25,37.24-15.37,55.86h-16.83c1-6.06,1.5-9.08,2.49-15.14-11.82,10.56-28.62,15.03-44.05,15.14-29.23.21-56.99-13.51-45.88-47.53.78-2.84,1.18-4.26,1.95-7.1C185.23,13.55,216.75-.02,248.99,0c23.75.02,53.92,9.06,47.6,39.2h-35.77c-1.22-3.26-3.71-5.43-7.37-6.59s-8.01-1.73-12.94-1.74c-12.83-.03-27.75,4.47-30.53,18.98-.27.96-.4,1.43-.65,2.39-4.51,14.27,8.45,19.11,20.08,18.98,9.71-.11,21.62-.47,29.12-8.26h-27.11c1.83-6.67,2.75-10,4.59-16.67h0Z"/><path class="d" d="M328.22,66.51c-3.05,11.08-6.1,22.17-9.15,33.25h-33.66c.87-3.17,1.75-6.34,2.62-9.52,8.06-29.29,16.12-58.58,24.18-87.86h33.66c-3.05,11.08-6.1,22.17-9.15,33.25h50.55c3.05-11.08,6.1-22.17,9.15-33.25h33.73c-8.93,32.46-17.86,64.92-26.79,97.38h-33.73c3.05-11.08,6.1-22.17,9.15-33.25h-50.55Z"/><path class="d" d="M435.54,2.53h101.04c-2.74,9.97-4.12,14.95-6.86,24.93h-67.38c-1.37,4.99-2.06,7.48-3.43,12.46h67.38c-2.48,9.02-3.72,13.52-6.2,22.54h-67.38c-1.37,4.99-2.06,7.48-3.43,12.46h67.38c-2.75,10-4.12,15-6.87,24.99h-101.04c8.93-32.46,17.86-64.92,26.79-97.38h0Z"/><path class="d" d="M625.27,2.47c19.67-1.41,26.96,21.39,22.5,36.81-2.08,7.2-5.59,13.99-10.69,19.92-5.03,5.86-10.82,10.36-17.28,13.33,3.76,9.1,7.54,18.2,11.3,27.32h-35.84c-3.89-9.5-5.83-14.26-9.71-23.76h-30.06c-2.62,9.51-3.93,14.26-6.54,23.76h-33.66c8.93-32.46,17.86-64.92,26.79-97.38h83.18ZM567.92,30.94c-1.83,6.64-2.74,9.96-4.57,16.59h41.05c2.06,0,4.01-.8,5.86-2.39,1.93-1.67,3.18-3.62,3.8-5.87,1.28-4.64-.99-8.33-5.09-8.33h-41.05Z"/><path class="d" d="M679.17,33.4c2.83-10.29,5.66-20.57,8.5-30.86h111.57c-2.83,10.29-5.66,20.57-8.5,30.86-22.9,11.86-45.79,23.71-68.68,35.57h58.9c-2.83,10.32-5.68,20.62-8.51,30.94h-111.57c2.83-10.32,5.68-20.62,8.51-30.94,22.22-11.86,44.42-23.71,66.64-35.57h-56.85Z"/><path class="d" d="M838.67,2.39c-8.93,32.46-17.86,64.92-26.79,97.38h-33.66c8.93-32.46,17.86-64.92,26.79-97.38h33.66Z"/><path class="d" d="M927.3,2.53c19.67-1.41,26.93,21.41,22.5,36.81-5.21,18.09-22.63,36.68-42.75,36.81h-49.51c-2.62,9.51-3.93,14.26-6.54,23.76h-33.65c8.93-32.46,17.86-64.92,26.79-97.38h83.17,0ZM906.49,47.6c1.99,0,3.94-.8,5.79-2.39,1.93-1.67,3.18-3.62,3.8-5.87.64-2.32.4-4.3-.57-5.87-.98-1.59-2.47-2.47-4.46-2.47h-41.1c-1.83,6.64-2.74,9.96-4.57,16.59,0,0,41.1,0,41.1,0Z"/><circle class="d" cx="644.56" cy="85.6" r="14.24"/></g></svg>
  `;

  return (
    <div
      className="relative w-full h-full"
      onContextMenu={handleContextMenu}
      style={{ display: "contents" }}
    >
      {children}

      {menuVisible && (
        <div
          ref={menuRef}
          className="absolute bg-white border border-black text-sm shadow-lg z-50 w-56 animate-fadeSlideUp"
          style={{
            top: position.y,
            left: position.x,
          }}
        >
          <button
            onClick={() => copyText(stampSVG)}
            className="block w-full text-left px-4 py-2 hover:bg-green-100"
          >
            Copy Stamp (SVG)
          </button>
          <button
            onClick={() => copyText(wordmarkSVG)}
            className="block w-full text-left px-4 py-2 hover:bg-green-100"
          >
            Copy Wordmark (SVG)
          </button>
          <button
            // onClick={downloadAssets}
            onClick={() => (window.location.href = "/style-guide")}
            className="block w-full text-left px-4 py-2 hover:bg-green-100"
          >
            View Style Guide
            {/* Download Brand Assets (ZIP) */}
          </button>
        </div>
      )}
    </div>
  );
}
