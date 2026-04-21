import type { CSSProperties } from "react";

type IconButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "transparent";

type IconButtonProps = {
  iconSrc?: string;
  alt?: string;
  label?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: IconButtonVariant;
  size?: number;
  title?: string;
  style?: CSSProperties;
};

export default function IconButton({
  iconSrc,
  alt,
  label,
  onClick,
  type = "button",
  disabled = false,
  variant = "ghost",
  size = 22,
  title,
  style,
}: IconButtonProps) {
  const computedAlt = alt ?? label ?? title ?? "button";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        ...getButtonStyle(variant, disabled, !!label),
        ...style,
      }}
    >
      {iconSrc && (
        <img
          src={iconSrc}
          alt={computedAlt}
          style={{
            width: size,
            height: size,
            objectFit: "contain",
            display: "block",
            flexShrink: 0,
          }}
        />
      )}

      {label && (
        <span
          style={{
            fontFamily: "monospace",
            fontWeight: 700,
            fontSize: 14,
            lineHeight: 1,
            color: variant === "primary" ? "#1d1812" : "#f3efe6",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}

function getButtonStyle(
  variant: IconButtonVariant,
  disabled: boolean,
  hasLabel: boolean
): CSSProperties {
  const base: CSSProperties = {
    minWidth: hasLabel ? 96 : 46,
    width: hasLabel ? "auto" : 46,
    height: 46,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: hasLabel ? 8 : 0,
    borderRadius: 10,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    padding: hasLabel ? "0 16px" : 0,
    transition: "all 0.15s ease",
  };

  switch (variant) {
    case "primary":
      return {
        ...base,
        border: "1px solid #c9a56a",
        background: "#c9a56a",
      };

    case "secondary":
      return {
        ...base,
        border: "1px solid #9d8560",
        background: "rgba(201,165,106,0.18)",
      };

    case "danger":
      return {
        ...base,
        border: "1px solid rgba(195,95,95,0.45)",
        background: "rgba(120,30,30,0.22)",
      };

    case "transparent":
      return {
        ...base,
        border: "1px solid rgba(255,255,255,0)",
        background: "rgba(255,255,255,0)",
      };

    default:
      return {
        ...base,
        border: "1px solid #9d8560",
        background: "rgba(201,165,106,0.12)",
      };
  }
}