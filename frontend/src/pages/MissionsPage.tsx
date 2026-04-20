import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { hasRole } from "../api/auth";
import { getUsers, type UserDto } from "../api/users";
import {
  assignCommander,
  activateMission,
  cancelMission,
  createMission,
  deleteMission,
  executeMission,
  getMissionReadiness,
  getMissions,
  type MissionDifficulty,
  type MissionDto,
  type MissionReadinessDto,
  type MissionTerrain,
  unassignCommander,
  updateMission,
} from "../api/missions";
import { useErrorHandler } from "../hooks/useErrorHandler";
import ErrorBanner from "../components/ErrorBanner";
import MissionStatusBadge from "../components/MissionStatusBadge";
import MissionMetaBadge from "../components/MissionMetaBadge";

type CreateForm = {
  name: string;
  commanderId: string;
  notes: string;
  terrain: MissionTerrain;
  difficulty: MissionDifficulty;
};

type EditForm = {
  name: string;
  notes: string;
  commanderId: string;
  terrain: MissionTerrain;
  difficulty: MissionDifficulty;
};

const TERRAINS: MissionTerrain[] = ["Urban", "Plains", "Forest", "Mountain"];
const DIFFICULTIES: MissionDifficulty[] = [
  "Very Low",
  "Low",
  "Medium",
  "High",
  "Very High",
];

export default function MissionsPage() {
  const canManage = hasRole("Admin", "SuperAdmin");
  const canAccess = hasRole("Admin", "SuperAdmin");

  const [items, setItems] = useState<MissionDto[]>([]);
  const [commanders, setCommanders] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "terrain" | "difficulty" | "status">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: "",
    commanderId: "",
    notes: "",
    terrain: "Urban",
    difficulty: "Medium",
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const [expandedMissionId, setExpandedMissionId] = useState<number | null>(null);
  const [readinessByMissionId, setReadinessByMissionId] = useState<
    Record<number, MissionReadinessDto | undefined>
  >({});
  const [loadingReadinessId, setLoadingReadinessId] = useState<number | null>(null);

  const { error, showError, clearError } = useErrorHandler();

  const load = useCallback(async () => {
    clearError();
    setLoading(true);
    setReadinessByMissionId({});

    try {
      const missionsData = await getMissions();
      setItems(missionsData);

      if (canManage) {
        const usersData = await getUsers();
        setCommanders(usersData.filter((u) => u.roles?.includes("Commander")));
      } else {
        setCommanders([]);
      }
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Failed to load missions");
    } finally {
      setLoading(false);
    }
  }, [canManage, clearError, showError]);

  useEffect(() => {
    load();
  }, [load]);

  const [, setNowTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setNowTick((v) => v + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const commanderNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of commanders) {
      map.set(c.id, `${c.userName} (${c.email})`);
    }
    return map;
  }, [commanders]);

  function commanderDisplay(commanderId: string | null) {
    if (!commanderId) return "—";
    return commanderNameById.get(commanderId) ?? commanderId;
  }

  function formatMissionStatus(status: string) {
    return status === "Active" ? "In Progress" : status;
  }

  function getMissionTerrainBanner(terrain: string | null) {
    switch (terrain) {
      case "Urban":
        return "/mission-urban.png";
      case "Plains":
        return "/mission-plains.png";
      case "Forest":
        return "/mission-forest.png";
      case "Mountain":
        return "/mission-mountain.png";
      default:
        return "/mission-default.png";
    }
  }

  function getMissionOverlay(status: string, wasSuccessful: boolean | null) {
    if (status === "Prepared") return "rgba(120,120,120,0.20)";
    if (status === "Planned") return "rgba(70,110,160,0.20)";
    if (status === "Active") return "rgba(185,145,45,0.18)";
    if (status === "Cancelled") return "rgba(120,70,70,0.24)";
    if (status === "Completed" && wasSuccessful === true) return "rgba(60,135,70,0.20)";
    if (status === "Completed" && wasSuccessful === false) return "rgba(150,65,65,0.22)";
    return "rgba(0,0,0,0.28)";
  }

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

  function isMissionReadyForExecution(activatedAt: string | null, durationMinutes: number | null) {
    if (!activatedAt || durationMinutes == null) return false;

    const activated = new Date(activatedAt).getTime();
    const readyAt = activated + durationMinutes * 60 * 1000;
    return Date.now() >= readyAt;
  }

  function getMissionSummaryText(m: MissionDto) {
    const ready = isMissionReadyForExecution(m.activatedAt, m.durationMinutes);

    switch (m.status) {
      case "Prepared":
        return "Awaiting commander assignment.";
      case "Planned":
        return "Planning phase. Review readiness before activation.";
      case "Active":
        return ready
          ? "Mission window complete. Ready for execution."
          : formatRemainingTime(m.activatedAt, m.durationMinutes);
      case "Cancelled":
        return "Mission was cancelled.";
      case "Completed":
        if (m.wasSuccessful == null) return "Mission completed.";
        return m.wasSuccessful
          ? `Success · Snapshot ${m.successChanceSnapshot ?? "—"}%`
          : `Failure · Snapshot ${m.successChanceSnapshot ?? "—"}%`;
      default:
        return "—";
    }
  }

  function toggleSort(next: "name" | "terrain" | "difficulty" | "status") {
    if (sortBy === next) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(next);
    setSortDir("asc");
  }

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = items.filter((m) => {
      if (!q) return true;

      return (
        m.name.toLowerCase().includes(q) ||
        (m.terrain ?? "").toLowerCase().includes(q) ||
        (m.difficulty ?? "").toLowerCase().includes(q) ||
        formatMissionStatus(m.status).toLowerCase().includes(q) ||
        commanderDisplay(m.commanderId).toLowerCase().includes(q) ||
        (m.notes ?? "").toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      let result = 0;

      switch (sortBy) {
        case "name":
          result = a.name.localeCompare(b.name);
          break;
        case "terrain":
          result = (a.terrain ?? "").localeCompare(b.terrain ?? "");
          break;
        case "difficulty":
          result = (a.difficulty ?? "").localeCompare(b.difficulty ?? "");
          break;
        case "status":
          result = formatMissionStatus(a.status).localeCompare(formatMissionStatus(b.status));
          break;
      }

      return sortDir === "asc" ? result : -result;
    });

    return sorted;
  }, [items, search, sortBy, sortDir, commanders]);

  function startEdit(m: MissionDto) {
    setEditingId(m.id);
    setEditForm({
      name: m.name,
      notes: m.notes ?? "",
      commanderId: m.commanderId ?? "",
      terrain: (m.terrain as MissionTerrain) ?? "Urban",
      difficulty: (m.difficulty as MissionDifficulty) ?? "Medium",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    clearError();

    const payload = {
      name: createForm.name.trim(),
      commanderId: createForm.commanderId.trim() ? createForm.commanderId.trim() : null,
      notes: createForm.notes.trim() ? createForm.notes.trim() : null,
      terrain: createForm.terrain,
      difficulty: createForm.difficulty,
    };

    try {
      await createMission(payload);
      setCreateForm({
        name: "",
        commanderId: "",
        notes: "",
        terrain: "Urban",
        difficulty: "Medium",
      });
      setShowCreate(false);
      await load();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Create failed");
    }
  }

  async function submitEdit() {
    if (!editingId || !editForm) return;
    clearError();

    try {
      const currentMission = items.find((x) => x.id === editingId);
      if (!currentMission) return;

      const isCompleted = currentMission.status === "Completed";
      const canEditCore =
        currentMission.status === "Prepared" ||
        currentMission.status === "Planned" ||
        currentMission.status === "Cancelled";

      const canChangeCommander =
        currentMission.status === "Prepared" ||
        currentMission.status === "Planned" ||
        currentMission.status === "Cancelled";

      const desiredCommander = editForm.commanderId.trim() ? editForm.commanderId.trim() : null;
      const currentCommander = currentMission.commanderId ?? null;

      if (canChangeCommander && desiredCommander !== currentCommander) {
        if (!desiredCommander) {
          await unassignCommander(editingId);
        } else {
          await assignCommander(editingId, desiredCommander);
        }
      }

      const payload = isCompleted
        ? {
            notes: editForm.notes.trim() ? editForm.notes.trim() : null,
          }
        : canEditCore
          ? {
              name: editForm.name.trim() || null,
              notes: editForm.notes.trim() ? editForm.notes.trim() : null,
              terrain: editForm.terrain,
              difficulty: editForm.difficulty,
            }
          : {
              notes: editForm.notes.trim() ? editForm.notes.trim() : null,
            };

      await updateMission(editingId, payload);

      cancelEdit();
      await load();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Soft-delete this mission?")) return;
    clearError();

    try {
      await deleteMission(id);
      if (editingId === id) cancelEdit();
      if (expandedMissionId === id) setExpandedMissionId(null);
      await load();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function onActivate(id: number) {
    clearError();

    const raw = prompt("Mission duration in minutes:", "30");
    if (raw == null) return;

    const durationMinutes = Number(raw);
    if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
      showError("Duration must be a positive number of minutes.");
      return;
    }

    try {
      await activateMission(id, { durationMinutes });
      await load();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Activate failed");
    }
  }

  async function onCancel(id: number) {
    clearError();
    try {
      const notes = prompt("Cancel reason (optional):") ?? "";
      await cancelMission(id, notes.trim() ? notes : null);
      await load();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Cancel failed");
    }
  }

  async function onExecute(id: number) {
    clearError();
    try {
      await executeMission(id);
      await load();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Execute failed");
    }
  }

  async function toggleDetails(id: number) {
    if (expandedMissionId === id) {
      setExpandedMissionId(null);
      return;
    }

    setExpandedMissionId(id);

    const mission = items.find((x) => x.id === id);
    if (!mission) return;

    if (mission.status === "Planned" && !readinessByMissionId[id]) {
      clearError();
      setLoadingReadinessId(id);

      try {
        const readiness = await getMissionReadiness(id);
        setReadinessByMissionId((prev) => ({
          ...prev,
          [id]: readiness,
        }));
      } catch (e: unknown) {
        showError(e instanceof Error ? e.message : "Failed to load readiness");
      } finally {
        setLoadingReadinessId(null);
      }
    }
  }

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <ErrorBanner error={error} />

      <div
        style={{
          border: "2px solid #c9a56a",
          borderRadius: 14,
          background: "rgba(0, 0, 0, 0.78)",
          padding: 24,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr auto auto",
            gap: 16,
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#f3efe6",
              fontFamily: "monospace",
              fontSize: 28,
            }}
          >
            Missions
          </h2>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            style={{
              height: 44,
              borderRadius: 10,
              border: "1px solid #9d8560",
              background: "rgba(201,165,106,0.22)",
              color: "#f3efe6",
              padding: "0 14px",
              fontFamily: "monospace",
              fontSize: 16,
            }}
          />

          {canManage && (
            <button
              onClick={() => setShowCreate((v) => !v)}
              style={toolbarButtonStyle}
            >
              {showCreate ? "Close" : "New Mission"}
            </button>
          )}

          <button onClick={load} style={toolbarButtonStyle}>
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
          <button onClick={() => toggleSort("name")} style={sortButtonStyle}>
            Name {sortBy === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
          <button onClick={() => toggleSort("terrain")} style={sortButtonStyle}>
            Terrain {sortBy === "terrain" ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
          <button onClick={() => toggleSort("difficulty")} style={sortButtonStyle}>
            Difficulty {sortBy === "difficulty" ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
          <button onClick={() => toggleSort("status")} style={sortButtonStyle}>
            Status {sortBy === "status" ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
        </div>

        {loading && <div style={{ marginTop: 10, color: "#f3efe6" }}>Loading...</div>}

        {canManage && showCreate && (
          <form
            onSubmit={submitCreate}
            style={{
              marginBottom: 18,
              border: "1px solid #9d8560",
              borderRadius: 12,
              padding: 14,
              display: "grid",
              gap: 10,
              background: "rgba(0,0,0,0.45)",
            }}
          >
            <div style={{ fontWeight: 700, color: "#f3efe6", fontFamily: "monospace" }}>
              Create Mission
            </div>

            <input
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Name"
              required
              style={formFieldStyle}
            />

            <select
              value={createForm.commanderId}
              onChange={(e) => setCreateForm((f) => ({ ...f, commanderId: e.target.value }))}
              style={formFieldStyle}
            >
              <option value="">— Commander (optional) —</option>
              {commanders.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.userName} ({c.email})
                </option>
              ))}
            </select>

            <select
              value={createForm.terrain}
              onChange={(e) => setCreateForm((f) => ({ ...f, terrain: e.target.value as MissionTerrain }))}
              style={formFieldStyle}
            >
              {TERRAINS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={createForm.difficulty}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, difficulty: e.target.value as MissionDifficulty }))
              }
              style={formFieldStyle}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <textarea
              value={createForm.notes}
              onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Notes (optional)"
              rows={3}
              style={formFieldStyle}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button style={toolbarButtonStyle}>Create</button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                style={secondaryButtonStyle}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {!loading && (
          <div
            style={{
              maxHeight: "62vh",
              overflowY: "auto",
              display: "grid",
              gap: 14,
              paddingRight: 6,
            }}
          >
            {visibleItems.map((m) => {
              const isEditing = editingId === m.id;
              const readiness = readinessByMissionId[m.id];
              const isReadyForExecution = isMissionReadyForExecution(m.activatedAt, m.durationMinutes);
              const isExpanded = expandedMissionId === m.id;

              const isCompleted = m.status === "Completed";
              const canEditCore =
                m.status === "Prepared" ||
                m.status === "Planned" ||
                m.status === "Cancelled";

              const canEditNotesOnly = isCompleted || m.status === "Active";
              const disableCoreFields = !canEditCore;

              return (
                <div
                  key={m.id}
                  style={{
                    border: "1px solid #9d8560",
                    borderRadius: 14,
                    background: "rgba(0,0,0,0.58)",
                    overflow: "hidden",
                  }}
                >
                  {!isEditing ? (
                    <>
                      <div
                        style={{
                          minHeight: 170,
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: 18,
                          alignItems: "stretch",
                          backgroundImage: `linear-gradient(${getMissionOverlay(
                            m.status,
                            m.wasSuccessful
                          )}, ${getMissionOverlay(m.status, m.wasSuccessful)}), url(${getMissionTerrainBanner(
                            m.terrain
                          )})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div style={{ padding: 14 }}>
                          <div
                            style={{
                              maxWidth: 760,
                              border: "1px solid rgba(255,255,255,0.16)",
                              borderRadius: 12,
                              padding: 16,
                              background: "rgba(20,20,20,0.68)",
                              backdropFilter: "blur(2px)",
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
                              <MissionMetaBadge>{m.terrain ?? "No terrain"}</MissionMetaBadge>
                              <MissionMetaBadge>{m.difficulty ?? "No difficulty"}</MissionMetaBadge>
                            </div>

                            <div style={metaLineStyle}>Commander: {commanderDisplay(m.commanderId)}</div>
                            <div style={metaLineStyle}>Squad ID: {m.squadId ?? "—"}</div>
                            <div style={metaLineStyle}>Summary: {getMissionSummaryText(m)}</div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: 14,
                            flexWrap: "wrap",
                          }}
                        >
                          <button onClick={() => toggleDetails(m.id)} style={iconActionButtonStyle}>
                            {isExpanded ? "Hide" : "Details"}
                          </button>

                          {canManage && (
                            <>
                              <button onClick={() => startEdit(m)} style={iconActionButtonStyle}>
                                Edit
                              </button>
                              <button onClick={() => onDelete(m.id)} style={iconActionButtonStyle}>
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div
                          style={{
                            padding: 16,
                            borderTop: "1px solid rgba(201,165,106,0.35)",
                            background: "rgba(0,0,0,0.70)",
                            display: "grid",
                            gap: 14,
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 14,
                            }}
                          >
                            <div style={detailsCardStyle}>
                              <div style={detailsTitleStyle}>Mission Overview</div>
                              <div style={detailsLineStyle}>Created At: {new Date(m.createdAt).toLocaleString()}</div>
                              <div style={detailsLineStyle}>
                                Activated At: {m.activatedAt ? new Date(m.activatedAt).toLocaleString() : "—"}
                              </div>
                              <div style={detailsLineStyle}>
                                Duration: {m.durationMinutes != null ? `${m.durationMinutes} min` : "—"}
                              </div>
                              <div style={detailsLineStyle}>
                                Executed At: {m.executedAt ? new Date(m.executedAt).toLocaleString() : "—"}
                              </div>
                              <div style={detailsLineStyle}>Commander: {commanderDisplay(m.commanderId)}</div>
                              <div style={detailsLineStyle}>Squad ID: {m.squadId ?? "—"}</div>
                            </div>

                            <div style={detailsCardStyle}>
                              <div style={detailsTitleStyle}>Outcome / Status</div>
                              <div style={detailsLineStyle}>Status: {formatMissionStatus(m.status)}</div>
                              <div style={detailsLineStyle}>
                                Success Snapshot: {m.successChanceSnapshot != null ? `${m.successChanceSnapshot}%` : "—"}
                              </div>
                              <div style={detailsLineStyle}>
                                Result:{" "}
                                {m.wasSuccessful == null ? "—" : m.wasSuccessful ? "Success" : "Failure"}
                              </div>
                              {m.status === "Active" && (
                                <div style={detailsLineStyle}>
                                  Status Window: {formatRemainingTime(m.activatedAt, m.durationMinutes)}
                                </div>
                              )}
                            </div>
                          </div>

                          {m.status === "Planned" && (
                            <div style={detailsCardStyle}>
                              <div style={detailsTitleStyle}>Mission Readiness</div>

                              {loadingReadinessId === m.id && (
                                <div style={detailsLineStyle}>Loading readiness...</div>
                              )}

                              {!loadingReadinessId && readiness && (
                                <>
                                  <div style={detailsLineStyle}>
                                    Projected Success: {readiness.projectedSuccessChance}%
                                  </div>
                                  <div style={detailsLineStyle}>Readiness Label: {readiness.readinessLabel}</div>
                                  <div style={detailsLineStyle}>Base Score: {readiness.baseScore}</div>
                                  <div style={detailsLineStyle}>
                                    Difficulty Modifier: {readiness.difficultyModifier}
                                  </div>
                                  <div style={detailsLineStyle}>Equipment Score: {readiness.equipmentScore}</div>
                                  <div style={detailsLineStyle}>Final Score: {readiness.finalScore}</div>
                                  <div style={detailsLineStyle}>
                                    Recommended Focus:{" "}
                                    {readiness.recommendedCategories.length > 0
                                      ? readiness.recommendedCategories.join(", ")
                                      : "—"}
                                  </div>
                                </>
                              )}

                              {!loadingReadinessId && !readiness && (
                                <div style={detailsLineStyle}>No readiness data available.</div>
                              )}
                            </div>
                          )}

                          {m.notes && (
                            <div style={detailsCardStyle}>
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

                          {canManage && (
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              {m.status === "Planned" && (
                                <button onClick={() => onActivate(m.id)} style={toolbarButtonStyle}>
                                  Activate
                                </button>
                              )}

                              {m.status === "Active" && !isReadyForExecution && (
                                <span style={{ ...detailsLineStyle, alignSelf: "center" }}>
                                  Execution available when timer expires.
                                </span>
                              )}

                              {m.status === "Active" && isReadyForExecution && (
                                <button onClick={() => onExecute(m.id)} style={toolbarButtonStyle}>
                                  Execute
                                </button>
                              )}

                              {m.status !== "Completed" && m.status !== "Cancelled" && (
                                <button onClick={() => onCancel(m.id)} style={secondaryButtonStyle}>
                                  Cancel
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      style={{
                        padding: 14,
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: 18,
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            marginBottom: 8,
                            color: "#f3efe6",
                            fontFamily: "monospace",
                          }}
                        >
                          Editing Mission #{m.id}
                        </div>

                        <div style={{ display: "grid", gap: 10 }}>
                          <input
                            value={editForm?.name ?? ""}
                            onChange={(e) => setEditForm((f) => (f ? { ...f, name: e.target.value } : f))}
                            placeholder="Name"
                            style={formFieldStyle}
                            disabled={disableCoreFields}
                          />

                          <select
                            value={editForm?.commanderId ?? ""}
                            onChange={(e) =>
                              setEditForm((f) => (f ? { ...f, commanderId: e.target.value } : f))
                            }
                            style={formFieldStyle}
                            disabled={disableCoreFields}
                          >
                            <option value="">— None —</option>
                            {commanders.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.userName} ({c.email})
                              </option>
                            ))}
                          </select>

                          <textarea
                            value={editForm?.notes ?? ""}
                            onChange={(e) => setEditForm((f) => (f ? { ...f, notes: e.target.value } : f))}
                            placeholder="Notes"
                            rows={4}
                            style={formFieldStyle}
                            disabled={!canEditCore && !canEditNotesOnly}
                          />

                          <select
                            value={editForm?.terrain ?? "Urban"}
                            onChange={(e) =>
                              setEditForm((f) => (f ? { ...f, terrain: e.target.value as MissionTerrain } : f))
                            }
                            style={formFieldStyle}
                            disabled={disableCoreFields}
                          >
                            {TERRAINS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>

                          <select
                            value={editForm?.difficulty ?? "Medium"}
                            onChange={(e) =>
                              setEditForm((f) => (f ? { ...f, difficulty: e.target.value as MissionDifficulty } : f))
                            }
                            style={formFieldStyle}
                            disabled={disableCoreFields}
                          >
                            {DIFFICULTIES.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <button onClick={submitEdit} style={iconActionButtonStyle}>
                          Save
                        </button>
                        <button onClick={cancelEdit} style={iconActionButtonStyle}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {!error && visibleItems.length === 0 && (
              <div style={{ color: "#f3efe6", fontFamily: "monospace" }}>
                No missions found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const toolbarButtonStyle: React.CSSProperties = {
  height: 44,
  padding: "0 16px",
  borderRadius: 10,
  border: "1px solid #c9a56a",
  background: "#c9a56a",
  color: "#1d1812",
  fontFamily: "monospace",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  height: 44,
  padding: "0 16px",
  borderRadius: 10,
  border: "1px solid #9d8560",
  background: "rgba(201,165,106,0.18)",
  color: "#f3efe6",
  fontFamily: "monospace",
  fontWeight: 800,
  cursor: "pointer",
};

const sortButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 10,
  border: "1px solid #9d8560",
  background: "rgba(201,165,106,0.16)",
  color: "#f3efe6",
  fontFamily: "monospace",
  fontWeight: 700,
  cursor: "pointer",
};

const iconActionButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #9d8560",
  background: "rgba(201,165,106,0.12)",
  color: "#f3efe6",
  fontFamily: "monospace",
  fontWeight: 700,
  cursor: "pointer",
};

const formFieldStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #9d8560",
  background: "rgba(0,0,0,0.55)",
  color: "#f3efe6",
  fontFamily: "monospace",
};

const metaLineStyle: React.CSSProperties = {
  color: "#d7b176",
  fontFamily: "monospace",
  fontSize: 16,
  marginBottom: 4,
};

const detailsCardStyle: React.CSSProperties = {
  border: "1px solid rgba(201,165,106,0.35)",
  borderRadius: 12,
  padding: 14,
  background: "rgba(20,20,20,0.55)",
};

const detailsTitleStyle: React.CSSProperties = {
  color: "#efb85f",
  fontFamily: "monospace",
  fontWeight: 800,
  fontSize: 18,
  marginBottom: 10,
};

const detailsLineStyle: React.CSSProperties = {
  color: "#f3efe6",
  fontFamily: "monospace",
  fontSize: 14,
  marginBottom: 6,
};