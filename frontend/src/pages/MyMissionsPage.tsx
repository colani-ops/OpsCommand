import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { hasRole } from "../api/auth";
import { getMyMissions, type MissionDto } from "../api/missions";
import { useErrorHandler } from "../hooks/useErrorHandler";
import ErrorBanner from "../components/ErrorBanner";
import MissionStatusBadge from "../components/MissionStatusBadge";
import MissionMetaBadge from "../components/MissionMetaBadge";
import MissionOutcome from "../components/MissionOutcome";

function formatRemainingTime(activatedAt: string | null, durationMinutes: number | null) {
  if (!activatedAt || durationMinutes == null) return "—";

  const activated = new Date(activatedAt).getTime();
  const readyAt = activated + durationMinutes * 60 * 1000;
  const diffMs = readyAt - Date.now();

  if (diffMs <= 0) return "Ready for execution";

  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}m ${seconds}s remaining`;
}

export default function MyMissionsPage() {
  const canAccess = hasRole("Member", "Commander");

  const [missions, setMissions] = useState<MissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setNowTick] = useState(0);

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
    const interval = setInterval(() => {
      setNowTick((v) => v + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{m.name}</div>
                <MissionStatusBadge status={m.status} />
                <MissionMetaBadge>{m.terrain ?? "No terrain"}</MissionMetaBadge>
                <MissionMetaBadge>{m.difficulty ?? "No difficulty"}</MissionMetaBadge>
              </div>

              {m.status === "Active" && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 8,
                    background: "#1a1a1a",
                    border: "1px solid #444",
                  }}
                >
                  <div>
                    <b>Activated At:</b>{" "}
                    {m.activatedAt ? new Date(m.activatedAt).toLocaleString() : "—"}
                  </div>
                  <div>
                    <b>Duration:</b>{" "}
                    {m.durationMinutes != null ? `${m.durationMinutes} min` : "—"}
                  </div>
                  <div>
                    <b>Status Window:</b>{" "}
                    {formatRemainingTime(m.activatedAt, m.durationMinutes)}
                  </div>
                </div>
              )}

              <div style={{ opacity: 0.85, marginTop: 10 }}>
                Executed At: {m.executedAt ? new Date(m.executedAt).toLocaleString() : "—"}
              </div>

              <div style={{ opacity: 0.85 }}>
                Success Snapshot: {m.successChanceSnapshot != null ? `${m.successChanceSnapshot}%` : "—"}
              </div>

              <MissionOutcome mission={m} />

              {m.notes && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 8,
                    background: "#151515",
                    border: "1px solid #2d2d2d",
                    whiteSpace: "pre-wrap",
                    opacity: 0.92,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Mission Notes</div>
                  <div>{m.notes}</div>
                </div>
              )}

              {m.status === "Planned" && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 8,
                    background: "#101820",
                    border: "1px solid #2c3e50",
                    opacity: 0.92,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Planning Phase</div>
                  <div>Check your squad loadout and mission terrain before activation.</div>
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