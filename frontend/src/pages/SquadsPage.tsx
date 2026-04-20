import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { hasRole, getUser } from "../api/auth";
import { getUsers, type UserDto } from "../api/users";
import {
  createSquad,
  deleteSquad,
  getSquads,
  updateSquad,
  type SquadDto,
  type SquadType,
} from "../api/squads";
import { useErrorHandler } from "../hooks/useErrorHandler";
import ErrorBanner from "../components/ErrorBanner";

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
  const canAccess = hasRole("Admin", "SuperAdmin");

  const currentUser = getUser();

  const [items, setItems] = useState<SquadDto[]>([]);
  const [commanders, setCommanders] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "type" | "wr" | "veterancy">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: "",
    type: "Assault",
    commanderId: "",
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const { error, showError, clearError } = useErrorHandler();

  const load = useCallback(async () => {
    clearError();
    setLoading(true);

    try {
      const squadsData = await getSquads();
      setItems(squadsData);

      const usersData = await getUsers();
      const onlyCommanders = usersData.filter((u) => u.roles?.includes("Commander"));
      setCommanders(onlyCommanders);
    } catch (e: unknown) {
      showError(e, "Failed to load squads");
    } finally {
      setLoading(false);
    }
  }, [clearError, showError]);

  useEffect(() => {
    load();
  }, [load]);

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

  const commanderNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of commanders) {
      map.set(c.id, `${c.userName} (${c.email})`);
    }
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

  function commanderLabel(u: UserDto) {
    const base = `${u.userName} (${u.email})`;
    const assignedSquadId = assignedSquadIdByCommanderId.get(u.id);

    if (assignedSquadId != null) {
      const squadName = squadNameById.get(assignedSquadId) ?? `Squad #${assignedSquadId}`;
      return `${base} — Assigned: ${squadName}`;
    }

    return `${base} — Free`;
  }

  function getSquadSuccessRate(s: SquadDto) {
    if (s.missionsServed <= 0) return 0;
    return Math.round((s.missionsWon / s.missionsServed) * 100);
  }

  function getVeterancyLabel(s: SquadDto) {
    const served = s.missionsServed;

    if (served >= 20) return "Elite";
    if (served >= 10) return "Veteran";
    if (served >= 5) return "Experienced";
    if (served >= 1) return "Active";
    return "Fresh";
  }

  function getSquadTypeImage(type: string) {
    switch (type) {
      case "Assault":
        return "/squad-assault.png";
      case "Tactical":
        return "/squad-tactical.png";
      case "Recon":
        return "/squad-recon.png";
      default:
        return "/squad-default.png";
    }
  }

  function toggleSort(next: "name" | "type" | "wr" | "veterancy") {
    if (sortBy === next) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(next);
    setSortDir("asc");
  }

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = items.filter((s) => {
      if (!q) return true;

      const commander = commanderDisplay(s.commanderId).toLowerCase();

      return (
        s.name.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        commander.includes(q)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      let result = 0;

      switch (sortBy) {
        case "name":
          result = a.name.localeCompare(b.name);
          break;
        case "type":
          result = a.type.localeCompare(b.type);
          break;
        case "wr":
          result = getSquadSuccessRate(a) - getSquadSuccessRate(b);
          break;
        case "veterancy":
          result = a.missionsServed - b.missionsServed;
          break;
      }

      return sortDir === "asc" ? result : -result;
    });

    return sorted;
  }, [items, search, sortBy, sortDir, commanders, currentUser]);

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
    clearError();

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
      showError(e, "Failed to create squad");
    }
  }

  async function submitEdit() {
    if (!editingId || !editForm) return;

    clearError();

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
      showError(e, "Failed to update squad");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Soft-delete this squad?")) return;

    clearError();
    try {
      await deleteSquad(id);
      if (editingId === id) cancelEdit();
      await load();
    } catch (e: unknown) {
      showError(e, "Failed to delete squad");
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
            Squads
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
              {showCreate ? "Close" : "New Squad"}
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
          <button onClick={() => toggleSort("type")} style={sortButtonStyle}>
            Type {sortBy === "type" ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
          <button onClick={() => toggleSort("wr")} style={sortButtonStyle}>
            WR {sortBy === "wr" ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
          <button onClick={() => toggleSort("veterancy")} style={sortButtonStyle}>
            Veterancy {sortBy === "veterancy" ? (sortDir === "asc" ? "▲" : "▼") : ""}
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
              Create Squad
            </div>

            <input
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Name"
              required
              style={formFieldStyle}
            />

            <select
              value={createForm.type}
              onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as SquadType }))}
              style={formFieldStyle}
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
              style={formFieldStyle}
            >
              <option value="">— Commander —</option>
              {commanders.map((c) => (
                <option key={c.id} value={c.id} disabled={assignedSquadIdByCommanderId.has(c.id)}>
                  {commanderLabel(c)}
                </option>
              ))}
            </select>

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
            {visibleItems.map((s) => {
              const isEditing = editingId === s.id;

              return (
                <div
                  key={s.id}
                  style={{
                    border: "1px solid #9d8560",
                    borderRadius: 14,
                    background: "rgba(0,0,0,0.58)",
                    padding: 14,
                    display: "grid",
                    gridTemplateColumns: "110px 1fr auto",
                    gap: 18,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 10,
                      border: "2px solid #b8945c",
                      background: "rgba(255,255,255,0.06)",
                      overflow: "hidden",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <img
                      src={getSquadTypeImage(s.type)}
                      alt={s.type}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>

                  <div>
                    {!isEditing ? (
                      <>
                        <div
                          style={{
                            fontSize: 24,
                            fontWeight: 800,
                            color: "#efb85f",
                            fontFamily: "monospace",
                            marginBottom: 8,
                          }}
                        >
                          <Link
                            to={`/squads/${s.id}`}
                            style={{ color: "inherit", textDecoration: "none" }}
                          >
                            {s.name}
                          </Link>
                        </div>

                        <div style={metaLineStyle}>Type: {s.type}</div>
                        <div style={metaLineStyle}>Commander: {commanderDisplay(s.commanderId)}</div>
                        <div style={metaLineStyle}>
                          Success Rate: {s.missionsServed > 0 ? `${getSquadSuccessRate(s)}%` : "N/A"}
                        </div>
                        <div style={metaLineStyle}>Veterancy: {getVeterancyLabel(s)}</div>

                        {s.deletedAt && (
                          <div style={{ color: "#ffb347", fontFamily: "monospace", marginTop: 6 }}>
                            Soft-deleted
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            fontWeight: 700,
                            marginBottom: 8,
                            color: "#f3efe6",
                            fontFamily: "monospace",
                          }}
                        >
                          Editing: {editingSquad?.name ?? `Squad #${s.id}`}
                        </div>

                        <div style={{ display: "grid", gap: 10 }}>
                          <input
                            value={editForm?.name ?? ""}
                            onChange={(e) =>
                              setEditForm((f) => (f ? { ...f, name: e.target.value } : f))
                            }
                            placeholder="Name"
                            style={formFieldStyle}
                          />

                          <select
                            value={editForm?.type ?? "Assault"}
                            onChange={(e) =>
                              setEditForm((f) => (f ? { ...f, type: e.target.value as SquadType } : f))
                            }
                            style={formFieldStyle}
                          >
                            {TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>

                          <select
                            value={editForm?.commanderId ?? ""}
                            onChange={(e) =>
                              setEditForm((f) => (f ? { ...f, commanderId: e.target.value } : f))
                            }
                            style={formFieldStyle}
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

                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    {canManage ? (
                      !isEditing ? (
                        <>
                          <button onClick={() => startEdit(s.id)} style={iconActionButtonStyle}>
                            Edit
                          </button>
                          <button onClick={() => onDelete(s.id)} style={iconActionButtonStyle}>
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={submitEdit} style={iconActionButtonStyle}>
                            Save
                          </button>
                          <button onClick={cancelEdit} style={iconActionButtonStyle}>
                            Cancel
                          </button>
                        </>
                      )
                    ) : (
                      <span style={{ opacity: 0.6, fontSize: 14, color: "#f3efe6" }}>Read-only</span>
                    )}
                  </div>
                </div>
              );
            })}

            {!error && visibleItems.length === 0 && (
              <div style={{ color: "#f3efe6", fontFamily: "monospace" }}>
                No squads found.
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

const metaLineStyle: React.CSSProperties = {
  color: "#d7b176",
  fontFamily: "monospace",
  fontSize: 16,
  marginBottom: 4,
};

const formFieldStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #9d8560",
  background: "rgba(0,0,0,0.55)",
  color: "#f3efe6",
  fontFamily: "monospace",
};