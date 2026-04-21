import type { CSSProperties} from "react";

type ActionButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger";

type ActionButtonProps = {
  label: string;
  iconSrc?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: ActionButtonVariant;
};

export default function ActionButton({
  label,
  iconSrc,
  onClick,
  type = "button",
  disabled = false,
  variant = "ghost",
}: ActionButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={getButtonStyle(variant, disabled)}
    >
      {iconSrc && (
        <img
          src={iconSrc}
          alt=""
          aria-hidden="true"
          style={{ width: 16, height: 16, objectFit: "contain" }}
        />
      )}
      <span>{label}</span>
    </button>
  );
}

function getButtonStyle(
  variant: ActionButtonVariant,
  disabled: boolean
): CSSProperties {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 40,
    padding: "8px 14px",
    borderRadius: 10,
    fontFamily: "monospace",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    transition: "0.15s ease",
  };

  switch (variant) {
    case "primary":
      return {
        ...base,
        border: "1px solid #c9a56a",
        background: "#c9a56a",
        color: "#1d1812",
      };
    case "secondary":
      return {
        ...base,
        border: "1px solid #9d8560",
        background: "rgba(201,165,106,0.18)",
        color: "#f3efe6",
      };
    case "danger":
      return {
        ...base,
        border: "1px solid rgba(195,95,95,0.45)",
        background: "rgba(120,30,30,0.22)",
        color: "#ffd4d4",
      };
    default:
      return {
        ...base,
        border: "1px solid #9d8560",
        background: "rgba(201,165,106,0.12)",
        color: "#f3efe6",
      };
  }
}