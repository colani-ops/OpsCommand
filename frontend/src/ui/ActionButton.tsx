import { useState, type CSSProperties } from "react";

type ActionButtonVariant = "primary" | "secondary" | "ghost" | "danger";

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
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onBlur={() => setIsPressed(false)}
      style={getButtonStyle(variant, disabled, isHovered, isPressed)}
    >
      {iconSrc && (
        <img
          src={iconSrc}
          alt=""
          aria-hidden="true"
          style={{
            width: 16,
            height: 16,
            objectFit: "contain",
            display: "block",
            flexShrink: 0,
          }}
        />
      )}

      <span>{label}</span>
    </button>
  );
}

function getButtonStyle(
  variant: ActionButtonVariant,
  disabled: boolean,
  isHovered: boolean,
  isPressed: boolean,
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
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease, opacity 0.18s ease",
    transform: disabled
      ? "none"
      : isPressed
        ? "translateY(1px) scale(0.985)"
        : isHovered
          ? "translateY(-1px)"
          : "translateY(0)",
    boxShadow: disabled
      ? "none"
      : isPressed
        ? "0 3px 10px rgba(0,0,0,0.20)"
        : isHovered
          ? "0 8px 18px rgba(0,0,0,0.22)"
          : "0 2px 6px rgba(0,0,0,0.10)",
  };

  switch (variant) {
    case "primary":
      return {
        ...base,
        border: "1px solid #c9a56a",
        background: isHovered ? "#d7b57a" : "#c9a56a",
        color: "#1d1812",
      };

    case "secondary":
      return {
        ...base,
        border: "1px solid #9d8560",
        background: isHovered
          ? "rgba(201,165,106,0.26)"
          : "rgba(201,165,106,0.18)",
        color: "#f3efe6",
      };

    case "danger":
      return {
        ...base,
        border: "1px solid rgba(195,95,95,0.45)",
        background: isHovered
          ? "rgba(140,35,35,0.30)"
          : "rgba(120,30,30,0.22)",
        color: "#ffd4d4",
      };

    default:
      return {
        ...base,
        border: "1px solid #9d8560",
        background: isHovered
          ? "rgba(201,165,106,0.18)"
          : "rgba(201,165,106,0.12)",
        color: "#f3efe6",
      };
  }
}