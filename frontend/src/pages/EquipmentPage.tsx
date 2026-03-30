import { Link, Navigate } from "react-router-dom";
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
  description: string;
  effectiveness: number;
};

type EditForm = {
  category: EquipmentCategory;
  quantity: number;
  description: string;
  effectiveness: number;
};

export default function EquipmentPage() {
  const canManage = hasRole("Admin", "SuperAdmin");
  const canAccess = hasRole("Commander", "Admin", "SuperAdmin");

  const [items, setItems] = useState<EquipmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: "",
    category: "Primary",
    quantity: 0,
    description: "",
    effectiveness: 50,
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
    const item = items.find((x) => x.id === id);
    if (!item) return;

    setEditingId(id);
    setEditForm({
      category: (item.category as EquipmentCategory) ?? "Primary",
      quantity: item.quantity ?? 0,
      description: item.description ?? "",
      effectiveness: item.effectiveness ?? 50,
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
      description: createForm.description.trim() ? createForm.description.trim() : null,
      effectiveness: Number(createForm.effectiveness) || 50,
    };

    try {
      await createEquipment(payload);
      setCreateForm({
        name: "",
        category: "Primary",
        quantity: 0,
        description: "",
        effectiveness: 50,
      });
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
        description: editForm.description.trim() ? editForm.description.trim() : null,
        effectiveness: Number(editForm.effectiveness) || 50,
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

  if (!canAccess) {
    return <Navigate to="/" replace />;
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

          <textarea
            value={createForm.description}
            onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description"
            rows={3}
            style={{ padding: 10, borderRadius: 8 }}
          />

          <input
            type="number"
            value={createForm.effectiveness}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, effectiveness: Number(e.target.value) }))
            }
            placeholder="Effectiveness (1-100)"
            min={1}
            max={100}
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
          {items.map((item) => {
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  border: "1px solid #333",
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  opacity: item.deletedAt ? 0.6 : 1,
                }}
              >
                <div style={{ flex: 1 }}>
                  {!isEditing ? (
                    <>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>
                        <Link
                          to={`/equipment/${item.id}`}
                          style={{ color: "white", textDecoration: "none" }}
                          title="Open equipment profile"
                        >
                          {item.name}
                        </Link>{" "}
                        <span style={{ opacity: 0.7 }}>· {item.category ?? "—"}</span>
                      </div>

                      <div style={{ opacity: 0.85, marginTop: 6 }}>
                        Quantity: {item.quantity}
                      </div>

                      {canManage && (
                      <>
                        <div style={{ opacity: 0.85, marginTop: 6 }}>
                          Allocated: {item.allocatedQuantity}
                        </div>

                        <div style={{ opacity: 0.85, marginTop: 6 }}>
                          Available: {item.availableQuantity}
                        </div>
                      </>
                      )}

                      <div style={{ opacity: 0.85, marginTop: 6 }}>
                        Effectiveness: {item.effectiveness}/100
                      </div>

                      {item.description && (
                        <div style={{ opacity: 0.8, marginTop: 6, whiteSpace: "pre-wrap" }}>
                          {item.description}
                        </div>
                      )}

                      {item.deletedAt && <div style={{ color: "orange" }}>Soft-deleted</div>}
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>
                        Editing: {editingItem?.name ?? `Equipment #${item.id}`}
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

                        <textarea
                          value={editForm?.description ?? ""}
                          onChange={(ev) =>
                            setEditForm((f) => (f ? { ...f, description: ev.target.value } : f))
                          }
                          rows={3}
                          placeholder="Description"
                          style={{ padding: 10, borderRadius: 8 }}
                        />

                        <input
                          type="number"
                          value={editForm?.effectiveness ?? 50}
                          onChange={(ev) =>
                            setEditForm((f) =>
                              f ? { ...f, effectiveness: Number(ev.target.value) } : f
                            )
                          }
                          min={1}
                          max={100}
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
                          onClick={() => startEdit(item.id)}
                          style={{ padding: "8px 12px", borderRadius: 8 }}
                          disabled={!!item.deletedAt}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          style={{ padding: "8px 12px", borderRadius: 8 }}
                          disabled={!!item.deletedAt}
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