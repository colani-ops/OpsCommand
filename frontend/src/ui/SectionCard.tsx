import type { CSSProperties, ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  style?: CSSProperties;
  contentStyle?: CSSProperties;
};

export default function SectionCard({
  children,
  title,
  subtitle,
  actions,
  style,
  contentStyle,
}: SectionCardProps) {
  return (
    <section
      style={{
        border: "1px solid #9d8560",
        borderRadius: 14,
        background: "rgba(0,0,0,0.58)",
        overflow: "hidden",
        ...style,
      }}
    >
      {(title || subtitle || actions) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 12,
            alignItems: "center",
            padding: "16px 16px 0 16px",
          }}
        >
          <div>
            {title && (
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#f3efe6",
                  fontFamily: "monospace",
                  marginBottom: subtitle ? 6 : 0,
                }}
              >
                {title}
              </div>
            )}

            {subtitle && (
              <div
                style={{
                  color: "#d7b176",
                  fontFamily: "monospace",
                  fontSize: 14,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          {actions && (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {actions}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          padding: 16,
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </section>
  );
}