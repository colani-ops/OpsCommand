import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { hasRole, getUser } from "../api/auth";
import { /*getMe,*/ getUsers, type UserDto } from "../api/users";
import {
  createSquad,
  deleteSquad,
  getSquads,
  updateSquad,
  type SquadDto,
  type SquadType,
} from "../api/squads";

const TYPES: SquadType[] = ["Assault", "Tactical", "Recon"];



type CreateForm = {
  name: string;
  type: SquadType;
  commanderId: string;
};

type EditForm = {
  name: string;
  type: SquadType;
  commanderId: string;
};

export default function SquadsPage() {
  const canManage = hasRole("Admin", "SuperAdmin");
  const canAccess = hasRole(/*"Member", "Commander",*/"Admin", "SuperAdmin");

  const currentUser = getUser();

  const [items, setItems] = useState<SquadDto[]>([]);
  const [commanders, setCommanders] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: "",
    type: "Assault",
    commanderId: "",
  });

  // Edit state (one squad at a time)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  async function load() {
  setErr(null);
  setLoading(true);

  try {
    const squadsData = await getSquads();
    setItems(squadsData);

    const usersData = await getUsers();
    const onlyCommanders = usersData.filter((u) => u.roles?.includes("Commander"));
    setCommanders(onlyCommanders);
  } catch (e: unknown) {
    setErr(getErrorMessage(e) ?? "Failed to load squads");
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    load();
  }, []);

  // helper: find squad for edit init
  const editingSquad = useMemo(
    () => items.find((x) => x.id === editingId) ?? null,
    [items, editingId]
  );

  const squadNameById = useMemo(() => { 
    const map = new Map<number, string>(); 
      for (const s of items) map.set(s.id, s.name); 
      return map; 
  }, [items]);

  const assignedSquadIdByCommanderId = useMemo(() => {
  const map = new Map<string, number>();
  for (const s of items) {
    if (s.commanderId) map.set(s.commanderId, s.id);
  }
  return map;
}, [items]);

  function commanderLabel(u: UserDto) {
  const base = `${u.userName} (${u.email})`;

  const assignedSquadId = assignedSquadIdByCommanderId.get(u.id);
  if (assignedSquadId != null) {
    const squadName = squadNameById.get(assignedSquadId) ?? `Squad #${assignedSquadId}`;
    return `${base} — Assigned: ${squadName}`;
  }
  return `${base} — Free`;
}

  const commanderNameById = useMemo(() => {
  const map = new Map<string, string>();
  for (const c of commanders) map.set(c.id, `${c.userName} (${c.email})`);
  return map;
  }, [commanders]);

  function commanderDisplay(commanderId: string | null) {
    if (!commanderId) return "—";

    const fromMap = commanderNameById.get(commanderId);
    if (fromMap) return fromMap;

    if (currentUser && commanderId === currentUser.id) {
      return `${currentUser.userName} (${currentUser.email})`;
    }

    return commanderId;
  }


  function getErrorMessage(e: unknown): string {
    if (e instanceof Error) return e.message;
    if (typeof e === "string") return e;
    return "Unexpected error";
  }


  function startEdit(id: number) {
    const s = items.find((x) => x.id === id);
    if (!s) return;

    setEditingId(id);
    setEditForm({
      name: s.name,
      type: (s.type as SquadType) ?? "Assault",
      commanderId: s.commanderId ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const payload = {
      name: createForm.name.trim(),
      type: createForm.type,
      commanderId: createForm.commanderId.trim() ? createForm.commanderId.trim() : null,
    };

    try {
      await createSquad(payload);
      setCreateForm({ name: "", type: "Assault", commanderId: "" });
      setShowCreate(false);
      await load();
    } catch (e: unknown) {
      setErr(getErrorMessage(e) ?? "Failed to load squads");
    }
  }

  async function submitEdit() {
    if (!editingId || !editForm) return;

    setErr(null);

    const payload = {
      name: editForm.name.trim(),
      type: editForm.type,
      commanderId: editForm.commanderId.trim() ? editForm.commanderId.trim() : null,
    };

    try {
      await updateSquad(editingId, payload);
      cancelEdit();
      await load();
    } catch (e: unknown) {
      setErr(getErrorMessage(e) ?? "Failed to load squads");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Soft-delete this squad?")) return;

    setErr(null);
    try {
      await deleteSquad(id);
      // if we were editing this one, exit edit mode
      if (editingId === id) cancelEdit();
      await load();
    } catch (e: unknown) {
      setErr(getErrorMessage(e) ?? "Failed to load squads");
    }
  }

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ marginRight: "auto" }}>Squads</h2>

        {canManage && (
          <button
            onClick={() => setShowCreate((v) => !v)}
            style={{ padding: "8px 12px", borderRadius: 8 }}
          >
            {showCreate ? "Close" : "New Squad"}
          </button>
        )}

        <button onClick={load} style={{ padding: "8px 12px", borderRadius: 8 }}>
          Refresh
        </button>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}
      {loading && <div style={{ marginTop: 10 }}>Loading...</div>}

      {/* CREATE FORM */}
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
          <div style={{ fontWeight: 700 }}>Create Squad</div>

          <input
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Name"
            required
            style={{ padding: 10, borderRadius: 8 }}
          />

          <select
            value={createForm.type}
            onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as SquadType }))}
            style={{ padding: 10, borderRadius: 8 }}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={createForm.commanderId}
            onChange={(e) => setCreateForm((f) => ({ ...f, commanderId: e.target.value }))}
            style={{ padding: 10, borderRadius: 8 }}
          >
          <option value="">— Commander —</option>
            {commanders.map((c) => (
            <option key={c.id} value={c.id} disabled={assignedSquadIdByCommanderId.has(c.id)}>
              {commanderLabel(c)}
            </option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ padding: "10px 14px", borderRadius: 8 }}>Create</button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              style={{ padding: "10px 14px", borderRadius: 8 }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* LIST */}
      {!loading && (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {items.map((s) => {
            const isEditing = editingId === s.id;

            return (
              <div
                key={s.id}
                style={{
                  border: "1px solid #333",
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                {/* LEFT SIDE */}
                <div style={{ flex: 1 }}>
                  {!isEditing ? (
                    <>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>
                        {s.name} <span style={{ opacity: 0.7 }}>· {s.type}</span>
                      </div>

                      <div style={{ opacity: 0.85, marginTop: 6 }}>
                        Commander: {commanderDisplay(s.commanderId)}
                      </div>

                      <div style={{ opacity: 0.85, marginTop: 6 }}>
                        Missions Served: {s.missionsServed}
                      </div>

                      <div style={{ opacity: 0.85 }}>
                        Successful Missions: {s.missionsWon}
                      </div>

                      <div style={{ opacity: 0.95, fontWeight: 600 }}>
                        Success Rate:{" "}
                        {s.missionsServed > 0
                        ? `${Math.round((s.missionsWon / s.missionsServed) * 100)}%`
                        : "N/A"}
                      </div>

                      {s.deletedAt && <div style={{ color: "orange" }}>Soft-deleted</div>}
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>
                        Editing: {editingSquad?.name ?? `Squad #${s.id}`}
                      </div>

                      <div style={{ display: "grid", gap: 10 }}>
                        {/* Name */}
                        <input
                        value={editForm?.name ?? ""}
                        onChange={(e) => setEditForm((f) => (f ? { ...f, name: e.target.value } : f))}
                        placeholder="Name"
                        style={{ padding: 10, borderRadius: 8 }}
                        />

                        {/* Type*/}
                        <select
                          value={editForm?.type ?? "Assault"}
                          onChange={(e) =>
                          setEditForm((f) => (f ? { ...f, type: e.target.value as SquadType } : f))
                          }
                          style={{ padding: 10, borderRadius: 8 }}
                        >
                          {TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                          ))}
                        </select>

                        {/* Commander (DROPDOWN) */}
                        <select
                          value={editForm?.commanderId ?? ""}
                          onChange={(e) =>
                          setEditForm((f) => (f ? { ...f, commanderId: e.target.value } : f))
                        }
                        style={{ padding: 10, borderRadius: 8 }}
                        >
                        <option value="">— None —</option>

                          {commanders.map((c) => {
                            const assignedTo = assignedSquadIdByCommanderId.get(c.id);
                            const assignedToOtherSquad = assignedTo != null && assignedTo !== s.id;
                             return (
                                <option key={c.id} value={c.id} disabled={assignedToOtherSquad}>
                                  {commanderLabel(c)}
                                </option>
                              );
                            })}
                          </select>
                  </div>
                    </>
                  )}
                </div>

                {/* RIGHT SIDE ACTIONS */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {canManage ? (
                    !isEditing ? (
                      <>
                        <button
                          onClick={() => startEdit(s.id)}
                          style={{ padding: "8px 12px", borderRadius: 8 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(s.id)}
                          style={{ padding: "8px 12px", borderRadius: 8 }}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={submitEdit}
                          style={{ padding: "8px 12px", borderRadius: 8 }}
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{ padding: "8px 12px", borderRadius: 8 }}
                        >
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

      {!loading && !err && items.length === 0 && <div>No squads yet.</div>}
    </div>
  );
}
