import { ImageResponse } from "next/og";

export const alt = "HIGHER.ZIP";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#050505",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#fffff8",
            border: "4px solid rgba(255, 255, 248, 0.86)",
            borderRadius: 78,
            boxShadow:
              "0 0 22px rgba(255, 255, 248, 0.95), 0 0 54px rgba(255, 255, 248, 0.76), 0 0 104px rgba(255, 255, 248, 0.44)",
            display: "flex",
            height: 284,
            justifyContent: "center",
            width: 520,
          }}
        >
          <svg
            aria-hidden="true"
            height="118"
            viewBox="0 0 256 256"
            width="118"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="128"
              cy="128"
              fill="none"
              r="92"
              stroke="#018A08"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="18"
            />
            <line
              x1="160"
              x2="96"
              y1="96"
              y2="160"
              stroke="#018A08"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="18"
            />
            <polyline
              fill="none"
              points="112 96 160 96 160 144"
              stroke="#018A08"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="18"
            />
          </svg>
        </div>
      </div>
    ),
    size,
  );
}
