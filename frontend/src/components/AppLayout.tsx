import type { ReactNode } from "react";
import NavBar from "./NavBar";
import {
  appShellContentStyle,
  appShellOverlayStyle,
  appShellPageStyle,
  pageContainerStyle,
} from "../styles/appShellStyles";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div style={appShellPageStyle}>
      <div style={appShellOverlayStyle} />
      <div style={appShellContentStyle}>
        <NavBar />
        <main style={pageContainerStyle}>{children}</main>
      </div>
    </div>
  );
}