import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import { Link } from "react-router-dom";
import { hasRole } from "../api/auth";

type Equipment = { id: number; name: string; category?: string | null };

export default function EquipmentPage() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const canManage = hasRole("Admin", "SuperAdmin"); //Create & Delete ako canManage

  async function load() {
    setErr(null);
    try {
      setItems(await apiFetch<Equipment[]>("/api/equipment"));
    } catch (e: any) {
      setErr(e.message ?? "Failed to load equipment");
    }
  }

  useEffect(() => { load(); }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await apiFetch<void>("/api/equipment", {
        method: "POST",
        body: JSON.stringify({ name, category: category || null }),
      });
      setName("");
      setCategory("");
      await load();
    } catch (e: any) {
      setErr(e.message ?? "Create failed");
    }
  }

  async function onDelete(id: number) {
    setErr(null);
    try {
      await apiFetch<void>(`/api/equipment/${id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      setErr(e.message ?? "Delete failed");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h2 style={{ marginRight: "auto" }}>Equipment</h2>
        <Link to="/missions">My Missions</Link>
      </div>

      <form onSubmit={onCreate} style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (unique)" required style={{ flex: 2, padding: 10 }} />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" style={{ flex: 2, padding: 10 }} />
        <button style={{ padding: "10px 14px" }}>Add</button>
      </form>

      {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
        {items.map((e) => (
          <li key={e.id} style={{ border: "1px solid #333", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between" }}>
            <div>
              <b>{e.name}</b>
              <div style={{ opacity: 0.8 }}>{e.category ?? ""}</div>
            </div>
            <button onClick={() => onDelete(e.id)}>Delete</button>
          </li>
        ))}
      </ul>

      {!items.length && !err && <div>No equipment yet.</div>}
    </div>
  );
}
