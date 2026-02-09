import React from "react";
import NavBar from "./NavBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0b", color: "white" }}>
      <NavBar />
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 16px" }}>
        {children}
      </div>
    </div>
  );
}
