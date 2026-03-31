import { Link, useNavigate } from "react-router-dom";
import { getUser, getPrimaryRole, hasRole, logout } from "../api/auth";

export default function NavBar() {
  const nav = useNavigate();
  const user = getUser();
  const role = getPrimaryRole();

  const canSeeSquads = hasRole("Admin", "SuperAdmin");
  const canSeeMySquad = hasRole("Member", "Commander");// && user?.assignedSquadId;
  const canSeeMissions = hasRole("Admin", "SuperAdmin");
  const canSeeMyMissions = hasRole("Member", "Commander");
  const canSeeEquipment = hasRole(/*"Member", */"Commander", "Admin", "SuperAdmin");
  const canSeeUsers = hasRole("Admin", "SuperAdmin");
  // Recruit: samo Profile (i Home)
  // Admin/SuperAdmin: sve (kasnije "Admin" tab)

  return (
    <div
      style={{
        position: "sticky", 
        top: 0, 
        background: "#111", 
        borderBottom: "1px solid #333", 
        zIndex: 10
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", gap: 14 }}>

      
      <Link to="/" style={{ color: "white", textDecoration: "none", fontWeight: 700 }}>
        OpsCommand
      </Link>

      <div style={{ display: "flex", gap: 12 }}>
        <Link to="/" style={{ color: "white" }}>Home</Link>

        {canSeeMySquad && <Link to="/my-squad" style={{ color: "white" }}>My Squad</Link>}
        {canSeeMyMissions && <Link to="/my-missions" style={{ color: "white" }}>My Missions</Link>}
        {canSeeSquads && <Link to="/squads" style={{ color: "white" }}>Squads</Link>}
        {canSeeMissions && <Link to="/missions" style={{ color: "white" }}>Missions</Link>}
        {canSeeEquipment && <Link to="/equipment" style={{ color: "white" }}>Equipment</Link>}
        {canSeeUsers && <Link to="/users" style={{ color: "white" }}>Users</Link>}

        <Link to="/my-profile" style={{ color: "white" }}>My Profile</Link>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        {user && (
          <span style={{ color: "#bbb", fontSize: 14 }}>
            {user.userName} · {role}
          </span>
        )}

        <button
          onClick={() => {
            logout();
            nav("/login");
          }}
          style={{ padding: "8px 12px", borderRadius: 8 }}
        >
          Logout
        </button>
      </div>
    </div>
    </div>
  );
}
