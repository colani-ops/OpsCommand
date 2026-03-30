import { useEffect, useState } from "react";
import { getUser } from "../api/auth";
import { getMe } from "../api/users";
import { getSquad } from "../api/squads";
import { useErrorHandler } from "../hooks/useErrorHandler";
import {
  addMyUserEquipment,
  deleteMyUserEquipment,
  getAvailableUserEquipment,
  getMyUserEquipment,
  updateMyUserEquipment,
  type UserEquipmentDto,
} from "../api/userEquipment";

export default function MyProfilePage() {
  const user = getUser();

  const [assignedSquadId, setAssignedSquadId] = useState<number | null>(null);
  const [squadName, setSquadName] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [availableEquipment, setAvailableEquipment] = useState<UserEquipmentDto[]>([]);
  const [myEquipment, setMyEquipment] = useState<UserEquipmentDto[]>([]);

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | "">("");
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [editQuantities, setEditQuantities] = useState<Record<number, number>>({});

  const { error, showError, clearError } = useErrorHandler();

  async function loadProfileData() {
    if (!user) {
      setLoadingProfile(false);
      return;
    }

    clearError();
    setLoadingProfile(true);

    try {
      const me = await getMe();

      const squadId = me.assignedSquadId ?? null;
      setAssignedSquadId(squadId);

      if (!squadId) {
        setSquadName(null);
        setAvailableEquipment([]);
        setMyEquipment([]);
        return;
      }

      const squad = await getSquad(squadId);
      setSquadName(squad.name);

      const [available, mine] = await Promise.all([
        getAvailableUserEquipment(),
        getMyUserEquipment(),
      ]);

      setAvailableEquipment(available);
      setMyEquipment(mine);
    } catch (e: unknown) {
      showError(e);
      setAssignedSquadId(null);
      setSquadName(null);
      setAvailableEquipment([]);
      setMyEquipment([]);
    } finally {
      setLoadingProfile(false);
    }
  }

  useEffect(() => {
    loadProfileData();
  }, [user]);

  async function onAddMyEquipment(e: React.FormEvent) {
    e.preventDefault();
    if (selectedEquipmentId === "") return;

    try {
      clearError();

      await addMyUserEquipment({
        equipmentId: Number(selectedEquipmentId),
        quantity: newQuantity,
      });

      setSelectedEquipmentId("");
      setNewQuantity(1);
      await loadProfileData();
    } catch (e: unknown) {
      showError(e);
    }
  }

  async function onUpdateMyEquipment(equipmentId: number, quantity: number) {
    try {
      clearError();

      await updateMyUserEquipment(equipmentId, { quantity });
      await loadProfileData();
    } catch (e: unknown) {
      showError(e);
    }
  }

  async function onDeleteMyEquipment(equipmentId: number) {
    if (!confirm("Remove this equipment from your loadout?")) return;

    try {
      clearError();

      await deleteMyUserEquipment(equipmentId);
      await loadProfileData();
    } catch (e: unknown) {
      showError(e);
    }
  }

  return (
    <div>
      <h2>My Profile</h2>

      {error && (
        <div
          style={{
            background: "#2a0000",
            color: "#ff6b6b",
            padding: 12,
            borderRadius: 8,
            marginTop: 10,
            border: "1px solid #ff6b6b",
          }}
        >
          ⚠ {error}
        </div>
      )}

      {!user ? (
        <p>No user loaded.</p>
      ) : (
        <>
          <div
            style={{
              border: "1px solid #333",
              borderRadius: 10,
              padding: 12,
              marginTop: 14,
              display: "grid",
              gap: 8,
            }}
          >
            <div><b>Username:</b> {user.userName}</div>
            <div><b>Email:</b> {user.email}</div>
            <div><b>Roles:</b> {user.roles.join(", ")}</div>

            <div>
              <b>Squad:</b>{" "}
              {loadingProfile
                ? "Checking squad..."
                : assignedSquadId
                  ? `${squadName ?? "Unknown"} (ID: ${assignedSquadId})`
                  : "None"}
            </div>
          </div>

          {!loadingProfile && assignedSquadId && (
            <>
              <div
                style={{
                  marginTop: 14,
                  border: "1px solid #333",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                  Available Squad Equipment
                </div>

                <form
                  onSubmit={onAddMyEquipment}
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
                    style={{ padding: 10, borderRadius: 8 }}
                  />

                  <button style={{ padding: "10px 14px", borderRadius: 8 }}>
                    Add To My Loadout
                  </button>
                </form>
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
                  My Equipment
                </div>

                {myEquipment.length === 0 ? (
                  <div>No equipment selected.</div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {myEquipment.map((item) => (
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
                            style={{ width: 70, padding: 6, borderRadius: 6 }}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              onUpdateMyEquipment(
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
                            onClick={() => onDeleteMyEquipment(item.equipmentId)}
                            style={{ padding: "6px 10px", borderRadius: 8 }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}