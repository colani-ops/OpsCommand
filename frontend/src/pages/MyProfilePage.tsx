import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getUser } from "../api/auth";
import { getMe } from "../api/users";
import { getSquad, type SquadDto } from "../api/squads";
import {
  addMyUserEquipment,
  deleteMyUserEquipment,
  getAvailableUserEquipment,
  getMyUserEquipment,
  updateMyUserEquipment,
  type UserEquipmentDto,
} from "../api/userEquipment";
import { useErrorHandler } from "../hooks/useErrorHandler";
import ErrorBanner from "../components/ErrorBanner";

function getPrimaryRoleLabel(roles: string[]) {
  const order = ["SuperAdmin", "Admin", "Commander", "Member", "Recruit"];
  for (const role of order) {
    if (roles.includes(role)) return role;
  }
  return roles[0] ?? "User";
}

function getVeterancyLabel(missionsServed: number) {
  if (missionsServed >= 20) return "Elite";
  if (missionsServed >= 10) return "Veteran";
  if (missionsServed >= 5) return "Experienced";
  if (missionsServed >= 1) return "Active";
  return "Fresh";
}

function getSquadTypeImage(type?: string | null) {
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

function getEquipmentBanner(category?: string | null) {
  switch (category) {
    case "Primary":
      return "/equipment-primary.png";
    case "Secondary":
      return "/equipment-secondary.png";
    case "Melee":
      return "/equipment-melee.png";
    case "Utility":
      return "/equipment-utility.png";
    default:
      return "/equipment-default.png";
  }
}

export default function MyProfilePage() {
  const user = useMemo(() => getUser(), []);
  const { error, showError, clearError } = useErrorHandler();

  const [assignedSquadId, setAssignedSquadId] = useState<number | null>(null);
  const [squad, setSquad] = useState<SquadDto | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingEquipment, setSavingEquipment] = useState(false);

  const [availableEquipment, setAvailableEquipment] = useState<UserEquipmentDto[]>([]);
  const [myEquipment, setMyEquipment] = useState<UserEquipmentDto[]>([]);

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | "">("");
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [editQuantities, setEditQuantities] = useState<Record<number, number>>({});

  const loadEquipmentData = useCallback(async () => {
    const [available, mine] = await Promise.all([
      getAvailableUserEquipment(),
      getMyUserEquipment(),
    ]);

    setAvailableEquipment(available);
    setMyEquipment(mine);
    setEditQuantities(
      Object.fromEntries(mine.map((item) => [item.equipmentId, item.quantity]))
    );
  }, []);

  const loadProfileData = useCallback(async () => {
    if (!user) {
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    clearError();

    try {
      const me = await getMe();
      const squadId = me.assignedSquadId ?? null;

      setAssignedSquadId(squadId);

      if (!squadId) {
        setSquad(null);
        setAvailableEquipment([]);
        setMyEquipment([]);
        return;
      }

      const squadData = await getSquad(squadId);
      setSquad(squadData);

      await loadEquipmentData();
    } catch (e: unknown) {
      showError(e);
      setAssignedSquadId(null);
      setSquad(null);
      setAvailableEquipment([]);
      setMyEquipment([]);
    } finally {
      setLoadingProfile(false);
    }
  }, [user, clearError, showError, loadEquipmentData]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  async function onAddMyEquipment(e: React.FormEvent) {
    e.preventDefault();
    if (selectedEquipmentId === "") return;

    try {
      clearError();
      setSavingEquipment(true);

      await addMyUserEquipment({
        equipmentId: Number(selectedEquipmentId),
        quantity: newQuantity,
      });

      setSelectedEquipmentId("");
      setNewQuantity(1);
      await loadEquipmentData();
    } catch (e: unknown) {
      showError(e);
    } finally {
      setSavingEquipment(false);
    }
  }

  async function onUpdateMyEquipment(equipmentId: number, quantity: number) {
    try {
      clearError();
      setSavingEquipment(true);

      await updateMyUserEquipment(equipmentId, { quantity });
      await loadEquipmentData();
    } catch (e: unknown) {
      showError(e);
    } finally {
      setSavingEquipment(false);
    }
  }

  async function onDeleteMyEquipment(equipmentId: number) {
    if (!confirm("Remove this equipment from your loadout?")) return;

    try {
      clearError();
      setSavingEquipment(true);

      await deleteMyUserEquipment(equipmentId);
      await loadEquipmentData();
    } catch (e: unknown) {
      showError(e);
    } finally {
      setSavingEquipment(false);
    }
  }

  if (!user) {
    return <div style={{ color: "#f3efe6", fontFamily: "monospace" }}>No user loaded.</div>;
  }

  const roleLabel = getPrimaryRoleLabel(user.roles);
  const squadSuccessRate =
    squad && squad.missionsServed > 0
      ? `${Math.round((squad.missionsWon / squad.missionsServed) * 100)}%`
      : "N/A";

  const squadVeterancy = squad ? getVeterancyLabel(squad.missionsServed) : "—";

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
        <h2
          style={{
            margin: "0 0 24px 0",
            color: "#f3efe6",
            fontFamily: "monospace",
            fontSize: 28,
          }}
        >
          My Profile
        </h2>

        <div
          style={{
            border: "1px solid #9d8560",
            borderRadius: 14,
            background: "rgba(0,0,0,0.55)",
            padding: 18,
            display: "grid",
            gap: 18,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              gap: 22,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                border: "3px solid rgba(255,255,255,0.22)",
                background: "rgba(220,220,220,0.82)",
                display: "grid",
                placeItems: "center",
                fontSize: 64,
                color: "#666",
                margin: "0 auto",
              }}
            >
              ◉
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div style={heroTitleStyle}>{user.userName}</div>
              <div style={metaLineStyle}>Email: {user.email}</div>
              <div style={metaLineStyle}>Role: {roleLabel}</div>
              <div style={metaLineStyle}>
                Missions Served: {squad?.missionsServed ?? 0}
              </div>
              <div style={metaLineStyle}>
                Veterancy: {squad ? squadVeterancy : "No squad history"}
              </div>
            </div>
          </div>

          <div
            style={{
              border: "1px solid rgba(201,165,106,0.35)",
              borderRadius: 12,
              padding: 16,
              background: "rgba(20,20,20,0.52)",
              display: "grid",
              gridTemplateColumns: "180px 1fr",
              gap: 22,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: 12,
                overflow: "hidden",
                border: "2px solid #b8945c",
                background: "rgba(255,255,255,0.06)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto",
              }}
            >
              <img
                src={getSquadTypeImage(squad?.type)}
                alt={squad?.type ?? "Squad"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={detailsTitleStyle}>
                {loadingProfile
                  ? "Checking squad..."
                  : assignedSquadId
                    ? squad?.name ?? "Unknown squad"
                    : "No squad assigned"}
              </div>

              <div style={detailsLineStyle}>
                Squad Type: {squad?.type ?? "—"}
              </div>
              <div style={detailsLineStyle}>
                Commander: {squad?.commanderId ?? "—"}
              </div>
              <div style={detailsLineStyle}>
                Success Rate: {squad ? squadSuccessRate : "—"}
              </div>
              <div style={detailsLineStyle}>
                Veterancy Status: {squad ? squadVeterancy : "—"}
              </div>

              {assignedSquadId && (
                <div style={{ marginTop: 4 }}>
                  <Link
                    to="/my-squad"
                    style={{
                      color: "#efb85f",
                      textDecoration: "none",
                      fontFamily: "monospace",
                      fontWeight: 700,
                    }}
                  >
                    Open My Squad
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {!loadingProfile && assignedSquadId && (
          <>
            <div
              style={{
                border: "1px solid #9d8560",
                borderRadius: 14,
                background: "rgba(0,0,0,0.55)",
                padding: 18,
                marginBottom: 18,
              }}
            >
              <div style={sectionTitleStyle}>Available Squad Equipment</div>

              <form
                onSubmit={onAddMyEquipment}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px auto",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <select
                  value={selectedEquipmentId}
                  onChange={(e) =>
                    setSelectedEquipmentId(e.target.value ? Number(e.target.value) : "")
                  }
                  style={formFieldStyle}
                  disabled={savingEquipment}
                >
                  <option value="">— Select equipment —</option>
                  {availableEquipment.map((eq) => (
                    <option key={eq.equipmentId} value={eq.equipmentId}>
                      {eq.equipmentName} {eq.category ? `(${eq.category})` : ""} · Available: {eq.quantity}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(Number(e.target.value))}
                  style={formFieldStyle}
                  disabled={savingEquipment}
                />

                <button
                  style={toolbarButtonStyle}
                  disabled={savingEquipment}
                >
                  {savingEquipment ? "Saving..." : "Add To Loadout"}
                </button>
              </form>
            </div>

            <div
              style={{
                border: "1px solid #9d8560",
                borderRadius: 14,
                background: "rgba(0,0,0,0.55)",
                padding: 18,
              }}
            >
              <div style={sectionTitleStyle}>My Equipment</div>

              {myEquipment.length === 0 ? (
                <div style={detailsLineStyle}>No equipment selected.</div>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {myEquipment.map((item) => (
                    <div
                      key={item.equipmentId}
                      style={{
                        border: "1px solid rgba(201,165,106,0.35)",
                        borderRadius: 14,
                        overflow: "hidden",
                        background: "rgba(0,0,0,0.45)",
                      }}
                    >
                      <div
                        style={{
                          minHeight: 180,
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: 18,
                          alignItems: "stretch",
                          backgroundImage: `linear-gradient(rgba(10,10,10,0.38), rgba(10,10,10,0.38)), url(${getEquipmentBanner(
                            item.category
                          )})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div style={{ padding: 16 }}>
                          <div
                            style={{
                              maxWidth: 920,
                              border: "1px solid rgba(255,255,255,0.14)",
                              borderRadius: 12,
                              padding: 16,
                              background: "rgba(20,20,20,0.70)",
                            }}
                          >
                            <div style={detailsTitleStyle}>{item.equipmentName}</div>
                            <div style={detailsLineStyle}>Category: {item.category ?? "—"}</div>
                            <div style={detailsLineStyle}>Quantity: {item.quantity}</div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: 16,
                            flexWrap: "wrap",
                          }}
                        >
                          <input
                            type="number"
                            min={1}
                            value={editQuantities[item.equipmentId] ?? item.quantity}
                            onChange={(e) =>
                              setEditQuantities((prev) => ({
                                ...prev,
                                [item.equipmentId]: Number(e.target.value),
                              }))
                            }
                            style={{ ...formFieldStyle, width: 96 }}
                            disabled={savingEquipment}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              onUpdateMyEquipment(
                                item.equipmentId,
                                editQuantities[item.equipmentId] ?? item.quantity
                              )
                            }
                            style={iconActionButtonStyle}
                            disabled={savingEquipment}
                          >
                            {savingEquipment ? "Saving..." : "Save"}
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteMyEquipment(item.equipmentId)}
                            style={iconActionButtonStyle}
                            disabled={savingEquipment}
                          >
                            {savingEquipment ? "Working..." : "Remove"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!loadingProfile && !assignedSquadId && (
          <div
            style={{
              border: "1px solid #9d8560",
              borderRadius: 14,
              background: "rgba(0,0,0,0.55)",
              padding: 18,
            }}
          >
            <div style={detailsTitleStyle}>No squad assigned</div>
            <div style={detailsLineStyle}>
              You are not assigned to a squad yet, so there is no personal loadout available.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const heroTitleStyle: React.CSSProperties = {
  color: "#efb85f",
  fontFamily: "monospace",
  fontWeight: 800,
  fontSize: 24,
};

const sectionTitleStyle: React.CSSProperties = {
  color: "#f3efe6",
  fontFamily: "monospace",
  fontWeight: 800,
  fontSize: 22,
  marginBottom: 14,
};

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

const metaLineStyle: React.CSSProperties = {
  color: "#d7b176",
  fontFamily: "monospace",
  fontSize: 16,
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