import { useState, type CSSProperties } from "react";

type IconButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "transparent";

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
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const computedAlt = alt ?? label ?? title ?? "button";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onBlur={() => setIsPressed(false)}
      style={{
        ...getButtonStyle(variant, disabled, !!label, isHovered, isPressed),
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
            transition: "transform 0.16s ease, opacity 0.16s ease",
            transform: disabled
              ? "none"
              : isPressed
                ? "scale(0.94)"
                : isHovered
                  ? "scale(1.05)"
                  : "scale(1)",
            opacity: disabled ? 0.75 : 1,
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
  hasLabel: boolean,
  isHovered: boolean,
  isPressed: boolean,
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
      : variant === "transparent"
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
      };

    case "secondary":
      return {
        ...base,
        border: "1px solid #9d8560",
        background: isHovered
          ? "rgba(201,165,106,0.26)"
          : "rgba(201,165,106,0.18)",
      };

    case "danger":
      return {
        ...base,
        border: "1px solid rgba(195,95,95,0.45)",
        background: isHovered
          ? "rgba(140,35,35,0.30)"
          : "rgba(120,30,30,0.22)",
      };

    case "transparent":
      return {
        ...base,
        border: "1px solid rgba(255,255,255,0)",
        background: isHovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0)",
      };

    default:
      return {
        ...base,
        border: "1px solid #9d8560",
        background: isHovered
          ? "rgba(201,165,106,0.18)"
          : "rgba(201,165,106,0.12)",
      };
  }
}