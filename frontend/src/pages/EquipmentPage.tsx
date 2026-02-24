import { useEffect, useMemo, useState } from "react";
import { hasRole } from "../api/auth";
import {
  createEquipment,
  deleteEquipment,
  getEquipment,
  updateEquipment,
  type EquipmentCategory,
  type EquipmentDto,
} from "../api/equipment";

const CATEGORIES: EquipmentCategory[] = ["Primary", "Secondary", "Melee", "Utility"];

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Unexpected error";
}

type CreateForm = {
  name: string;
  category: EquipmentCategory;
  quantity: number;
};

type EditForm = {
  category: EquipmentCategory;
  quantity: number;
};

export default function EquipmentPage() {
  const canManage = hasRole("Admin", "SuperAdmin");

  const [items, setItems] = useState<EquipmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: "",
    category: "Primary",
    quantity: 0,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const data = await getEquipment();
      setItems(data);
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
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
      category: (e.category as EquipmentCategory) ?? "Primary",
      quantity: e.quantity ?? 0,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function submitCreate(ev: React.FormEvent) {
    ev.preventDefault();
    setErr(null);

    const payload = {
      name: createForm.name.trim(),
      category: createForm.category,
      quantity: Number(createForm.quantity) || 0,
    };

    try {
      // backend radi upsert + restore + increment
      await createEquipment(payload);
      setCreateForm({ name: "", category: "Primary", quantity: 0 });
      setShowCreate(false);
      await load();
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    }
  }

  async function submitEdit() {
    if (!editingId || !editForm) return;

    setErr(null);
    try {
      await updateEquipment(editingId, {
        category: editForm.category,
        quantity: Number(editForm.quantity) || 0,
      });
      cancelEdit();
      await load();
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Soft-delete this equipment?")) return;

    setErr(null);
    try {
      await deleteEquipment(id);
      if (editingId === id) cancelEdit();
      await load();
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ marginRight: "auto" }}>Equipment</h2>

        {canManage && (
          <button
            onClick={() => setShowCreate((v) => !v)}
            style={{ padding: "8px 12px", borderRadius: 8 }}
          >
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
          <div style={{ fontWeight: 700 }}>Create / Add Stock</div>

          <input
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Name (unique)"
            required
            style={{ padding: 10, borderRadius: 8 }}
          />

          <select
            value={createForm.category}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, category: e.target.value as EquipmentCategory }))
            }
            style={{ padding: 10, borderRadius: 8 }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={createForm.quantity}
            onChange={(e) => setCreateForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
            placeholder="Quantity to add"
            min={0}
            style={{ padding: 10, borderRadius: 8 }}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ padding: "10px 14px", borderRadius: 8 }}>Save</button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              style={{ padding: "10px 14px", borderRadius: 8 }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!loading && (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {items.map((e) => {
            const isEditing = editingId === e.id;

            return (
              <div
                key={e.id}
                style={{
                  border: "1px solid #333",
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  opacity: e.deletedAt ? 0.6 : 1,
                }}
              >
                <div style={{ flex: 1 }}>
                  {!isEditing ? (
                    <>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>
                        {e.name} <span style={{ opacity: 0.7 }}>· {e.category ?? "—"}</span>
                      </div>
                      <div style={{ opacity: 0.85, marginTop: 6 }}>Quantity: {e.quantity}</div>
                      {e.deletedAt && <div style={{ color: "orange" }}>Soft-deleted</div>}
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>
                        Editing: {editingItem?.name ?? `Equipment #${e.id}`}
                      </div>

                      <div style={{ display: "grid", gap: 10 }}>
                        <select
                          value={editForm?.category ?? "Primary"}
                          onChange={(ev) =>
                            setEditForm((f) =>
                              f ? { ...f, category: ev.target.value as EquipmentCategory } : f
                            )
                          }
                          style={{ padding: 10, borderRadius: 8 }}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          value={editForm?.quantity ?? 0}
                          onChange={(ev) =>
                            setEditForm((f) => (f ? { ...f, quantity: Number(ev.target.value) } : f))
                          }
                          min={0}
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
                        <button
                          onClick={() => startEdit(e.id)}
                          style={{ padding: "8px 12px", borderRadius: 8 }}
                          disabled={!!e.deletedAt}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(e.id)}
                          style={{ padding: "8px 12px", borderRadius: 8 }}
                          disabled={!!e.deletedAt}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={submitEdit}
                          style={{ padding: "8px 12px", borderRadius: 8 }}
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{ padding: "8px 12px", borderRadius: 8 }}
                        >
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