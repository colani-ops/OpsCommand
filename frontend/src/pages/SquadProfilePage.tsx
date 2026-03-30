import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { getUser, hasRole } from "../api/auth";
import { deleteSquad, getSquadProfile, type SquadProfileDto } from "../api/squads";

export default function SquadProfilePage() {
  const { id } = useParams();
  const nav = useNavigate();

  const canAccess = hasRole("Admin", "SuperAdmin");
  const canManage = hasRole("Admin", "SuperAdmin");

  const [squad, setSquad] = useState<SquadProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

   const currentUser = getUser();

  async function load() {
    if (!id) return;

    setErr(null);
    setLoading(true);

    try {
      const data = await getSquadProfile(Number(id));
      setSquad(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load squad profile");
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

  async function onDelete() {
    if (!squad) return;
    if (!confirm("Soft-delete this squad?")) return;

    setErr(null);
    try {
      await deleteSquad(squad.id);
      nav("/squads");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to delete squad");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ marginRight: "auto" }}>Squad Profile</h2>

        <button onClick={load} style={{ padding: "8px 12px", borderRadius: 8 }}>
          Refresh
        </button>

        {canManage && squad && (
          <button onClick={onDelete} style={{ padding: "8px 12px", borderRadius: 8 }}>
            Delete
          </button>
        )}
      </div>

      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}
      {loading && <div style={{ marginTop: 10 }}>Loading...</div>}

      {!loading && !err && !squad && <div>Squad not found.</div>}

      {!loading && !err && squad && (
        <>
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
              {squad.name} <span style={{ opacity: 0.7 }}>· {squad.type}</span>
            </div>

            <div><b>Commander:</b> {squad.commanderName ?? squad.commanderId ?? "—"}</div>
            <div><b>Created At:</b> {new Date(squad.createdAt).toLocaleString()}</div>
            <div><b>Status:</b> {squad.isActive ? "Active" : "Soft-deleted"}</div>
            <div><b>Missions Served:</b> {squad.missionsServed}</div>
            <div><b>Successful Missions:</b> {squad.missionsWon}</div>
            <div><b>Success Rate:</b> {squad.missionsServed > 0 ? `${squad.successRate}%` : "N/A"}</div>
          </div>

          <div
            style={{
            marginTop: 14,
            border: "1px solid #333",
            borderRadius: 12,
            padding: 14,
            }}
          >
  
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            Squad Members
          </div>

          {squad.members.length === 0 ? (
            <div>No members assigned to this squad.</div>
          ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {squad.members.map((member) => (
            <div
              key={member.id}
                style={{
                  border: "1px solid #333",
                  borderRadius: 10,
                  padding: 12,
                }}
            >
          
<Link
  to={member.id === currentUser?.id ? "/myprofile" : `/users/${member.id}`}
  style={{ color: "white", textDecoration: "none" }}
>
  {member.userName ?? member.email}
</Link>

          <div style={{ opacity: 0.85, marginTop: 4 }}>{member.email}</div>
          <div style={{ opacity: 0.85 }}>Role: {member.role}</div>
          <div style={{ opacity: 0.85 }}>
            Status: {member.isActive ? "Active" : "Disabled"}
          </div>
                </div>
              ))}
            </div>
            )}
          </div>

          <div
            style={{
              marginTop: 14,
              border: "1px solid #333",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
              Squad Equipment
            </div>

            {squad.equipment.length === 0 ? (
              <div>No equipment assigned to this squad.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {squad.equipment.map((item) => (
                  <div
                    key={item.equipmentId}
                    style={{
                      border: "1px solid #333",
                      borderRadius: 10,
                      padding: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        <Link
                          to={`/equipment/${item.equipmentId}`}
                          style={{ color: "white", textDecoration: "none" }}
                        >
                          {item.equipmentName}
                        </Link>
                        {item.category ? ` · ${item.category}` : ""}
                      </div>

                      <div style={{ opacity: 0.85 }}>Quantity: {item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}