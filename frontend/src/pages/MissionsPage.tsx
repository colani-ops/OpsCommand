import { useCallback, useEffect, useMemo, useState } from "react";
import { hasRole } from "../api/auth";
import { Navigate } from "react-router-dom";
import { getUsers, type UserDto } from "../api/users";
import {
  assignCommander,
  createMission,
  deleteMission,
  executeMission,
  getMissions,
  getMissionReadiness,
  type MissionDifficulty,
  type MissionDto,
  type MissionReadinessDto,
  type MissionTerrain,
  unassignCommander,
  updateMission,
  activateMission,
  cancelMission,
} from "../api/missions";
import { useErrorHandler } from "../hooks/useErrorHandler";
import ErrorBanner from "../components/ErrorBanner";

import MissionStatusBadge from "../components/MissionStatusBadge";
import MissionMetaBadge from "../components/MissionMetaBadge";
import MissionOutcome from "../components/MissionOutcome";


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



  const { error, showError, clearError } = useErrorHandler();



  const [readinessByMissionId, setReadinessByMissionId] = useState<Record<number, MissionReadinessDto | undefined>>({});
  const [loadingReadinessId, setLoadingReadinessId] = useState<number | null>(null);



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



  const commanderNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of commanders) {
      map.set(c.id, `${c.userName} (${c.email})`);
    }
    return map;
  }, [commanders]);



  const [, setNowTick] = useState(0);
    useEffect(() => {
      const interval = setInterval(() => {
        setNowTick((v) => v + 1);
      }, 1000);

      return () => clearInterval(interval);
    }, []);



  if (!canAccess) {
    return <Navigate to="/" replace />;
  }



  function commanderDisplay(commanderId: string | null) {
    if (!commanderId) return "—";
    return commanderNameById.get(commanderId) ?? commanderId;
  }

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

  async function onLoadReadiness(id: number) {
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

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ marginRight: "auto" }}>Missions</h2>

        {canManage && (
          <button onClick={() => setShowCreate((v) => !v)} style={{ padding: "8px 12px", borderRadius: 8 }}>
            {showCreate ? "Close" : "New Mission"}
          </button>
        )}

        <button onClick={load} style={{ padding: "8px 12px", borderRadius: 8 }}>
          Refresh
        </button>
      </div>

      <ErrorBanner error={error} />
      {loading && <div style={{ marginTop: 10 }}>Loading...</div>}

      {canManage && showCreate && (
        <form
          onSubmit={submitCreate}
          style={{
            marginTop: 14,
            border: "1px solid #333",
            borderRadius: 12,
            padding: 14,
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 700 }}>Create Mission</div>

          <input
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Name"
            required
            style={{ padding: 10, borderRadius: 8 }}
          />

          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontWeight: 600 }}>Commander</label>
            <select
              value={createForm.commanderId}
              onChange={(e) => setCreateForm((f) => ({ ...f, commanderId: e.target.value }))}
              style={{ padding: 10, borderRadius: 8 }}
            >
              <option value="">— Commander (optional) —</option>
              {commanders.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.userName} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontWeight: 600 }}>Terrain</label>
            <select
              value={createForm.terrain}
              onChange={(e) => setCreateForm((f) => ({ ...f, terrain: e.target.value as MissionTerrain }))}
              style={{ padding: 10, borderRadius: 8 }}
            >
              {TERRAINS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontWeight: 600 }}>Difficulty</label>
            <select
              value={createForm.difficulty}
              onChange={(e) => setCreateForm((f) => ({ ...f, difficulty: e.target.value as MissionDifficulty }))}
              style={{ padding: 10, borderRadius: 8 }}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={createForm.notes}
            onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)"
            rows={3}
            style={{ padding: 10, borderRadius: 8 }}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ padding: "10px 14px", borderRadius: 8 }}>Create</button>
            <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "10px 14px", borderRadius: 8 }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {!loading && (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {items.map((m) => {
            const isEditing = editingId === m.id;

            const isCompleted = m.status === "Completed";
            const canEditCore =
              m.status === "Prepared" ||
              m.status === "Planned" ||
              m.status === "Cancelled";

            const canEditNotesOnly = isCompleted || m.status === "Active";
            const disableCoreFields = !canEditCore;
            const showEditHint = isCompleted || m.status === "Active";

            const readiness = readinessByMissionId[m.id];
            const canPreviewReadiness =
              m.status === "Planned";

            const isReadyForExecution = isMissionReadyForExecution(m.activatedAt, m.durationMinutes);
            
            
            
            return (
              <div
                key={m.id}
                style={{
                  border: "1px solid #333",
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  {showEditHint && (
                    <div style={{ color: "#bbb", fontSize: 14, marginBottom: 8 }}>
                      {isCompleted
                        ? "Completed missions allow notes-only editing."
                        : "Active missions are locked for core changes. Notes can still be updated."}
                    </div>
                  )}

                  {!isEditing ? (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{m.name}</div>
                          <MissionStatusBadge status={m.status} />
                          <MissionMetaBadge>{m.terrain ?? "No terrain"}</MissionMetaBadge>
                          <MissionMetaBadge>{m.difficulty ?? "No difficulty"}</MissionMetaBadge>
                      </div>

                      <div style={{ opacity: 0.85, marginTop: 10 }}>
                        Commander: {commanderDisplay(m.commanderId)}
                      </div>

                      <div style={{ opacity: 0.85 }}>SquadId: {m.squadId ?? "—"}</div>

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
                        <b>Activated At:</b> {" "}
                        {m.activatedAt ? new Date(m.activatedAt).toLocaleString() : "—"}</div>
                      <div>
                        <b>Duration:</b>  {" "}
                        {m.durationMinutes != null ? `${m.durationMinutes} min` : "—"}</div>
                      <div>
                        <b>Status Window:</b> {" "}
                        {formatRemainingTime(m.activatedAt, m.durationMinutes)}</div>
                    </div>
                    )}

                      <div style={{ opacity: 0.85, marginTop: 6 }}>
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

                      {canPreviewReadiness && (
                        <div style={{ marginTop: 12 }}>
                          {!readiness ? (
                            <button
                              onClick={() => onLoadReadiness(m.id)}
                              disabled={loadingReadinessId === m.id}
                              style={{ padding: "6px 10px", borderRadius: 8 }}
                            >
                              {loadingReadinessId === m.id ? "Loading readiness..." : "Preview Readiness"}
                            </button>
                          ) : (
                            <div
                              style={{
                              marginTop: 10,
                              padding: 10,
                              borderRadius: 8,
                              background: "#101820",
                              border: "1px solid #2c3e50",
                              }}
                            >
                              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                                Mission Readiness · {readiness.readinessLabel}
                              </div>

                              <div style={{ opacity: 0.9 }}>
                                Projected Success: {readiness.projectedSuccessChance}%
                              </div>
                              <div style={{ opacity: 0.9 }}>
                                Base Score: {readiness.baseScore}
                              </div>
                              <div style={{ opacity: 0.9 }}>
                                Difficulty Modifier: {readiness.difficultyModifier}
                              </div>
                              <div style={{ opacity: 0.9 }}>
                                Equipment Score: {readiness.equipmentScore}
                              </div>
                              <div style={{ opacity: 0.9 }}>
                                Final Score: {readiness.finalScore}
                              </div>
                              <div style={{ opacity: 0.9, marginTop: 6 }}>
                                Recommended Focus:{" "}
                                {readiness.recommendedCategories.length > 0
                                ? readiness.recommendedCategories.join(", ")
                                : "—"}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {canManage && (
                        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                          {m.status === "Planned" && (
                            <button onClick={() => onActivate(m.id)} style={{ padding: "6px 10px", borderRadius: 8 }}>
                              Activate
                            </button>
                          )}

                          {m.status === "Active" && !isReadyForExecution && (
                            <span style={{ opacity: 0.75, fontSize: 14 }}>
                              Execution available when timer expires.
                          </span>
                          )}

                          {m.status === "Active" && isReadyForExecution && (
                            <button onClick={() => onExecute(m.id)} style={{ padding: "6px 10px", borderRadius: 8 }}>
                              Execute
                            </button>
                          )}

                          {m.status !== "Completed" && m.status !== "Cancelled" && (
                            <button onClick={() => onCancel(m.id)} style={{ padding: "6px 10px", borderRadius: 8 }}>
                              Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>Editing Mission #{m.id}</div>

                      <div style={{ display: "grid", gap: 10 }}>
                        <input
                          value={editForm?.name ?? ""}
                          onChange={(e) => setEditForm((f) => (f ? { ...f, name: e.target.value } : f))}
                          placeholder="Name"
                          style={{ padding: 10, borderRadius: 8 }}
                          disabled={disableCoreFields}
                        />

                        <div style={{ display: "grid", gap: 6 }}>
                          <label style={{ fontWeight: 600 }}>Commander</label>
                          <select
                            value={editForm?.commanderId ?? ""}
                            onChange={(e) => setEditForm((f) => (f ? { ...f, commanderId: e.target.value } : f))}
                            style={{ padding: 10, borderRadius: 8 }}
                            disabled={disableCoreFields}
                          >
                            <option value="">— None —</option>
                            {commanders.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.userName} ({c.email})
                              </option>
                            ))}
                          </select>
                        </div>

                        <textarea
                          value={editForm?.notes ?? ""}
                          onChange={(e) => setEditForm((f) => (f ? { ...f, notes: e.target.value } : f))}
                          placeholder="Notes"
                          rows={4}
                          style={{ padding: 10, borderRadius: 8 }}
                          disabled={!canEditCore && !canEditNotesOnly}
                        />

                        <div style={{ display: "grid", gap: 6 }}>
                          <label style={{ fontWeight: 600 }}>Terrain</label>
                          <select
                            value={editForm?.terrain ?? "Urban"}
                            onChange={(e) =>
                              setEditForm((f) => (f ? { ...f, terrain: e.target.value as MissionTerrain } : f))
                            }
                            style={{ padding: 10, borderRadius: 8 }}
                            disabled={disableCoreFields}
                          >
                            {TERRAINS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: "grid", gap: 6 }}>
                          <label style={{ fontWeight: 600 }}>Difficulty</label>
                          <select
                            value={editForm?.difficulty ?? "Medium"}
                            onChange={(e) =>
                              setEditForm((f) => (f ? { ...f, difficulty: e.target.value as MissionDifficulty } : f))
                            }
                            style={{ padding: 10, borderRadius: 8 }}
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
                    </>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {canManage ? (
                    !isEditing ? (
                      <>
                        <button onClick={() => startEdit(m)} style={{ padding: "8px 12px", borderRadius: 8 }}>
                          Edit
                        </button>
                        <button onClick={() => onDelete(m.id)} style={{ padding: "8px 12px", borderRadius: 8 }}>
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={submitEdit} style={{ padding: "8px 12px", borderRadius: 8 }}>
                          Save
                        </button>
                        <button onClick={cancelEdit} style={{ padding: "8px 12px", borderRadius: 8 }}>
                          Cancel
                        </button>
                      </>
                    )
                  ) : (
                    <span style={{ opacity: 0.6, fontSize: 14 }}>Read-only</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && items.length === 0 && <div style={{ marginTop: 14 }}>No missions yet.</div>}
    </div>
  );
}