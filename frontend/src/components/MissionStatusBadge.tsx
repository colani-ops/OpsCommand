import type { CSSProperties } from "react";
import type { MissionStatus } from "../api/missions";

type MissionStatusBadgeProps = {
  status: MissionStatus;
};

function getStatusBadgeStyle(status: MissionStatus): CSSProperties {
  const base: CSSProperties = {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid",
  };

  switch (status) {
    case "Prepared":
      return { ...base, background: "#2e2e2e", color: "#d6d6d6", borderColor: "#555" };
    case "Planned":
      return { ...base, background: "#1d3557", color: "#bde0fe", borderColor: "#457b9d" };
    case "Active":
      return { ...base, background: "#3a2a00", color: "#ffd166", borderColor: "#a36a00" };
    case "Completed":
      return { ...base, background: "#0d3b1e", color: "#7CFC98", borderColor: "#2a7a45" };
    case "Cancelled":
      return { ...base, background: "#3a0f0f", color: "#ff9b9b", borderColor: "#b04a4a" };
    default:
      return base;
  }
}

export default function MissionStatusBadge({ status }: MissionStatusBadgeProps) {
  const label = status === "Active" ? "In Progress" : status;
  return <span style={getStatusBadgeStyle(status)}>{label}</span>;
}