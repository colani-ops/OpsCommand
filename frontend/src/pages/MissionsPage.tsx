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
  type MissionDifficulty,
  type MissionDto,
  type MissionTerrain,
  unassignCommander,
  updateMission,
  activateMission,
  completeMission,
  cancelMission,
} from "../api/missions";
import { useErrorHandler } from "../hooks/useErrorHandler";
import ErrorBanner from "../components/ErrorBanner";

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
const DIFFICULTIES: MissionDifficulty[] = ["Low", "Medium", "High"];

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

  const load = useCallback(async () => {
    clearError();
    setLoading(true);
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
    for (const c of commanders) map.set(c.id, `${c.userName} (${c.email})`);
    return map;
  }, [commanders]);

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
      // commander assign/unassign ide preko dedicated endpointa
      const desiredCommander = editForm.commanderId.trim() ? editForm.commanderId.trim() : null;
      const current = items.find((x) => x.id === editingId);
      const currentCommander = current?.commanderId ?? null;

      if (desiredCommander !== currentCommander) {
        if (!desiredCommander) await unassignCommander(editingId);
        else await assignCommander(editingId, desiredCommander);
      }

      // update ostalog preko PUT
      const currentMission = items.find((x) => x.id === editingId);
        if (!currentMission) return;

      const isTerminal =
        currentMission.status === "Completed" || currentMission.status === "Cancelled";

      const payload = isTerminal
        ? {
          notes: editForm.notes.trim() ? editForm.notes.trim() : null,
        }
      : {
        name: editForm.name.trim() || null,
        notes: editForm.notes.trim() ? editForm.notes.trim() : null,
        terrain: editForm.terrain,
        difficulty: editForm.difficulty,
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
  try {
    await activateMission(id);
    await load();
  } catch (e: unknown) {
    showError(e instanceof Error ? e.message : "Activate failed");
  }
}

async function onComplete(id: number) {
  clearError();
  try {
    const notes = prompt("Notes for completion (optional):") ?? "";
    await completeMission(id, notes.trim() ? notes : null);
    await load();
  } catch (e: unknown) {
    showError(e instanceof Error ? e.message : "Complete failed");
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
    showError(e);
  }
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
            const isTerminal =
              m.status === "Completed";

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
                  {isTerminal && (
                    <div style={{ color: "#bbb", fontSize: 14, marginBottom: 8 }}>
                      Completed / Cancelled missions allow notes-only editing.
                    </div>
                  )}
                  {!isEditing ? (
                    <>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>
                        {m.name} <span style={{ opacity: 0.7 }}>· {m.status}</span>
                      </div>

                      <div style={{ opacity: 0.85, marginTop: 6 }}>
                        Commander: {commanderDisplay(m.commanderId)}
                      </div>

                      <div style={{ opacity: 0.85 }}>SquadId: {m.squadId ?? "—"}</div>

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

                      <div style={{ opacity: 0.85 }}>
                        Outcome: {m.wasSuccessful == null ? "—" : m.wasSuccessful ? "Success" : "Failure"}
                      </div>

                      {m.notes && <div style={{ opacity: 0.85, marginTop: 6 }}>Notes: {m.notes}</div>}

                      {canManage && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                        {m.status === "Planned" && (
                          <button onClick={() => onActivate(m.id)} style={{ padding: "6px 10px", borderRadius: 8 }}>
                            Activate
                          </button>
                        )}

                        {m.status === "Active" && (
                        <>
                        <button onClick={() => onExecute(m.id)} style={{ padding: "6px 10px", borderRadius: 8 }}>
                          Execute
                        </button>

                        <button onClick={() => onComplete(m.id)} style={{ padding: "6px 10px", borderRadius: 8 }}>
                          Complete
                        </button>
                        </>
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
                          disabled={isTerminal}
                        />

                        <div style={{ display: "grid", gap: 6 }}>
                          <label style={{ fontWeight: 600 }}>Commander</label>
                        <select
                          value={editForm?.commanderId ?? ""}
                          onChange={(e) => setEditForm((f) => (f ? { ...f, commanderId: e.target.value } : f))}
                          style={{ padding: 10, borderRadius: 8 }}
                          disabled={isTerminal}
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
                          rows={3}
                          style={{ padding: 10, borderRadius: 8 }}
                        />

                        <div style={{ display: "grid", gap: 6 }}>
                          <label style={{ fontWeight: 600 }}>Terrain</label>
                        <select
                          value={editForm?.terrain ?? "Urban"}
                          onChange={(e) =>
                            setEditForm((f) => (f ? { ...f, terrain: e.target.value as MissionTerrain } : f))
                          }
                          style={{ padding: 10, borderRadius: 8 }}
                          disabled={isTerminal}
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
                          disabled={isTerminal}
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

      {!loading && !error && items.length === 0 && <div>No missions yet.</div>}
    </div>
  );
}