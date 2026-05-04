type OutcomeBadgeVariant = "success" | "failure" | "neutral" | "warning";

type OutcomeBadgeProps = {
  label: string;
  variant?: OutcomeBadgeVariant;
};

export default function OutcomeBadge({
  label,
  variant = "neutral",
}: OutcomeBadgeProps) {
  const styles = getVariantStyle(variant);

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 700,
        fontFamily: "monospace",
        border: styles.border,
        background: "rgba(20,20,20,0.78)",
        color: styles.color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {label}
    </span>
  );
}

function getVariantStyle(variant: OutcomeBadgeVariant) {
  switch (variant) {
    case "success":
      return {
        border: "1px solid rgba(90,170,110,0.45)",
        color: "#7ee08f",
      };
    case "failure":
      return {
        border: "1px solid rgba(195,95,95,0.45)",
        color: "#ff9a9a",
      };
    case "warning":
      return {
        border: "1px solid rgba(220,190,95,0.40)",
        color: "#f1cf74",
      };
    default:
      return {
        border: "1px solid rgba(160,160,160,0.32)",
        color: "#e7dcc7",
      };
  }
}