import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { hasRole } from "../api/auth";
import { getMyMissions, type MissionDto } from "../api/missions";
import { useErrorHandler } from "../hooks/useErrorHandler";
import ErrorBanner from "../components/ErrorBanner";
import MissionStatusBadge from "../components/MissionStatusBadge";
import MissionMetaBadge from "../components/MissionMetaBadge";
import LoadingScreen from "../components/LoadingScreen";
import {
  detailsCardStyle,
  detailsLineStyle,
  detailsTitleStyle,
  metaLineStyle,
  pageContentScrollStyle,
  pageTitleStyleShared,
  panelStyle,
  searchInputStyle,
  sortButtonStyle,
  statusPanelStyle,
  statusPanelTitleStyle,
  toolbarButtonStyle,
} from "../styles/uiStyles";

function formatRemainingTime(
  activatedAt: string | null,
  durationMinutes: number | null,
) {
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

function isMissionReadyForExecution(
  activatedAt: string | null,
  durationMinutes: number | null,
) {
  if (!activatedAt || durationMinutes == null) return false;

  const activated = new Date(activatedAt).getTime();
  const readyAt = activated + durationMinutes * 60 * 1000;

  return Date.now() >= readyAt;
}

function formatMissionStatus(status: string) {
  return status === "Active" ? "In Progress" : status;
}

function getMissionTerrainBanner(terrain: string | null) {
  switch (terrain) {
    case "Urban":
      return "/banners/mission-urban.png";
    case "Plains":
      return "/banners/mission-plains.png";
    case "Forest":
      return "/banners/mission-forest.png";
    case "Mountain":
      return "/banners/mission-mountain.png";
    default:
      return "/banners/mission-default.png";
  }
}

function getMissionOverlay(status: string, wasSuccessful: boolean | null) {
  if (status === "Prepared") return "rgba(120,120,120,0.18)";
  if (status === "Planned") return "rgba(70,110,160,0.18)";
  if (status === "Active") return "rgba(185,145,45,0.16)";
  if (status === "Cancelled") return "rgba(120,70,70,0.20)";
  if (status === "Completed" && wasSuccessful === true) {
    return "rgba(60,135,70,0.16)";
  }
  if (status === "Completed" && wasSuccessful === false) {
    return "rgba(150,65,65,0.18)";
  }
  return "rgba(0,0,0,0.26)";
}

function getStatusPanel(m: MissionDto) {
  const ready = isMissionReadyForExecution(m.activatedAt, m.durationMinutes);
  const remaining = formatRemainingTime(m.activatedAt, m.durationMinutes);

  if (m.status === "Prepared") {
    return {
      title: "Prepared",
      text: "Mission is waiting for commander assignment.",
      background: "rgba(20,20,20,0.82)",
      border: "1px solid rgba(180,190,205,0.30)",
      titleColor: "#c9d2dd",
      textColor: "#f3efe6",
    };
  }

  if (m.status === "Planned") {
    return {
      title: "Planned",
      text: "Planning phase. Check terrain, difficulty, and squad readiness.",
      background: "rgba(20,20,20,0.82)",
      border: "1px solid rgba(120,155,205,0.34)",
      titleColor: "#8ebcff",
      textColor: "#f3efe6",
    };
  }

  if (m.status === "Active") {
    return {
      title: ready ? "Execution Ready" : "In Progress",
      text: ready
        ? "Mission window has ended. Awaiting execution result."
        : remaining,
      background: "rgba(20,20,20,0.82)",
      border: "1px solid rgba(220,190,95,0.36)",
      titleColor: "#f1cf74",
      textColor: "#f3efe6",
    };
  }

  if (m.status === "Cancelled") {
    return {
      title: "Cancelled",
      text: "Mission has been cancelled.",
      background: "rgba(20,20,20,0.82)",
      border: "1px solid rgba(180,100,100,0.34)",
      titleColor: "#d89b9b",
      textColor: "#f3dede",
    };
  }

  if (m.status === "Completed" && m.wasSuccessful === true) {
    return {
      title: "Success",
      text: `Mission succeeded. Snapshot: ${m.successChanceSnapshot ?? "—"}%`,
      background: "rgba(20,20,20,0.82)",
      border: "1px solid rgba(90,170,110,0.45)",
      titleColor: "#7ee08f",
      textColor: "#dff6e3",
    };
  }

  if (m.status === "Completed" && m.wasSuccessful === false) {
    return {
      title: "Failure",
      text: `Mission failed. Snapshot: ${m.successChanceSnapshot ?? "—"}%`,
      background: "rgba(20,20,20,0.82)",
      border: "1px solid rgba(195,95,95,0.45)",
      titleColor: "#ff8d8d",
      textColor: "#f5d6d6",
    };
  }

  return {
    title: m.status,
    text: "Mission status available.",
    background: "rgba(20,20,20,0.82)",
    border: "1px solid rgba(160,160,160,0.28)",
    titleColor: "#efb85f",
    textColor: "#f3efe6",
  };
}

function renderOutcomeBadge(m: MissionDto) {
  if (m.status !== "Completed" || m.wasSuccessful == null) return null;

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 700,
        fontFamily: "monospace",
        border: m.wasSuccessful
          ? "1px solid rgba(90,170,110,0.45)"
          : "1px solid rgba(195,95,95,0.45)",
        background: "rgba(20,20,20,0.78)",
        color: m.wasSuccessful ? "#7ee08f" : "#ff9a9a",
      }}
    >
      {m.wasSuccessful ? "Success" : "Failure"}
    </span>
  );
}

export default function MyMissionsPage() {
  const canAccess = hasRole("Member", "Commander");

  const [missions, setMissions] = useState<MissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setNowTick] = useState(0);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "status" | "difficulty" | "time">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

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

  const visibleMissions = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = missions.filter((m) => {
      if (!q) return true;

      return (
        m.name.toLowerCase().includes(q) ||
        (m.terrain ?? "").toLowerCase().includes(q) ||
        (m.difficulty ?? "").toLowerCase().includes(q) ||
        formatMissionStatus(m.status).toLowerCase().includes(q) ||
        (m.notes ?? "").toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      let result = 0;

      switch (sortBy) {
        case "name":
          result = a.name.localeCompare(b.name);
          break;
        case "status":
          result = formatMissionStatus(a.status).localeCompare(
            formatMissionStatus(b.status),
          );
          break;
        case "difficulty":
          result = (a.difficulty ?? "").localeCompare(b.difficulty ?? "");
          break;
        case "time": {
          const aTime = a.activatedAt ? new Date(a.activatedAt).getTime() : 0;
          const bTime = b.activatedAt ? new Date(b.activatedAt).getTime() : 0;
          result = aTime - bTime;
          break;
        }
      }

      return sortDir === "asc" ? result : -result;
    });

    return sorted;
  }, [missions, search, sortBy, sortDir]);

  function toggleSort(next: "name" | "status" | "difficulty" | "time") {
    if (sortBy === next) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(next);
    setSortDir("asc");
  }

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <ErrorBanner error={error} />

      <div
        style={{
          ...panelStyle,
          width: "100%",
          boxSizing: "border-box",
          padding: 28,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr auto",
            gap: 16,
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <h2 style={pageTitleStyleShared}>My Missions</h2>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            style={searchInputStyle}
          />

          <button type="button" onClick={load} style={toolbarButtonStyle}>
            Refresh
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <button type="button" onClick={() => toggleSort("name")} style={sortButtonStyle}>
            Name {sortBy === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
          <button type="button" onClick={() => toggleSort("status")} style={sortButtonStyle}>
            Status {sortBy === "status" ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
          <button
            type="button"
            onClick={() => toggleSort("difficulty")}
            style={sortButtonStyle}
          >
            Difficulty {sortBy === "difficulty" ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
          <button type="button" onClick={() => toggleSort("time")} style={sortButtonStyle}>
            Time {sortBy === "time" ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
        </div>

        {loading && <LoadingScreen label="Loading missions..." />}

        {!loading && (
          <div style={pageContentScrollStyle}>
            {visibleMissions.map((m) => {
              const statusPanel = getStatusPanel(m);

              return (
                <div
                  key={m.id}
                  style={{
                    border: "1px solid #9d8560",
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "rgba(0,0,0,0.58)",
                  }}
                >
                  <div
                    style={{
                      minHeight: 260,
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: 18,
                      alignItems: "stretch",
                      backgroundImage: `linear-gradient(${getMissionOverlay(
                        m.status,
                        m.wasSuccessful,
                      )}, ${getMissionOverlay(m.status, m.wasSuccessful)}), url(${getMissionTerrainBanner(
                        m.terrain,
                      )})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div style={{ padding: 16 }}>
                      <div
                        style={{
                          maxWidth: 1040,
                          border: "1px solid rgba(255,255,255,0.16)",
                          borderRadius: 12,
                          padding: 18,
                          background: "rgba(20,20,20,0.70)",
                          backdropFilter: "blur(2px)",
                          marginBottom: 14,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                            marginBottom: 10,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 24,
                              fontWeight: 800,
                              color: "#efb85f",
                              fontFamily: "monospace",
                            }}
                          >
                            {m.name}
                          </div>

                          <MissionStatusBadge status={m.status} />
                          {renderOutcomeBadge(m)}
                          <MissionMetaBadge>{m.terrain ?? "No terrain"}</MissionMetaBadge>
                          <MissionMetaBadge>{m.difficulty ?? "No difficulty"}</MissionMetaBadge>
                        </div>

                        <div style={metaLineStyle}>
                          Status: {formatMissionStatus(m.status)}
                        </div>
                        <div style={metaLineStyle}>
                          Activated At:{" "}
                          {m.activatedAt
                            ? new Date(m.activatedAt).toLocaleString()
                            : "—"}
                        </div>
                        <div style={metaLineStyle}>
                          Duration:{" "}
                          {m.durationMinutes != null
                            ? `${m.durationMinutes} min`
                            : "—"}
                        </div>
                        <div style={metaLineStyle}>
                          Executed At:{" "}
                          {m.executedAt
                            ? new Date(m.executedAt).toLocaleString()
                            : "—"}
                        </div>
                        <div style={metaLineStyle}>
                          Success Snapshot:{" "}
                          {m.successChanceSnapshot != null
                            ? `${m.successChanceSnapshot}%`
                            : "—"}
                        </div>
                      </div>

                      <div
                        style={{
                          ...statusPanelStyle,
                          background: statusPanel.background,
                          border: statusPanel.border,
                          marginBottom: 14,
                          maxWidth: 620,
                        }}
                      >
                        <div
                          style={{
                            ...statusPanelTitleStyle,
                            color: statusPanel.titleColor,
                          }}
                        >
                          {statusPanel.title}
                        </div>

                        <div
                          style={{
                            ...detailsLineStyle,
                            color: statusPanel.textColor,
                          }}
                        >
                          {statusPanel.text}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 14,
                        }}
                      >
                        <div style={detailsCardStyle}>
                          <div style={detailsTitleStyle}>Mission Overview</div>
                          <div style={detailsLineStyle}>
                            Terrain: {m.terrain ?? "—"}
                          </div>
                          <div style={detailsLineStyle}>
                            Difficulty: {m.difficulty ?? "—"}
                          </div>
                          <div style={detailsLineStyle}>
                            Current State: {formatMissionStatus(m.status)}
                          </div>
                          {m.status === "Active" && (
                            <div style={detailsLineStyle}>
                              Status Window:{" "}
                              {formatRemainingTime(
                                m.activatedAt,
                                m.durationMinutes,
                              )}
                            </div>
                          )}
                        </div>

                        <div style={detailsCardStyle}>
                          <div style={detailsTitleStyle}>Outcome</div>
                          <div style={detailsLineStyle}>
                            Result:{" "}
                            {m.wasSuccessful == null
                              ? "Pending / Unknown"
                              : m.wasSuccessful
                                ? "Success"
                                : "Failure"}
                          </div>
                          <div style={detailsLineStyle}>
                            Snapshot:{" "}
                            {m.successChanceSnapshot != null
                              ? `${m.successChanceSnapshot}%`
                              : "—"}
                          </div>
                          <div style={detailsLineStyle}>
                            Execution Time:{" "}
                            {m.executedAt
                              ? new Date(m.executedAt).toLocaleString()
                              : "—"}
                          </div>
                        </div>
                      </div>

                      {m.notes && (
                        <div
                          style={{
                            ...detailsCardStyle,
                            marginTop: 14,
                          }}
                        >
                          <div style={detailsTitleStyle}>Mission Notes</div>
                          <div
                            style={{
                              ...detailsLineStyle,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {m.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {!error && visibleMissions.length === 0 && (
              <div style={{ color: "#f3efe6", fontFamily: "monospace" }}>
                No missions assigned.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}