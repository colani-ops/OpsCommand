import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { getUser, hasRole } from "../api/auth";
import { getEquipment, type EquipmentDto } from "../api/equipment";
import {
  addSquadEquipment,
  deleteSquadEquipment,
  updateSquadEquipment,
} from "../api/squadEquipment";
import { deleteSquad, getSquadProfile, type SquadProfileDto } from "../api/squads";

export default function SquadProfilePage() {
  const { id } = useParams();
  const nav = useNavigate();

  const canAccess = hasRole("Admin", "SuperAdmin");
  const canManage = hasRole("Admin", "SuperAdmin");

  const [squad, setSquad] = useState<SquadProfileDto | null>(null);
  const [globalEquipment, setGlobalEquipment] = useState<EquipmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | "">("");
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [editQuantities, setEditQuantities] = useState<Record<number, number>>({});

  const currentUser = getUser();

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

  if (!canAccess) {
    return <Navigate to="/" replace />;
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
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ marginRight: "auto" }}>Squad Profile</h2>

        <button onClick={load} style={{ padding: "8px 12px", borderRadius: 8 }}>
          Refresh
        </button>

        {canManage && squad && (
          <button onClick={onDelete} style={{ padding: "8px 12px", borderRadius: 8 }}>
            Delete
          </button>
        )}
      </div>

      {msg && <div style={{ color: "lightgreen", marginTop: 10 }}>{msg}</div>}
      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}
      {loading && <div style={{ marginTop: 10 }}>Loading...</div>}

      {!loading && !err && !squad && <div>Squad not found.</div>}

      {!loading && !err && squad && (
        <>
          <div
            style={{
              marginTop: 14,
              border: "1px solid #333",
              borderRadius: 12,
              padding: 14,
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {squad.name} <span style={{ opacity: 0.7 }}>· {squad.type}</span>
            </div>

            <div><b>Commander:</b> {squad.commanderName ?? squad.commanderId ?? "—"}</div>
            <div><b>Created At:</b> {new Date(squad.createdAt).toLocaleString()}</div>
            <div><b>Status:</b> {squad.isActive ? "Active" : "Soft-deleted"}</div>
            <div><b>Missions Served:</b> {squad.missionsServed}</div>
            <div><b>Successful Missions:</b> {squad.missionsWon}</div>
            <div><b>Success Rate:</b> {squad.missionsServed > 0 ? `${squad.successRate}%` : "N/A"}</div>
          </div>

          <div
            style={{
              marginTop: 14,
              border: "1px solid #333",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
              Squad Members
            </div>

            {squad.members.length === 0 ? (
              <div>No members assigned to this squad.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {squad.members.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      border: "1px solid #333",
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <Link
                      to={member.id === currentUser?.id ? "/my-profile" : `/users/${member.id}`}
                      style={{ color: "white", textDecoration: "none" }}
                    >
                      {member.userName ?? member.email}
                    </Link>

                    <div style={{ opacity: 0.85, marginTop: 4 }}>{member.email}</div>
                    <div style={{ opacity: 0.85 }}>Role: {member.role}</div>
                    <div style={{ opacity: 0.85 }}>
                      Status: {member.isActive ? "Active" : "Disabled"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 14,
              border: "1px solid #333",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
              Squad Equipment
            </div>

            {canManage && (
              <form
                onSubmit={onAddEquipment}
                style={{
                  display: "grid",
                  gap: 10,
                  maxWidth: 360,
                  marginBottom: 16,
                }}
              >
                <select
                  value={selectedEquipmentId}
                  onChange={(e) =>
                    setSelectedEquipmentId(e.target.value ? Number(e.target.value) : "")
                  }
                  style={{ padding: 10, borderRadius: 8 }}
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
                  style={{ padding: 10, borderRadius: 8 }}
                />

                <button style={{ padding: "10px 14px", borderRadius: 8 }}>
                  Add Equipment To Squad
                </button>
              </form>
            )}

            {squad.equipment.length === 0 ? (
              <div>No equipment assigned to this squad.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {squad.equipment.map((item) => (
                  <div
                    key={item.equipmentId}
                    style={{
                      border: "1px solid #333",
                      borderRadius: 10,
                      padding: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        <Link
                          to={`/equipment/${item.equipmentId}`}
                          style={{ color: "white", textDecoration: "none" }}
                        >
                          {item.equipmentName}
                        </Link>
                        {item.category ? ` · ${item.category}` : ""}
                      </div>

                      <div style={{ opacity: 0.85 }}>Quantity: {item.quantity}</div>
                    </div>

                    {canManage && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                          style={{ width: 80, padding: 6, borderRadius: 6 }}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            onUpdateEquipment(
                              item.equipmentId,
                              editQuantities[item.equipmentId] ?? item.quantity
                            )
                          }
                          style={{ padding: "6px 10px", borderRadius: 8 }}
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={() => onRemoveEquipment(item.equipmentId)}
                          style={{ padding: "6px 10px", borderRadius: 8 }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}