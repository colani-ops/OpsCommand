import type { CSSProperties, ReactNode } from "react";

type MissionMetaBadgeProps = {
  children: ReactNode;
};

const badgeStyle: CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  border: "1px solid #444",
  background: "#1b1b1b",
  color: "#ddd",
};

export default function MissionMetaBadge({ children }: MissionMetaBadgeProps) {
  return <span style={badgeStyle}>{children}</span>;
}