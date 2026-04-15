import type { CSSProperties } from "react";

export const appShellPageStyle: CSSProperties = {
  minHeight: "100svh",
  overflow: "hidden",
  position: "relative",
  backgroundImage: 'url("/mainBG.png")',
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
};

export const appShellOverlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(rgba(8, 10, 12, 0.68), rgba(8, 10, 12, 0.8))",
};

export const appShellContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "100svh",
  overflow: "hidden",
};

export const pageContainerStyle: CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "28px 20px 40px",
};

export const glassCardStyle: CSSProperties = {
  border: "2px solid #c9a56a",
  borderRadius: 14,
  background: "rgba(0, 0, 0, 0.42)",
  boxShadow: "0 0 24px rgba(0,0,0,0.24)",
};

export const pageTitleStyle: CSSProperties = {
  margin: 0,
  color: "#efb85f",
  fontSize: "clamp(2rem, 4vw, 3rem)",
  fontWeight: 800,
  fontFamily: "monospace",
  letterSpacing: "0.06em",
};

export const pageTextStyle: CSSProperties = {
  color: "#e6d7bc",
  fontFamily: "monospace",
};