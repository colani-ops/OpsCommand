import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { hasRole } from "../api/auth";
import { getEquipmentById, type EquipmentDto } from "../api/equipment";

export default function EquipmentProfilePage() {
  const { id } = useParams();
  const canAccess = hasRole("Member", "Commander", "Admin", "SuperAdmin");

  const [item, setItem] = useState<EquipmentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    if (!id) return;

    setErr(null);
    setLoading(true);

    try {
      const data = await getEquipmentById(Number(id));
      setItem(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load equipment");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <h2>Equipment Profile</h2>

      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}
      {loading && <div style={{ marginTop: 10 }}>Loading...</div>}

      {!loading && !err && !item && <div>Equipment not found.</div>}

      {!loading && !err && item && (
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
            {item.name}
          </div>

          <div><b>Category:</b> {item.category ?? "—"}</div>
          <div><b>Quantity:</b> {item.quantity}</div>
          <div><b>Effectiveness:</b> {item.effectiveness}/100</div>
          <div><b>Description:</b> {item.description ?? "No description."}</div>
        </div>
      )}
    </div>
  );
}