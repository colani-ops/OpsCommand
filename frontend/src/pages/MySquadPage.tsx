import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { hasRole } from "../api/auth";
import { getMySquad, type MySquadDto } from "../api/squads";

export default function MySquadPage() {
  const canAccess = hasRole("Member", "Commander");

  const [squad, setSquad] = useState<MySquadDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    setLoading(true);

    try {
      const data = await getMySquad();
      setSquad(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load squad");
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
        <h2 style={{ marginRight: "auto" }}>My Squad</h2>

        <button onClick={load} style={{ padding: "8px 12px", borderRadius: 8 }}>
          Refresh
        </button>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}
      {loading && <div style={{ marginTop: 10 }}>Loading...</div>}

      {!loading && !err && !squad && (
        <div style={{ marginTop: 14 }}>No squad assigned.</div>
      )}

      {!loading && !err && squad && (
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
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {squad.name} <span style={{ opacity: 0.7 }}>· {squad.type}</span>
          </div>

          <div><b>Commander:</b> {squad.commanderName ?? squad.commanderId ?? "—"}</div>
          <div><b>Missions Served:</b> {squad.missionsServed}</div>
          <div><b>Successful Missions:</b> {squad.missionsWon}</div>
          <div><b>Success Rate:</b> {squad.missionsServed > 0 ? `${squad.successRate}%` : "N/A"}</div>
        </div>
      )}
    </div>
  );
}