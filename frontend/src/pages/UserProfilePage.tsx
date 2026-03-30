import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { hasRole } from "../api/auth";
import { getUserProfile, type UserProfileDto } from "../api/users";

export default function UserProfilePage() {
  const { id } = useParams();
  const canAccess = hasRole("Member", "Commander", "Admin", "SuperAdmin");

  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    if (!id) return;

    setErr(null);
    setLoading(true);

    try {
      const data = await getUserProfile(id);
      setUser(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <h2>User Profile</h2>

      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}
      {loading && <div style={{ marginTop: 10 }}>Loading...</div>}

      {!loading && !err && !user && <div>User not found.</div>}

      {!loading && !err && user && (
        <div
          style={{
            marginTop: 14,
            border: "1px solid #333",
            borderRadius: 12,
            padding: 14,
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {user.userName ?? user.email}
          </div>

          <div><b>Email:</b> {user.email}</div>
          <div><b>Primary Role:</b> {user.primaryRole ?? "—"}</div>
          <div><b>Assigned Squad ID:</b> {user.assignedSquadId ?? "None"}</div>
          <div><b>Status:</b> {user.isActive ? "Active" : "Disabled"}</div>
        </div>
      )}
    </div>
  );
}