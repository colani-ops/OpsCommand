import { useEffect, useState } from "react";
import { hasRole } from "../api/auth";
import {
  approveUser,
  disableUser,
  getPendingUsers,
  getUsers,
  restoreUser,
  updateUserByAdmin,
  type UserDto,
} from "../api/users";

const ROLES = ["Recruit", "Member", "Commander", "Admin"] as const;

type EditState = Record<
  string,
  {
    role: string;
    assignedSquadId: string;
  }
>;

export default function UserManagementPage() {
  const isSuperAdmin = hasRole("SuperAdmin");
  const canManageUsers = hasRole("Admin", "SuperAdmin");

  const [users, setUsers] = useState<UserDto[]>([]);
  const [pending, setPending] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({});

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const usersData = await getUsers();
      setUsers(usersData);

      const initial: EditState = {};
      for (const u of usersData) {
        initial[u.id] = {
          role: u.roles?.[0] ?? "Recruit",
          assignedSquadId: u.assignedSquadId != null ? String(u.assignedSquadId) : "",
        };
      }
      setEditState(initial);

      if (isSuperAdmin) {
        const pendingData = await getPendingUsers();
        setPending(pendingData);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canManageUsers) return;
    load();
  }, []);

  async function onApprove(id: string) {
    setErr(null);
    setMsg(null);
    try {
      await approveUser(id);
      setMsg("User approved.");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Approve failed.");
    }
  }

  async function onSave(id: string) {
    const state = editState[id];
    if (!state) return;

    setErr(null);
    setMsg(null);

    try {
      await updateUserByAdmin(id, {
        role: state.role,
        assignedSquadId: state.assignedSquadId.trim() ? Number(state.assignedSquadId) : null,
      });
      setMsg("User updated.");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Update failed.");
    }
  }

  async function onDisable(id: string) {
    setErr(null);
    setMsg(null);
    try {
      await disableUser(id);
      setMsg("User disabled.");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Disable failed.");
    }
  }

  async function onRestore(id: string) {
    setErr(null);
    setMsg(null);
    try {
      await restoreUser(id);
      setMsg("User restored.");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Restore failed.");
    }
  }

  if (!canManageUsers) {
    return <div>Forbidden</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ marginRight: "auto" }}>User Management</h2>
        <button onClick={load} style={{ padding: "8px 12px", borderRadius: 8 }}>
          Refresh
        </button>
      </div>

      {msg && <div style={{ color: "lightgreen", marginTop: 10 }}>{msg}</div>}
      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}
      {loading && <div style={{ marginTop: 10 }}>Loading...</div>}

      {isSuperAdmin && (
        <section style={{ marginTop: 24 }}>
          <h3>Pending approvals</h3>

          {pending.length === 0 ? (
            <div>No pending users.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {pending.map((u) => (
                <div
                  key={u.id}
                  style={{
                    border: "1px solid #333",
                    borderRadius: 12,
                    padding: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{u.userName}</div>
                    <div>{u.email}</div>
                    <div style={{ opacity: 0.7 }}>Role: {u.roles.join(", ")}</div>
                  </div>

                  <div>
                    <button onClick={() => onApprove(u.id)} style={{ padding: "8px 12px", borderRadius: 8 }}>
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section style={{ marginTop: 24 }}>
        <h3>All users</h3>

        <div style={{ display: "grid", gap: 12 }}>
          {users.map((u) => {
            const state = editState[u.id] ?? {
              role: u.roles?.[0] ?? "Recruit",
              assignedSquadId: u.assignedSquadId != null ? String(u.assignedSquadId) : "",
            };

            return (
              <div
                key={u.id}
                style={{
                  border: "1px solid #333",
                  borderRadius: 12,
                  padding: 14,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{u.userName}</div>
                  <div>{u.email}</div>
                  <div style={{ opacity: 0.7 }}>Current role: {u.roles.join(", ")}</div>
                </div>

                <div style={{ display: "grid", gap: 10, maxWidth: 320 }}>
                  <select
                    value={state.role}
                    onChange={(e) =>
                      setEditState((prev) => ({
                        ...prev,
                        [u.id]: { ...state, role: e.target.value },
                      }))
                    }
                    style={{ padding: 10, borderRadius: 8 }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  <input
                    placeholder="Assigned Squad Id"
                    value={state.assignedSquadId}
                    onChange={(e) =>
                      setEditState((prev) => ({
                        ...prev,
                        [u.id]: { ...state, assignedSquadId: e.target.value },
                      }))
                    }
                    style={{ padding: 10, borderRadius: 8 }}
                  />
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => onSave(u.id)} style={{ padding: "8px 12px", borderRadius: 8 }}>
                    Save
                  </button>

                  {isSuperAdmin && (
                    <>
                      <button onClick={() => onDisable(u.id)} style={{ padding: "8px 12px", borderRadius: 8 }}>
                        Disable
                      </button>
                      <button onClick={() => onRestore(u.id)} style={{ padding: "8px 12px", borderRadius: 8 }}>
                        Restore
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}