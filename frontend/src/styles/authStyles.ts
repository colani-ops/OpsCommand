import type { CSSProperties } from "react";

export const authPageStyle: CSSProperties = {
  minHeight: "100dvh",
  boxSizing: "border-box",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px 20px",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  position: "relative",
};

export const authOverlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(rgba(8, 10, 12, 0.72), rgba(8, 10, 12, 0.82))",
  backdropFilter: "blur(1px)",
};

export const authContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  display: "grid",
  justifyItems: "center",
  gap: 28,
};

export const authTitleBoxStyle: CSSProperties = {
  width: "min(760px, 92vw)",
  border: "6px solid #c9a56a",
  borderRadius: 14,
  background: "rgba(0, 0, 0, 0.68)",
  padding: "18px 28px",
  textAlign: "center",
  boxShadow: "0 0 24px rgba(0,0,0,0.28)",
};

export const authTitleStyle: CSSProperties = {
  margin: 0,
  color: "#efb85f",
  fontSize: "clamp(3rem, 6.8vw, 5rem)",
  fontWeight: 800,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  fontFamily: "monospace",
};

export const authPanelStyle: CSSProperties = {
  width: "min(420px, 92vw)",
  border: "6px solid #c9a56a",
  borderRadius: 14,
  background: "rgba(0, 0, 0, 0.56)",
  padding: "28px 34px",
  boxShadow: "0 0 24px rgba(0,0,0,0.32)",
};

export const authFormStyle: CSSProperties = {
  display: "grid",
  gap: 16,
};

export const authFieldWrapStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

export const authLabelStyle: CSSProperties = {
  color: "#efb85f",
  fontWeight: 700,
  fontSize: 16,
  textAlign: "center",
  fontFamily: "monospace",
  letterSpacing: "0.04em",
};

export const authInputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: 0,
  border: "3px solid #c9a56a",
  outline: "none",
  background: "rgba(8, 8, 8, 0.82)",
  color: "#f2e6d0",
  fontSize: 16,
  fontFamily: "monospace",
};

export const authPrimaryButtonStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 8,
  border: "none",
  background: "#c9a56a",
  color: "#1a1712",
  fontWeight: 800,
  fontSize: 16,
  cursor: "pointer",
  marginTop: 6,
};

export const authSecondaryButtonStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(220, 220, 220, 0.72)",
  color: "#1a1712",
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
};

export const authMessageStyle: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  background: "rgba(42, 0, 0, 0.86)",
  color: "#ff8d8d",
  border: "1px solid #ff6b6b",
  fontSize: 14,
};