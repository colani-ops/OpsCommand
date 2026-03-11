import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { hasRole } from "../api/auth";
import { getMyMissions, type MissionDto } from "../api/missions";

export default function MyMissionsPage() {
  const canAccess = hasRole("Member", "Commander");

  const [missions, setMissions] = useState<MissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    setLoading(true);

    try {
      const data = await getMyMissions();
      setMissions(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load missions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ marginRight: "auto" }}>My Missions</h2>

        <button onClick={load} style={{ padding: "8px 12px", borderRadius: 8 }}>
          Refresh
        </button>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}
      {loading && <div style={{ marginTop: 10 }}>Loading...</div>}

      {!loading && (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {missions.map((m) => (
            <div
              key={m.id}
              style={{
                border: "1px solid #333",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {m.name} <span style={{ opacity: 0.7 }}>· {m.status}</span>
              </div>

              <div style={{ opacity: 0.85, marginTop: 6 }}>
                CommanderId: {m.commanderId ?? "—"}
              </div>

              <div style={{ opacity: 0.85 }}>
                SquadId: {m.squadId ?? "—"}
              </div>

              {m.notes && (
                <div style={{ opacity: 0.85, marginTop: 6 }}>
                  Notes: {m.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && !err && missions.length === 0 && (
        <div style={{ marginTop: 14 }}>No missions assigned.</div>
      )}
    </div>
  );
}