import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getUser, hasRole } from "../api/auth";
import { getEquipment, type EquipmentDto } from "../api/equipment";
import {
  addSquadEquipment,
  deleteSquadEquipment,
  getMySquad,
  getSquadEquipment,
  updateSquadEquipment,
  type MySquadDto,
  type SquadEquipmentDto,
} from "../api/squads";

export default function MySquadPage() {
  const canAccess = hasRole("Member", "Commander");
  const canManageEquipment = hasRole("Commander");
  const currentUser = getUser();

  const [squad, setSquad] = useState<MySquadDto | null>(null);
  const [equipment, setEquipment] = useState<SquadEquipmentDto[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<EquipmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | "">("");
  const [newQuantity, setNewQuantity] = useState<number>(1);

  async function load() {
    setErr(null);
    setLoading(true);

    try {
      const squadData = await getMySquad();
      setSquad(squadData);

      if (squadData) {
        const squadEquipmentData = await getSquadEquipment(squadData.id);
        setEquipment(squadEquipmentData);

        if (canManageEquipment) {
          const allEquipment = await getEquipment();
          setAvailableEquipment(allEquipment);
        } else {
          setAvailableEquipment([]);
        }
      } else {
        setEquipment([]);
        setAvailableEquipment([]);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load squad");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  async function onAddEquipment(e: React.FormEvent) {
    e.preventDefault();
    if (!squad || selectedEquipmentId === "") return;

    setErr(null);
    try {
      await addSquadEquipment(squad.id, {
        equipmentId: Number(selectedEquipmentId),
        quantity: newQuantity,
      });

      setSelectedEquipmentId("");
      setNewQuantity(1);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to add equipment");
    }
  }

  async function onUpdateQuantity(equipmentId: number, quantity: number) {
    if (!squad) return;

    setErr(null);
    try {
      await updateSquadEquipment(squad.id, equipmentId, { quantity });
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to update quantity");
    }
  }

  async function onDeleteEquipment(equipmentId: number) {
    if (!squad) return;
    if (!confirm("Remove this equipment from squad?")) return;

    setErr(null);
    try {
      await deleteSquadEquipment(squad.id, equipmentId);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to remove equipment");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ marginRight: "auto" }}>My Squad</h2>

        <button onClick={load} style={{ padding: "8px 12px", borderRadius: 8 }}>
          Refresh
        </button>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}
      {loading && <div style={{ marginTop: 10 }}>Loading...</div>}

      {!loading && !err && !squad && (
        <div style={{ marginTop: 14 }}>No squad assigned.</div>
      )}

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
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              {squad.name} <span style={{ opacity: 0.7 }}>· {squad.type}</span>
            </div>

            <div><b>Commander:</b> {squad.commanderName ?? squad.commanderId ?? "—"}</div>
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
              Squad Equipment
            </div>

            {canManageEquipment && (
              <form
                onSubmit={onAddEquipment}
                style={{ display: "grid", gap: 10, marginBottom: 16 }}
              >
                <select
                  value={selectedEquipmentId}
                  onChange={(e) =>
                    setSelectedEquipmentId(e.target.value ? Number(e.target.value) : "")
                  }
                  style={{ padding: 10, borderRadius: 8 }}
                >
                  <option value="">— Select equipment —</option>
                  {availableEquipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} {eq.category ? `(${eq.category})` : ""}
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
                  Add Equipment
                </button>
              </form>
            )}

            {equipment.length === 0 ? (
              <div>No equipment assigned to this squad.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {equipment.map((item) => (
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
                        {item.equipmentName}
                        {item.category ? ` · ${item.category}` : ""}
                      </div>
                      <div style={{ opacity: 0.85 }}>Quantity: {item.quantity}</div>
                    </div>

                    {canManageEquipment && currentUser && squad.commanderId === currentUser.id && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          onClick={() => onUpdateQuantity(item.equipmentId, item.quantity + 1)}
                          style={{ padding: "6px 10px", borderRadius: 8 }}
                        >
                          +1
                        </button>

                        <button
                          onClick={() =>
                            item.quantity > 1
                              ? onUpdateQuantity(item.equipmentId, item.quantity - 1)
                              : onDeleteEquipment(item.equipmentId)
                          }
                          style={{ padding: "6px 10px", borderRadius: 8 }}
                        >
                          -1
                        </button>

                        <button
                          onClick={() => onDeleteEquipment(item.equipmentId)}
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