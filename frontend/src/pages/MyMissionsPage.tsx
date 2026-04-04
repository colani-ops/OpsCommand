import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { hasRole } from "../api/auth";
import { getMyMissions, type MissionDto } from "../api/missions";
import { useErrorHandler } from "../hooks/useErrorHandler";
import ErrorBanner from "../components/ErrorBanner";

export default function MyMissionsPage() {
  const canAccess = hasRole("Member", "Commander");

  const [missions, setMissions] = useState<MissionDto[]>([]);
  const [loading, setLoading] = useState(true);

  const { error, showError, clearError } = useErrorHandler();

  const load = useCallback(async () => {
    clearError();
    setLoading(true);

    try {
      const data = await getMyMissions();
      setMissions(data);
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Failed to load missions");
    } finally {
      setLoading(false);
    }
  }, [clearError, showError]);

  useEffect(() => {
    load();
  }, [load]);

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

      <ErrorBanner error={error} />
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
                Terrain: {m.terrain ?? "—"}
              </div>

              <div style={{ opacity: 0.85 }}>
                Difficulty: {m.difficulty ?? "—"}
              </div>

              <div style={{ opacity: 0.85 }}>
                Executed At: {m.executedAt ? new Date(m.executedAt).toLocaleString() : "—"}
              </div>

              <div style={{ opacity: 0.85 }}>
                Success Snapshot: {m.successChanceSnapshot ?? "—"}
              </div>

            <div
              style={{
                opacity: 0.95,
                fontWeight: 600,
                color:
                  m.wasSuccessful == null
                  ? undefined
                  : m.wasSuccessful
                  ? "#7CFC98"
                  : "#FF7B7B",
              }}
            >
              Outcome: {m.wasSuccessful == null ? "—" : m.wasSuccessful ? "Success" : "Failure"}
            </div>

              {m.notes && (
                <div style={{ opacity: 0.85, marginTop: 8, whiteSpace: "pre-wrap" }}>
                  Notes: {m.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && !error && missions.length === 0 && (
        <div style={{ marginTop: 14 }}>No missions assigned.</div>
      )}
    </div>
  );
}