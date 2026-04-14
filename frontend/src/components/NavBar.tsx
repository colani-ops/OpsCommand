import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getUser, getPrimaryRole, hasRole, logout } from "../api/auth";

export default function NavBar() {
  const nav = useNavigate();
  const location = useLocation();

  const user = getUser();
  const role = getPrimaryRole();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const canSeeSquads = hasRole("Admin", "SuperAdmin");
  const canSeeMissions = hasRole("Admin", "SuperAdmin");
  const canSeeEquipment = hasRole("Commander", "Admin", "SuperAdmin");
  const canSeeUsers = hasRole("Admin", "SuperAdmin");

  const canSeeMySquad = hasRole("Member", "Commander");
  const canSeeMyMissions = hasRole("Member", "Commander");

  useEffect(() => {
    function onDocumentClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", onDocumentClick);
    }

    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }
  function navLinkStyle(isActive: boolean): React.CSSProperties {
    return {
      color: isActive ? "#efb85f" : "#e8c17a",
      textDecoration: "none",
      fontWeight: 700,
      fontFamily: "monospace",
      fontSize: 15,
      letterSpacing: "0.04em",
    };
  }

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        padding: 12,
      }}
    >
      <div
        style={{
          border: "2px solid #c9a56a",
          borderRadius: 14,
          background: "rgba(0, 0, 0, 0.82)",
          minHeight: 82,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: "0 22px",
          gap: 16,
          boxShadow: "0 0 24px rgba(0,0,0,0.24)",
        }}
      >
        <div style={{ justifySelf: "start" }}>
          <Link
            to="/"
            style={{
              color: "#efb85f",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: 28,
              fontFamily: "monospace",
              letterSpacing: "0.03em",
            }}
          >
            OpsCommand
          </Link>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 54,
          }}
        >
          {canSeeSquads && (
            <Link to="/squads" style={navLinkStyle(location.pathname === "/squads")}>
              Squads
            </Link>
          )}

          {canSeeMissions && (
            <Link to="/missions" style={navLinkStyle(location.pathname === "/missions")}>
              Missions
            </Link>
          )}

          {canSeeEquipment && (
            <Link to="/equipment" style={navLinkStyle(location.pathname === "/equipment")}>
              Equipment
            </Link>
          )}

          {canSeeUsers && (
            <Link to="/users" style={navLinkStyle(location.pathname === "/users")}>
              Users
            </Link>
          )}
        </div>

        <div
          ref={menuRef}
          style={{
            justifySelf: "end",
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#efb85f",
              padding: 0,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.18)",
                background: "rgba(220,220,220,0.92)",
                display: "grid",
                placeItems: "center",
                fontSize: 28,
                color: "#666",
                flexShrink: 0,
              }}
            >
              ◉
            </div>

            <div
              style={{
                display: "grid",
                justifyItems: "start",
                color: "#e8c17a",
                fontFamily: "monospace",
                lineHeight: 1.15,
              }}
            >
              <span style={{ fontWeight: 700 }}>{user?.userName ?? "User"}</span>
              <span style={{ fontSize: 13, opacity: 0.9 }}>{role}</span>
            </div>
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 12px)",
                right: 0,
                width: 210,
                border: "2px solid #c9a56a",
                borderRadius: 4,
                background: "rgba(0, 0, 0, 0.82)",
                padding: 16,
                display: "grid",
                gap: 12,
                boxShadow: "0 12px 24px rgba(0,0,0,0.28)",
                textAlign: "center",
              }}
            >
              <Link
                to="/my-profile"
                style={{ textDecoration: "none", display: "grid" }}
                onClick={closeMenu}
              >
                <button style={menuButtonStyleSecondary(true)}>My Profile</button>
              </Link>

              {canSeeMySquad && (
                <Link to="/my-squad"                 
                style={{ textDecoration: "none", display: "grid" }}
                onClick={closeMenu}>
                  <button style={menuButtonStyleSecondary(true)}>My Squad</button>
                </Link>
              )}

              {canSeeMyMissions && (
                <Link to="/my-missions" 
                style={{ textDecoration: "none", display: "grid" }}
                onClick={closeMenu}>
                  <button style={menuButtonStyleSecondary(true)}>My Missions</button>
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  logout();
                  nav("/login");
                }}
                style={menuButtonStyle(true)}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function menuButtonStyle(primary: boolean): React.CSSProperties {
  return {
    width: "60%",
    height: "100%",
    alignSelf: "center",
    justifySelf: "center",
    padding: "10px 14px",
    borderRadius: 4,
    border: primary ? "1px solid #f0e6d2" : "1px solid rgba(255,255,255,0.14)",
    background: primary ? "#c9a56a" : "#d3d3d3",
    color: primary ? "#ffffff" : "#2a241c",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "monospace",
    letterSpacing: "0.02em",
  };
}

function menuButtonStyleSecondary(primary: boolean): React.CSSProperties {
  return {
    width: "60%",
    height: "100%",
    alignSelf: "center",
    justifySelf: "center",
    padding: "10px 14px",
    borderRadius: 4,
    border: primary ? "1px solid #f0e6d2" : "1px solid rgba(255,255,255,0.14)",
    background: primary ? "#8c8277" : "#d3d3d3",
    color: primary ? "#ffffff" : "#2a241c",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "monospace",
    letterSpacing: "0.02em",
  };
}