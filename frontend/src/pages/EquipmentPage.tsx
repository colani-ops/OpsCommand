import { useEffect, useMemo, useState } from "react";
import { hasRole } from "../api/auth";
import {
  createEquipment,
  deleteEquipment,
  getEquipment,
  updateEquipment,
  type EquipmentDto,
} from "../api/equipment";

type CreateForm = {
  name: string;
  category: string;
};

type EditForm = {
  name: string;
  category: string;
};

export default function EquipmentPage() {
  const canManage = hasRole("Admin", "SuperAdmin");

  const [items, setItems] = useState<EquipmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({ name: "", category: "" });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const data = await getEquipment();
      setItems(data);
    } catch (e: any) {
      setErr(e.message ?? "Failed to load equipment");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const editingItem = useMemo(
    () => items.find((x) => x.id === editingId) ?? null,
    [items, editingId]
  );

  function startEdit(id: number) {
    const e = items.find((x) => x.id === id);
    if (!e) return;
    setEditingId(id);
    setEditForm({
      name: e.name,
      category: e.category ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const payload = {
      name: createForm.name.trim(),
      category: createForm.category.trim() ? createForm.category.trim() : null,
    };

    try {
      await createEquipment(payload);
      setCreateForm({ name: "", category: "" });
      setShowCreate(false);
      await load();
    } catch (e: any) {
      setErr(e.message ?? "Create failed");
    }
  }

  async function submitEdit() {
    if (!editingId || !editForm) return;
    setErr(null);

    const payload = {
      name: editForm.name.trim(),
      category: editForm.category.trim() ? editForm.category.trim() : null,
    };

    try {
      await updateEquipment(editingId, payload);
      cancelEdit();
      await load();
    } catch (e: any) {
      setErr(e.message ?? "Update failed");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Soft-delete this equipment?")) return;
    setErr(null);

    try {
      await deleteEquipment(id);
      if (editingId === id) cancelEdit();
      await load();
    } catch (e: any) {
      setErr(e.message ?? "Delete failed");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ marginRight: "auto" }}>Equipment</h2>

        {canManage && (
          <button onClick={() => setShowCreate((v) => !v)} style={{ padding: "8px 12px", borderRadius: 8 }}>
            {showCreate ? "Close" : "New Equipment"}
          </button>
        )}

        <button onClick={load} style={{ padding: "8px 12px", borderRadius: 8 }}>
          Refresh
        </button>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}
      {loading && <div style={{ marginTop: 10 }}>Loading...</div>}

      {canManage && showCreate && (
        <form
          onSubmit={submitCreate}
          style={{
            marginTop: 14,
            border: "1px solid #333",
            borderRadius: 12,
            padding: 14,
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 700 }}>Create Equipment</div>

          <input
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Name (unique)"
            required
            style={{ padding: 10, borderRadius: 8 }}
          />

          <input
            value={createForm.category}
            onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="Category (optional)"
            style={{ padding: 10, borderRadius: 8 }}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ padding: "10px 14px", borderRadius: 8 }}>Create</button>
            <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "10px 14px", borderRadius: 8 }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {!loading && (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {items.map((x) => {
            const isEditing = editingId === x.id;

            return (
              <div
                key={x.id}
                style={{
                  border: "1px solid #333",
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  {!isEditing ? (
                    <>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{x.name}</div>
                      <div style={{ opacity: 0.85, marginTop: 6 }}>Category: {x.category ?? "—"}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>
                        Editing: {editingItem?.name ?? `Equipment #${x.id}`}
                      </div>

                      <div style={{ display: "grid", gap: 10 }}>
                        <input
                          value={editForm?.name ?? ""}
                          onChange={(e) => setEditForm((f) => (f ? { ...f, name: e.target.value } : f))}
                          placeholder="Name"
                          style={{ padding: 10, borderRadius: 8 }}
                        />
                        <input
                          value={editForm?.category ?? ""}
                          onChange={(e) => setEditForm((f) => (f ? { ...f, category: e.target.value } : f))}
                          placeholder="Category (optional)"
                          style={{ padding: 10, borderRadius: 8 }}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {canManage ? (
                    !isEditing ? (
                      <>
                        <button onClick={() => startEdit(x.id)} style={{ padding: "8px 12px", borderRadius: 8 }}>
                          Edit
                        </button>
                        <button onClick={() => onDelete(x.id)} style={{ padding: "8px 12px", borderRadius: 8 }}>
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={submitEdit} style={{ padding: "8px 12px", borderRadius: 8 }}>
                          Save
                        </button>
                        <button onClick={cancelEdit} style={{ padding: "8px 12px", borderRadius: 8 }}>
                          Cancel
                        </button>
                      </>
                    )
                  ) : (
                    <span style={{ opacity: 0.6, fontSize: 14 }}>Read-only</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !err && items.length === 0 && <div>No equipment yet.</div>}
    </div>
  );
}
