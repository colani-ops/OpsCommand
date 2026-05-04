import type { CSSProperties } from "react";

type LoadingScreenProps = {
  label?: string;
  minHeight?: number;
};

export default function LoadingScreen({
  label = "Loading...",
  minHeight = 180,
}: LoadingScreenProps) {
  return (
    <div
      style={{
        minHeight,
        display: "grid",
        placeItems: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "grid",
          justifyItems: "center",
          gap: 14,
          padding: "20px 24px",
        }}
      >
        <img
          src="/icons/loading.png"
          alt="Loading"
          style={spinnerStyle}
        />

        <div
          style={{
            color: "#f3efe6",
            fontFamily: "monospace",
            fontSize: 16,
            letterSpacing: 0.4,
            textAlign: "center",
            opacity: 0.94,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

const spinnerStyle: CSSProperties = {
  width: 52,
  height: 52,
  objectFit: "contain",
  display: "block",
  animation: "opscommand-spin 1.15s linear infinite",
  filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.28))",
};