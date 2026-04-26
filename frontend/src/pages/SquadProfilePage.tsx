import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { getUser, hasRole } from "../api/auth";
import { resolveUserImageUrl } from "../api/users";
import { getEquipment, type EquipmentDto } from "../api/equipment";
import {
  addSquadEquipment,
  deleteSquadEquipment,
  updateSquadEquipment,
} from "../api/squadEquipment";
import { deleteSquad, getSquadProfile, type SquadProfileDto } from "../api/squads";
import ErrorBanner from "../components/ErrorBanner";
import IconButton from "../ui/IconButton";

export default function SquadProfilePage() {
  const { id } = useParams();
  const nav = useNavigate();

  const currentUser = getUser();

  const isAdmin = hasRole("Admin", "SuperAdmin");
  const isCommander = hasRole("Commander");

  const [squad, setSquad] = useState<SquadProfileDto | null>(null);
  const [globalEquipment, setGlobalEquipment] = useState<EquipmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | "">("");
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [editQuantities, setEditQuantities] = useState<Record<number, number>>({});

  const canAccess =
    isAdmin || (isCommander && squad?.commanderId != null && squad.commanderId === currentUser?.id);

  const canManage =
    isAdmin || (isCommander && squad?.commanderId != null && squad.commanderId === currentUser?.id);

  const load = useCallback(async () => {
    if (!id) return;

    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      const [squadData, equipmentData] = await Promise.all([
        getSquadProfile(Number(id)),
        getEquipment(),
      ]);

      setSquad(squadData);
      setGlobalEquipment(equipmentData.filter((e) => e.deletedAt == null));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load squad profile");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!loading && !canAccess) {
    return <Navigate to="/" replace />;
  }

  function getSquadTypeImage(type: string | null) {
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

  function getEquipmentBanner(category: string | null) {
    switch (category) {
      case "Primary":
        return "/banners/equipment-primary.png";
      case "Secondary":
        return "/banners/equipment-secondary.png";
      case "Melee":
        return "/banners/equipment-melee.png";
      case "Utility":
        return "/banners/equipment-utility.png";
      default:
        return "/banners/equipment-default.png";
    }
  }

  function getEquipmentOverlay(category: string | null) {
    switch (category) {
      case "Primary":
        return "rgba(12, 32, 50, 0.64)";
      case "Secondary":
        return "rgba(38, 20, 52, 0.64)";
      case "Melee":
        return "rgba(52, 22, 22, 0.64)";
      case "Utility":
        return "rgba(24, 48, 34, 0.62)";
      default:
        return "rgba(0, 0, 0, 0.60)";
    }
  }

  async function onDelete() {
    if (!squad) return;
    if (!confirm("Soft-delete this squad?")) return;

    setErr(null);
    setMsg(null);

    try {
      await deleteSquad(squad.id);
      nav("/squads");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to delete squad");
    }
  }

  async function onAddEquipment(e: React.FormEvent) {
    e.preventDefault();
    if (!squad || selectedEquipmentId === "") return;

    setErr(null);
    setMsg(null);

    try {
      await addSquadEquipment(squad.id, {
        equipmentId: Number(selectedEquipmentId),
        quantity: newQuantity,
      });

      setSelectedEquipmentId("");
      setNewQuantity(1);
      setMsg("Equipment added to squad.");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to add squad equipment");
    }
  }

  async function onUpdateEquipment(equipmentId: number, quantity: number) {
    if (!squad) return;

    setErr(null);
    setMsg(null);

    try {
      await updateSquadEquipment(squad.id, equipmentId, { quantity });
      setMsg("Squad equipment updated.");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to update squad equipment");
    }
  }

  async function onRemoveEquipment(equipmentId: number) {
    if (!squad) return;
    if (!confirm("Remove this equipment from the squad?")) return;

    setErr(null);
    setMsg(null);

    try {
      await deleteSquadEquipment(squad.id, equipmentId);
      setMsg("Squad equipment removed.");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to remove squad equipment");
    }
  }

  const alreadyAssignedIds = new Set(squad?.equipment.map((e) => e.equipmentId) ?? []);
  const addableEquipment = globalEquipment.filter((e) => !alreadyAssignedIds.has(e.id));

  return (
    <div>
      <ErrorBanner error={err} />
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
            gridTemplateColumns: "1fr auto auto",
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
            Squad Profile
          </h2>

          <IconButton
            iconSrc="/icons/refresh.png"
            alt="Refresh squad"
            title="Refresh squad"
            variant="transparent"
            onClick={load}
          />

          {canManage && squad && (
            <IconButton
              iconSrc="/icons/delete.png"
              alt="Delete"
              title="Delete"
              variant="danger"
              onClick={onDelete}
              style={dangerButtonStyle}
            />
          )}
        </div>

        {loading && <div style={{ marginTop: 10, color: "#f3efe6" }}>Loading...</div>}

        {!loading && !err && !squad && (
          <div style={emptyPanelStyle}>Squad not found.</div>
        )}

        {!loading && !err && squad && (
          <>
            <div
              style={{
                border: "1px solid #9d8560",
                borderRadius: 14,
                overflow: "hidden",
                marginBottom: 18,
                background: "rgba(0,0,0,0.58)",
              }}
            >
              <div
                style={{
                  minHeight: 220,
                  display: "grid",
                  gridTemplateColumns: "180px 1fr",
                  gap: 18,
                  padding: 18,
                  alignItems: "start",
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.34), rgba(0,0,0,0.52)), url(${getSquadTypeImage(
                    squad.type
                  )})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: 14,
                    overflow: "hidden",
                    border: "2px solid #c9a56a",
                    background: "rgba(0,0,0,0.35)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <img
                    src={getSquadTypeImage(squad.type)}
                    alt={squad.type ?? "Squad"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>

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
                      fontSize: 28,
                      fontWeight: 800,
                      color: "#efb85f",
                      fontFamily: "monospace",
                      marginBottom: 10,
                    }}
                  >
                    {squad.name} <span style={{ opacity: 0.75 }}>· {squad.type}</span>
                  </div>

                  <div style={metaLineStyle}>
                    Commander: {squad.commanderName ?? squad.commanderId ?? "—"}
                  </div>
                  <div style={metaLineStyle}>
                    Created At: {new Date(squad.createdAt).toLocaleString()}
                  </div>
                  <div style={metaLineStyle}>
                    Status: {squad.isActive ? "Active" : "Soft-deleted"}
                  </div>
                  <div style={metaLineStyle}>Missions Served: {squad.missionsServed}</div>
                  <div style={metaLineStyle}>Successful Missions: {squad.missionsWon}</div>
                  <div style={metaLineStyle}>
                    Success Rate: {squad.missionsServed > 0 ? `${squad.successRate}%` : "N/A"}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                border: "1px solid #9d8560",
                borderRadius: 14,
                background: "rgba(0,0,0,0.58)",
                padding: 16,
                marginBottom: 18,
              }}
            >
              <div style={sectionTitleStyle}>Squad Members</div>

              {squad.members.length === 0 ? (
                <div style={detailsLineStyle}>No members assigned to this squad.</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {squad.members.map((member) => {
                    const memberImageUrl = resolveUserImageUrl(member.profileImageUrl);

                    return (
                      <div
                        key={member.id}
                        style={{
                          border: "1px solid rgba(255,255,255,0.16)",
                          borderRadius: 12,
                          padding: 16,
                          background: "rgba(20,20,20,0.72)",
                          display: "grid",
                          gridTemplateColumns: "110px 1fr 280px",
                          gap: 16,
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 88,
                            height: 88,
                            borderRadius: "50%",
                            border: "2px solid rgba(255,255,255,0.18)",
                            background: "rgba(220,220,220,0.92)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 34,
                            color: "#666",
                            overflow: "hidden",
                          }}
                        >
                          {memberImageUrl ? (
                            <img
                              src={memberImageUrl}
                              alt={member.userName ?? member.email}
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

                        <div>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 22,
                              fontFamily: "monospace",
                              color: "#efb85f",
                              marginBottom: 8,
                            }}
                          >
                            <Link
                              to={member.id === currentUser?.id ? "/my-profile" : `/users/${member.id}`}
                              style={{ color: "inherit", textDecoration: "none" }}
                            >
                              {member.userName ?? member.email}
                            </Link>
                          </div>

                          <div style={detailsLineStyle}>Email: {member.email}</div>
                          <div style={detailsLineStyle}>Role: {member.role}</div>
                          <div style={detailsLineStyle}>
                            Status: {member.isActive ? "Active" : "Disabled"}
                          </div>
                        </div>

                        <div
                          style={{
                            border: "1px solid rgba(201,165,106,0.20)",
                            borderRadius: 12,
                            padding: 12,
                            background: "rgba(0,0,0,0.28)",
                          }}
                        >
                          <div style={miniTitleStyle}>Equipped Summary</div>
                          <div style={detailsLineStyle}>Primary: pending backend</div>
                          <div style={detailsLineStyle}>Secondary: pending backend</div>
                          <div style={detailsLineStyle}>Melee: pending backend</div>
                          <div style={detailsLineStyle}>Utility: pending backend</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              style={{
                border: "1px solid #9d8560",
                borderRadius: 14,
                background: "rgba(0,0,0,0.58)",
                padding: 16,
              }}
            >
              <div style={sectionTitleStyle}>Squad Equipment</div>

              {canManage && (
                <form
                  onSubmit={onAddEquipment}
                  style={{
                    display: "grid",
                    gap: 10,
                    marginBottom: 16,
                    border: "1px solid rgba(201,165,106,0.28)",
                    borderRadius: 12,
                    padding: 14,
                    background: "rgba(0,0,0,0.40)",
                  }}
                >
                  <select
                    value={selectedEquipmentId}
                    onChange={(e) =>
                      setSelectedEquipmentId(e.target.value ? Number(e.target.value) : "")
                    }
                    style={formFieldStyle}
                  >
                    <option value="">— Select global equipment —</option>
                    {addableEquipment.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} {eq.category ? `(${eq.category})` : ""} · Global available: {eq.availableQuantity}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min={1}
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    style={formFieldStyle}
                  />

                  <button style={toolbarButtonStyle}>Add Equipment To Squad</button>
                </form>
              )}

              {squad.equipment.length === 0 ? (
                <div style={detailsLineStyle}>No equipment assigned to this squad.</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {squad.equipment.map((item) => (
                    <div
                      key={item.equipmentId}
                      style={{
                        border: "1px solid #9d8560",
                        borderRadius: 14,
                        overflow: "hidden",
                        background: "rgba(0,0,0,0.58)",
                      }}
                    >
                      <div
                        style={{
                          minHeight: 130,
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: 18,
                          alignItems: "stretch",
                          backgroundImage: `linear-gradient(${getEquipmentOverlay(
                            item.category
                          )}, rgba(0,0,0,0.74)), url(${getEquipmentBanner(item.category)})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }}
                      >
                        <div style={{ padding: 14 }}>
                          <div
                            style={{
                              maxWidth: 680,
                              border: "1px solid rgba(255,255,255,0.16)",
                              borderRadius: 12,
                              padding: 14,
                              background: "rgba(20,20,20,0.66)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 22,
                                fontWeight: 800,
                                color: "#efb85f",
                                fontFamily: "monospace",
                                marginBottom: 8,
                              }}
                            >
                              <Link
                                to={`/equipment/${item.equipmentId}`}
                                style={{ color: "inherit", textDecoration: "none" }}
                              >
                                {item.equipmentName}
                              </Link>
                            </div>

                            <div style={detailsLineStyle}>Category: {item.category ?? "—"}</div>
                            <div style={detailsLineStyle}>Quantity: {item.quantity}</div>
                          </div>
                        </div>

                        {canManage && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: 14,
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
                              style={{
                                width: 80,
                                ...formFieldStyle,
                              }}
                            />

                            <IconButton
                              iconSrc="/icons/save.png"
                              alt="Save"
                              title="Save"
                              variant="danger"
                              onClick={() =>
                                onUpdateEquipment(
                                  item.equipmentId,
                                  editQuantities[item.equipmentId] ?? item.quantity
                                )
                              }
                              style={iconActionButtonStyle}
                            />

                            <IconButton
                              iconSrc="/icons/delete.png"
                              alt="Remove"
                              title="Remove"
                              variant="danger"
                              onClick={() => onRemoveEquipment(item.equipmentId)}
                              style={iconActionButtonStyle}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
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

const dangerButtonStyle: React.CSSProperties = {
  height: 44,
  padding: "0 16px",
  borderRadius: 10,
  border: "1px solid #9d8560",
  background: "rgba(150,55,55,0.28)",
  color: "#f3efe6",
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
  marginBottom: 4,
};

const detailsLineStyle: React.CSSProperties = {
  color: "#f3efe6",
  fontFamily: "monospace",
  fontSize: 14,
  marginBottom: 6,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: "#f3efe6",
  fontFamily: "monospace",
  marginBottom: 14,
};

const miniTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: "#efb85f",
  fontFamily: "monospace",
  marginBottom: 8,
};

const emptyPanelStyle: React.CSSProperties = {
  border: "1px solid #9d8560",
  borderRadius: 12,
  padding: 16,
  background: "rgba(0,0,0,0.55)",
  color: "#f3efe6",
  fontFamily: "monospace",
};