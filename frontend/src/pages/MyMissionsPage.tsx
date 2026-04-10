import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { hasRole } from "../api/auth";
import { getMyMissions, type MissionDto } from "../api/missions";
import { useErrorHandler } from "../hooks/useErrorHandler";
import ErrorBanner from "../components/ErrorBanner";

function getStatusBadgeStyle(status: MissionDto["status"]): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid",
  };

  switch (status) {
    case "Prepared":
      return { ...base, background: "#2e2e2e", color: "#d6d6d6", borderColor: "#555" };
    case "Planned":
      return { ...base, background: "#1d3557", color: "#bde0fe", borderColor: "#457b9d" };
    case "Active":
      return { ...base, background: "#3a2a00", color: "#ffd166", borderColor: "#a36a00" };
    case "Completed":
      return { ...base, background: "#0d3b1e", color: "#7CFC98", borderColor: "#2a7a45" };
    case "Cancelled":
      return { ...base, background: "#3a0f0f", color: "#ff9b9b", borderColor: "#b04a4a" };
    default:
      return base;
  }
}

function getMetaBadgeStyle(): React.CSSProperties {
  return {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid #444",
    background: "#1b1b1b",
    color: "#ddd",
  };
}

function getOutcomeText(m: MissionDto) {
  if (m.wasSuccessful == null) return "—";
  return m.wasSuccessful ? "Success" : "Failure";
}

function getOutcomeStyle(m: MissionDto): React.CSSProperties {
  if (m.wasSuccessful == null) {
    return { opacity: 0.85, fontWeight: 600 };
  }

  return {
    fontWeight: 700,
    color: m.wasSuccessful ? "#7CFC98" : "#FF7B7B",
  };
}

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
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{m.name}</div>
                <span style={getStatusBadgeStyle(m.status)}>{m.status}</span>
                <span style={getMetaBadgeStyle()}>{m.terrain ?? "No terrain"}</span>
                <span style={getMetaBadgeStyle()}>{m.difficulty ?? "No difficulty"}</span>
              </div>

              <div style={{ opacity: 0.85, marginTop: 10 }}>
                Executed At: {m.executedAt ? new Date(m.executedAt).toLocaleString() : "—"}
              </div>

              <div style={{ opacity: 0.85 }}>
                Success Snapshot: {m.successChanceSnapshot != null ? `${m.successChanceSnapshot}%` : "—"}
              </div>

              <div style={{ marginTop: 6, ...getOutcomeStyle(m) }}>
                Outcome: {getOutcomeText(m)}
              </div>

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