import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { resolveEquipmentImageUrl } from "../api/equipment";
import { getEquipmentBanner } from "../utils/bannerFallbacks";

type EquipmentBannerCardProps = {
  equipmentId?: number;
  equipmentName: string;
  category?: string | null;
  quantity?: number | null;
  effectiveness?: number | null;
  availableQuantity?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  actions?: ReactNode;
  footer?: ReactNode;
  minHeight?: number;
};

export default function EquipmentBannerCard({
  equipmentId,
  equipmentName,
  category,
  quantity,
  effectiveness,
  availableQuantity,
  description,
  imageUrl,
  actions,
  footer,
  minHeight = 170,
}: EquipmentBannerCardProps) {
  const backgroundImage =
    resolveEquipmentImageUrl(imageUrl) ?? getEquipmentBanner(category);

  return (
    <div
      style={{
        border: "1px solid #9d8560",
        borderRadius: 14,
        overflow: "hidden",
        background: "rgba(0,0,0,0.58)",
      }}
    >
      <div
        style={{
          minHeight,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 18,
          alignItems: "stretch",
          backgroundImage: `linear-gradient(${getEquipmentOverlay(
            category
          )}, rgba(0,0,0,0.74)), url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div style={{ padding: 14 }}>
          <div
            style={{
              maxWidth: 720,
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: 12,
              padding: 16,
              background: "rgba(20,20,20,0.62)",
              backdropFilter: "blur(2px)",
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#efb85f",
                fontFamily: "monospace",
                marginBottom: 8,
              }}
            >
              {equipmentId ? (
                <Link
                  to={`/equipment/${equipmentId}`}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {equipmentName}
                </Link>
              ) : (
                equipmentName
              )}
            </div>

            {category !== undefined && (
              <div style={metaLineStyle}>Category: {category ?? "—"}</div>
            )}

            {quantity !== undefined && quantity !== null && (
              <div style={metaLineStyle}>Quantity: {quantity}</div>
            )}

            {effectiveness !== undefined && effectiveness !== null && (
              <div style={metaLineStyle}>Effectiveness: {effectiveness}/100</div>
            )}

            {availableQuantity !== undefined && availableQuantity !== null && (
              <div style={metaLineStyle}>
                Global Available: {availableQuantity}
              </div>
            )}

            {description && (
              <div
                style={{
                  color: "#f3efe6",
                  fontFamily: "monospace",
                  fontSize: 14,
                  marginTop: 10,
                  whiteSpace: "pre-wrap",
                  opacity: 0.9,
                }}
              >
                {description}
              </div>
            )}

            {footer && <div style={{ marginTop: 12 }}>{footer}</div>}
          </div>
        </div>

        {actions && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 14,
              flexWrap: "wrap",
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

function getEquipmentOverlay(category?: string | null) {
  switch (category) {
    case "Primary":
      return "rgba(12, 32, 50, 0.64)";
    case "Secondary":
      return "rgba(38, 20, 52, 0.64)";
    case "Melee":
      return "rgba(52, 22, 22, 0.64)";
    case "Utility":
      return "rgba(24, 48, 34, 0.62)";
    default:
      return "rgba(0, 0, 0, 0.60)";
  }
}

const metaLineStyle: CSSProperties = {
  color: "#d7b176",
  fontFamily: "monospace",
  fontSize: 16,
  marginBottom: 4,
};