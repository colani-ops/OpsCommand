import { useState, type CSSProperties, type ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  children: ReactNode;
  style?: CSSProperties;
  contentStyle?: CSSProperties;
};

export default function SectionCard({
  title,
  children,
  style,
  contentStyle,
}: SectionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        border: "1px solid #9d8560",
        borderRadius: 14,
        background: "rgba(0,0,0,0.58)",
        padding: 16,
        transition:
          "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        transform: isHovered ? "translateY(-1px)" : "translateY(0)",
        boxShadow: isHovered
          ? "0 10px 24px rgba(0,0,0,0.18)"
          : "0 2px 8px rgba(0,0,0,0.08)",
        borderColor: isHovered ? "#b79a6e" : "#9d8560",
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#f3efe6",
            fontFamily: "monospace",
            marginBottom: 14,
          }}
        >
          {title}
        </div>
      )}

      <div style={contentStyle}>{children}</div>
    </section>
  );
}