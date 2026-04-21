import type { ReactNode } from "react";

export default function PageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        border: "2px solid #c9a56a",
        borderRadius: 14,
        background: "rgba(0, 0, 0, 0.78)",
        padding: 24,
      }}
    >
      <h2
        style={{
          margin: "0 0 24px 0",
          color: "#f3efe6",
          fontFamily: "monospace",
          fontSize: 28,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}