import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { hasRole } from "../api/auth";
import {
  approveUser,
  disableUser,
  getPendingUsers,
  getUsers,
  resolveUserImageUrl,
  restoreUser,
  updateUserByAdmin,
  type UserDto,
} from "../api/users";
import { getSquads, type SquadDto } from "../api/squads";
import ErrorBanner from "../components/ErrorBanner";
import { useErrorHandler } from "../hooks/useErrorHandler";
import IconButton from "../ui/IconButton";

type EditState = Record<
  string,
  {
    role: string;
    assignedSquadId: string;
  }
>;

type StatusFilter = "all" | "active" | "disabled";

export default function UserManagementPage() {
  const isSuperAdmin = hasRole("SuperAdmin");
  const canManageUsers = hasRole("Admin", "SuperAdmin");

  const ROLES = isSuperAdmin
    ? (["Recruit", "Member", "Commander", "Admin", "SuperAdmin"] as const)
    : (["Recruit", "Member", "Commander", "Admin"] as const);

  const [users, setUsers] = useState<UserDto[]>([]);
  const [pending, setPending] = useState<UserDto[]>([]);
  const [squads, setSquads] = useState<SquadDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editState, setEditState] = useState<EditState>({});

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { error, showError, clearError } = useErrorHandler();
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    clearError();
    setMsg(null);

    try {
      const [usersData, squadsData] = await Promise.all([getUsers(), getSquads()]);

      setUsers(usersData);
      setSquads(squadsData);

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
      } else {
        setPending([]);
      }
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [clearError, isSuperAdmin, showError]);

  useEffect(() => {
    if (!canManageUsers) return;
    load();
  }, [canManageUsers, load]);

  const squadNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of squads) {
      map.set(s.id, s.name);
    }
    return map;
  }, [squads]);

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return users.filter((u) => {
      const primaryRole = u.roles?.[0] ?? "Recruit";
      const userIsActive = u.isActive ?? true;
      const squadName =
        u.assignedSquadId != null
          ? squadNameById.get(u.assignedSquadId) ?? `#${u.assignedSquadId}`
          : "";

      const matchesSearch =
        !q ||
        (u.userName ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        primaryRole.toLowerCase().includes(q) ||
        squadName.toLowerCase().includes(q);

      const matchesRole = roleFilter === "all" || primaryRole === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && userIsActive) ||
        (statusFilter === "disabled" && !userIsActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter, squadNameById]);

  function getPrimaryRole(user: UserDto) {
    return user.roles?.[0] ?? "Recruit";
  }

  function getRoleOverlay(role: string, isActive: boolean) {
    if (!isActive) return "rgba(70,70,70,0.74)";

    switch (role) {
      case "Recruit":
        return "rgba(45,45,45,0.64)";
      case "Member":
        return "rgba(20,36,58,0.64)";
      case "Commander":
        return "rgba(20,52,34,0.64)";
      case "Admin":
        return "rgba(62,46,18,0.64)";
      case "SuperAdmin":
        return "rgba(72,26,26,0.66)";
      default:
        return "rgba(0,0,0,0.60)";
    }
  }

  function getRoleBanner(role: string, isActive: boolean) {
    if (!isActive) return "/banners/user-disabled.png";

    switch (role) {
      case "Recruit":
        return "/banners/user-recruit.png";
      case "Member":
        return "/banners/user-member.png";
      case "Commander":
        return "/banners/user-commander.png";
      case "Admin":
        return "/banners/user-admin.png";
      case "SuperAdmin":
        return "/banners/user-superadmin.png";
      default:
        return "/banners/user-default.png";
    }
  }

  async function onApprove(id: string) {
    clearError();
    setMsg(null);

    try {
      await approveUser(id);
      setMsg("User approved.");
      await load();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Approve failed.");
    }
  }

  async function onSave(id: string) {
    const state = editState[id];
    if (!state) return;

    clearError();
    setMsg(null);

    try {
      await updateUserByAdmin(id, {
        role: state.role,
        assignedSquadId: state.assignedSquadId.trim() ? Number(state.assignedSquadId) : null,
      });
      setMsg("User updated.");
      await load();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Update failed.");
    }
  }

  async function onDisable(id: string) {
    clearError();
    setMsg(null);

    try {
      await disableUser(id);
      setMsg("User disabled.");
      await load();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Disable failed.");
    }
  }

  async function onRestore(id: string) {
    clearError();
    setMsg(null);

    try {
      await restoreUser(id);
      setMsg("User restored.");
      await load();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Restore failed.");
    }
  }

  if (!canManageUsers) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <ErrorBanner error={error} />

      {msg && (
        <div
          style={{
            marginBottom: 12,
            color: "lightgreen",
            fontFamily: "monospace",
          }}
        >
          {msg}
        </div>
      )}

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
            gridTemplateColumns: "220px 1fr 180px 160px auto",
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
            User Management
          </h2>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, role, squad..."
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

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={formFieldStyle}
          >
            <option value="all">All roles</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            style={formFieldStyle}
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="disabled">Disabled only</option>
          </select>

          <IconButton
            iconSrc="/icons/refresh.png"
            alt="Refresh users"
            title="Refresh users"
            variant="transparent"
            onClick={load}
          />
        </div>

        {loading && <div style={{ marginTop: 10, color: "#f3efe6" }}>Loading...</div>}

        {isSuperAdmin && (
          <section style={{ marginTop: 24, marginBottom: 24 }}>
            <div style={sectionTitleStyle}>Pending Approvals</div>

            {pending.length === 0 ? (
              <div style={emptyPanelStyle}>No pending users.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {pending.map((u) => {
                  const pendingProfileImageUrl = resolveUserImageUrl(u.profileImageUrl);

                  return (
                    <div
                      key={u.id}
                      style={{
                        border: "1px solid #9d8560",
                        borderRadius: 14,
                        overflow: "hidden",
                        backgroundImage:
                          "linear-gradient(rgba(62,46,18,0.62), rgba(0,0,0,0.76)), url(/banners/user-default.png)",
                        backgroundSize: "contain",
                        backgroundPosition: "right center",
                        backgroundRepeat: "no-repeat",
                        backgroundColor: "rgba(0,0,0,0.58)",
                      }}
                    >
                      <div
                        style={{
                          minHeight: 150,
                          display: "grid",
                          gridTemplateColumns: "110px 1fr auto",
                          gap: 18,
                          alignItems: "center",
                          padding: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 96,
                            height: 96,
                            borderRadius: "50%",
                            border: "2px solid rgba(255,255,255,0.18)",
                            background: "rgba(220,220,220,0.92)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 36,
                            color: "#666",
                            overflow: "hidden",
                          }}
                        >
                          {pendingProfileImageUrl ? (
                            <img
                              src={pendingProfileImageUrl}
                              alt={u.userName ?? u.email}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            "◉"
                          )}
                        </div>

                        <div
                          style={{
                            maxWidth: 760,
                            border: "1px solid rgba(255,255,255,0.16)",
                            borderRadius: 12,
                            padding: 16,
                            background: "rgba(20,20,20,0.62)",
                            backdropFilter: "blur(2px)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 24,
                              fontWeight: 800,
                              color: "#efb85f",
                              fontFamily: "monospace",
                              marginBottom: 8,
                            }}
                          >
                            {u.userName ?? u.email}
                          </div>

                          <div style={metaLineStyle}>Email: {u.email}</div>
                          <div style={metaLineStyle}>Role: {u.roles.join(", ")}</div>
                          <div style={metaLineStyle}>Status: Pending approval</div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: 14,
                          }}
                        >
                          <button onClick={() => onApprove(u.id)} style={toolbarButtonStyle}>
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section style={{ marginTop: 24 }}>
          <div style={sectionTitleStyle}>All Users</div>

          <div style={{ display: "grid", gap: 12 }}>
            {visibleUsers.map((u) => {
              const state = editState[u.id] ?? {
                role: u.roles?.[0] ?? "Recruit",
                assignedSquadId: u.assignedSquadId != null ? String(u.assignedSquadId) : "",
              };

              const primaryRole = getPrimaryRole(u);
              const userIsActive = u.isActive ?? true;
              const profileImageUrl = resolveUserImageUrl(u.profileImageUrl);

              return (
                <div
                  key={u.id}
                  style={{
                    border: "1px solid #9d8560",
                    borderRadius: 14,
                    overflow: "hidden",
                    backgroundImage: `linear-gradient(${getRoleOverlay(
                      primaryRole,
                      userIsActive
                    )}, rgba(0,0,0,0.76)), url(${getRoleBanner(primaryRole, userIsActive)})`,
                    backgroundSize: "contain",
                    backgroundPosition: "right center",
                    backgroundRepeat: "no-repeat",
                    backgroundColor: "rgba(0,0,0,0.58)",
                    opacity: userIsActive ? 1 : 0.84,
                  }}
                >
                  <div
                    style={{
                      minHeight: 180,
                      display: "grid",
                      gridTemplateColumns: "110px 1fr auto",
                      gap: 18,
                      alignItems: "center",
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.18)",
                        background: "rgba(220,220,220,0.92)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 36,
                        color: "#666",
                        overflow: "hidden",
                      }}
                    >
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt={u.userName ?? u.email}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        "◉"
                      )}
                    </div>

                    <div
                      style={{
                        maxWidth: 760,
                        border: "1px solid rgba(255,255,255,0.16)",
                        borderRadius: 12,
                        padding: 16,
                        background: "rgba(20,20,20,0.62)",
                        backdropFilter: "blur(2px)",
                      }}
                    >
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
                          to={`/users/${u.id}`}
                          style={{ color: "inherit", textDecoration: "none" }}
                          title="Open user profile"
                        >
                          {u.userName ?? u.email}
                        </Link>
                      </div>

                      <div style={metaLineStyle}>Email: {u.email}</div>
                      <div style={metaLineStyle}>Current Role: {u.roles.join(", ")}</div>
                      <div style={metaLineStyle}>
                        Current Squad:{" "}
                        {u.assignedSquadId != null
                          ? squadNameById.get(u.assignedSquadId) ?? `#${u.assignedSquadId}`
                          : "—"}
                      </div>
                      <div style={metaLineStyle}>
                        Status: {userIsActive ? "Active" : "Disabled"}
                      </div>

                      {!userIsActive && (
                        <div
                          style={{
                            color: "#d0d0d0",
                            fontFamily: "monospace",
                            marginTop: 8,
                          }}
                        >
                          Disabled account
                        </div>
                      )}

                      <div
                        style={{
                          display: "grid",
                          gap: 10,
                          maxWidth: 360,
                          marginTop: 14,
                        }}
                      >
                        <div style={{ display: "grid", gap: 6 }}>
                          <label style={labelStyle}>Role</label>
                          <select
                            value={state.role}
                            onChange={(e) =>
                              setEditState((prev) => ({
                                ...prev,
                                [u.id]: { ...state, role: e.target.value },
                              }))
                            }
                            style={formFieldStyle}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: "grid", gap: 6 }}>
                          <label style={labelStyle}>Assigned Squad</label>
                          <select
                            value={state.assignedSquadId}
                            onChange={(e) =>
                              setEditState((prev) => ({
                                ...prev,
                                [u.id]: { ...state, assignedSquadId: e.target.value },
                              }))
                            }
                            style={formFieldStyle}
                          >
                            <option value="">— No squad —</option>
                            {squads.map((s) => (
                              <option key={s.id} value={String(s.id)}>
                                {s.name} (#{s.id})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                        padding: 14,
                      }}
                    >
                      <IconButton
                        iconSrc="/icons/save.png"
                        alt="Save"
                        title="Save"
                        variant="secondary"
                        onClick={() => onSave(u.id)}
                      />

                      {isSuperAdmin && (
                        <>
                          <IconButton
                            iconSrc="/icons/delete.png"
                            alt="Disable"
                            title="Disable"
                            variant="danger"
                            onClick={() => onDisable(u.id)}
                            style={iconActionButtonStyle}
                          />

                          <IconButton
                            iconSrc="/icons/refresh.png"
                            alt="Restore"
                            title="Restore"
                            variant="danger"
                            onClick={() => onRestore(u.id)}
                            style={iconActionButtonStyle}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && !error && visibleUsers.length === 0 && (
              <div style={emptyPanelStyle}>No users found.</div>
            )}
          </div>
        </section>
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

const labelStyle: React.CSSProperties = {
  color: "#f3efe6",
  fontFamily: "monospace",
  fontWeight: 700,
  fontSize: 14,
};

const metaLineStyle: React.CSSProperties = {
  color: "#d7b176",
  fontFamily: "monospace",
  fontSize: 16,
  marginBottom: 4,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: "#f3efe6",
  fontFamily: "monospace",
  marginBottom: 14,
};

const emptyPanelStyle: React.CSSProperties = {
  border: "1px solid #9d8560",
  borderRadius: 12,
  padding: 16,
  background: "rgba(0,0,0,0.55)",
  color: "#f3efe6",
  fontFamily: "monospace",
};