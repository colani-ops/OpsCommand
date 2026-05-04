import { Link, Navigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { hasRole } from "../api/auth";
import {
  createEquipment,
  deleteEquipment,
  getEquipment,
  removeEquipmentImage,
  resolveEquipmentImageUrl,
  updateEquipment,
  uploadEquipmentImage,
  type EquipmentCategory,
  type EquipmentDto,
} from "../api/equipment";
import { useErrorHandler } from "../hooks/useErrorHandler";
import ErrorBanner from "../components/ErrorBanner";
import IconButton from "../ui/IconButton";
import { getEquipmentBanner } from "../utils/bannerFallbacks";
import LoadingScreen from "../components/LoadingScreen";
import {
  formFieldStyle,
  iconActionButtonStyle,
  metaLineStyle,
  panelStyle,
  pageTitleStyleShared,
  searchInputStyle,
  sortButtonStyle,
} from "../styles/uiStyles";

const CATEGORIES: EquipmentCategory[] = [
  "Primary",
  "Secondary",
  "Melee",
  "Utility",
];

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

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    "name" | "type" | "effectiveness" | "quantity"
  >("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

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

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const { error, showError, clearError } = useErrorHandler();

  const load = useCallback(async () => {
    clearError();
    setLoading(true);

    try {
      const data = await getEquipment();
      setItems(data);
    } catch (e: unknown) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [clearError, showError]);

  useEffect(() => {
    load();
  }, [load]);

  const editingItem = useMemo(
    () => items.find((x) => x.id === editingId) ?? null,
    [items, editingId],
  );

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

  function getEquipmentDisplayImage(item: EquipmentDto) {
    return (
      resolveEquipmentImageUrl(item.imageUrl) ??
      getEquipmentBanner(item.category)
    );
  }

  function getAllocationPercent(item: EquipmentDto) {
    if (item.quantity <= 0) return 0;
    return Math.round((item.allocatedQuantity / item.quantity) * 100);
  }

  function toggleSort(next: "name" | "type" | "effectiveness" | "quantity") {
    if (sortBy === next) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(next);
    setSortDir("asc");
  }

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = items.filter((item) => {
      if (!q) return true;

      return (
        item.name.toLowerCase().includes(q) ||
        (item.category ?? "").toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      let result = 0;

      switch (sortBy) {
        case "name":
          result = a.name.localeCompare(b.name);
          break;
        case "type":
          result = (a.category ?? "").localeCompare(b.category ?? "");
          break;
        case "effectiveness":
          result = a.effectiveness - b.effectiveness;
          break;
        case "quantity":
          result = a.quantity - b.quantity;
          break;
      }

      return sortDir === "asc" ? result : -result;
    });

    return sorted;
  }, [items, search, sortBy, sortDir]);

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
    clearError();

    const payload = {
      name: createForm.name.trim(),
      category: createForm.category,
      quantity: Number(createForm.quantity) || 0,
      description: createForm.description.trim()
        ? createForm.description.trim()
        : null,
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
      showError(e);
    }
  }

  async function submitEdit() {
    if (!editingId || !editForm) return;

    clearError();
    try {
      await updateEquipment(editingId, {
        category: editForm.category,
        quantity: Number(editForm.quantity) || 0,
        description: editForm.description.trim()
          ? editForm.description.trim()
          : null,
        effectiveness: Number(editForm.effectiveness) || 50,
      });
      cancelEdit();
      await load();
    } catch (e: unknown) {
      showError(e);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Soft-delete this equipment?")) return;

    clearError();
    try {
      await deleteEquipment(id);
      if (editingId === id) cancelEdit();
      await load();
    } catch (e: unknown) {
      showError(e);
    }
  }

  async function onUploadImage(itemId: number, file: File) {
    clearError();
    try {
      await uploadEquipmentImage(itemId, file);
      await load();
    } catch (e: unknown) {
      showError(e);
    }
  }

  async function onRemoveImage(itemId: number) {
    if (!confirm("Remove equipment image and revert to default?")) return;

    clearError();
    try {
      await removeEquipmentImage(itemId);
      await load();
    } catch (e: unknown) {
      showError(e);
    }
  }

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <ErrorBanner error={error} />

      <div style={panelStyle}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr auto auto",
            gap: 16,
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <h2 style={pageTitleStyleShared}>Equipment</h2>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            style={searchInputStyle}
          />

          {canManage && (
            <IconButton
              iconSrc="/icons/add.png"
              alt={
                showCreate
                  ? "Close create equipment form"
                  : "Open create equipment form"
              }
              title={
                showCreate ? "Close create equipment form" : "New equipment"
              }
              variant="transparent"
              onClick={() => setShowCreate((v) => !v)}
            />
          )}

          <IconButton
            iconSrc="/icons/refresh.png"
            alt="Refresh"
            title="Refresh"
            variant="transparent"
            onClick={load}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <button onClick={() => toggleSort("name")} style={sortButtonStyle}>
            Name {sortBy === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
          <button onClick={() => toggleSort("type")} style={sortButtonStyle}>
            Type {sortBy === "type" ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
          <button
            onClick={() => toggleSort("effectiveness")}
            style={sortButtonStyle}
          >
            Eff.{" "}
            {sortBy === "effectiveness" ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
          <button
            onClick={() => toggleSort("quantity")}
            style={sortButtonStyle}
          >
            Quantity{" "}
            {sortBy === "quantity" ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
        </div>

        {loading && <LoadingScreen label="Loading Wargear..." />}

        {canManage && showCreate && (
          <form
            onSubmit={submitCreate}
            style={{
              marginBottom: 18,
              border: "1px solid #9d8560",
              borderRadius: 12,
              padding: 14,
              display: "grid",
              gap: 10,
              background: "rgba(66, 41, 41, 0.45)",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: "#f3efe6",
                fontFamily: "monospace",
              }}
            >
              Create / Add Stock
            </div>

            <input
              value={createForm.name}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="Name (unique)"
              required
              style={formFieldStyle}
            />

            <select
              value={createForm.category}
              onChange={(e) =>
                setCreateForm((f) => ({
                  ...f,
                  category: e.target.value as EquipmentCategory,
                }))
              }
              style={formFieldStyle}
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
              onChange={(e) =>
                setCreateForm((f) => ({
                  ...f,
                  quantity: Number(e.target.value),
                }))
              }
              placeholder="Quantity to add"
              min={0}
              style={formFieldStyle}
            />

            <textarea
              value={createForm.description}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Description"
              rows={3}
              style={formFieldStyle}
            />

            <input
              type="number"
              value={createForm.effectiveness}
              onChange={(e) =>
                setCreateForm((f) => ({
                  ...f,
                  effectiveness: Number(e.target.value),
                }))
              }
              placeholder="Effectiveness (1-100)"
              min={1}
              max={100}
              style={formFieldStyle}
            />

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <IconButton
                label="Save"
                title="Save"
                variant="primary"
                onClick={submitEdit}
              />
              <IconButton
                label="Cancel"
                title="Cancel"
                variant="secondary"
                onClick={cancelEdit}
              />
            </div>
          </form>
        )}

        {!loading && (
          <div
            style={{
              maxHeight: "62vh",
              overflowY: "auto",
              display: "grid",
              gap: 14,
              paddingRight: 6,
            }}
          >
            {visibleItems.map((item) => {
              const isEditing = editingId === item.id;
              const displayImage = getEquipmentDisplayImage(item);

              return (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid #9d8560",
                    borderRadius: 14,
                    background: "rgba(0,0,0,0.58)",
                    overflow: "hidden",
                    opacity: item.deletedAt ? 0.6 : 1,
                    position: "relative",
                  }}
                >
                  {!isEditing ? (
                    <div
                      style={{
                        minHeight: 190,
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: 18,
                        alignItems: "stretch",
                        backgroundImage: `linear-gradient(${getEquipmentOverlay(
                          item.category,
                        )}, rgba(0,0,0,0.74)), url(${displayImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }}
                    >
                      <div style={{ padding: 14 }}>
                        <div
                          style={{
                            maxWidth: 720,
                            border: "1px solid rgba(255,255,255,0.16)",
                            borderRadius: 12,
                            padding: 16,
                            background: "rgba(20,20,20,0.62)",
                            backdropFilter: "blur(2px)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 24,
                              fontWeight: 800,
                              color: "#efb85f",
                              fontFamily: "monospace",
                              marginBottom: 8,
                            }}
                          >
                            <Link
                              to={`/equipment/${item.id}`}
                              style={{
                                color: "inherit",
                                textDecoration: "none",
                              }}
                            >
                              {item.name}
                            </Link>
                          </div>

                          <div style={metaLineStyle}>
                            Category: {item.category ?? "—"}
                          </div>
                          <div style={metaLineStyle}>
                            Effectiveness: {item.effectiveness}/100
                          </div>
                          <div style={metaLineStyle}>
                            Stock: {item.availableQuantity} available /{" "}
                            {item.quantity} total
                          </div>
                          <div style={metaLineStyle}>
                            Allocation: {item.allocatedQuantity} allocated (
                            {getAllocationPercent(item)}%)
                          </div>

                          {item.description && (
                            <div
                              style={{
                                color: "#f3efe6",
                                fontFamily: "monospace",
                                fontSize: 14,
                                marginTop: 10,
                                whiteSpace: "pre-wrap",
                                opacity: 0.9,
                              }}
                            >
                              {item.description}
                            </div>
                          )}

                          {item.deletedAt && (
                            <div
                              style={{
                                color: "#ffb347",
                                fontFamily: "monospace",
                                marginTop: 8,
                              }}
                            >
                              Soft-deleted
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: 14,
                          flexWrap: "wrap",
                        }}
                      >
                        {canManage ? (
                          <>
                            <input
                              ref={(el) => {
                                fileInputRefs.current[item.id] = el;
                              }}
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  onUploadImage(item.id, file);
                                }
                                e.currentTarget.value = "";
                              }}
                            />

                            <IconButton
                              iconSrc="/icons/edit.png"
                              alt="Edit Equipment"
                              title="Edit Equipment"
                              variant="transparent"
                              onClick={() => startEdit(item.id)}
                              style={iconActionButtonStyle}
                              disabled={!!item.deletedAt}
                            />

                            <IconButton
                              iconSrc="/icons/upload.png"
                              alt="Upload image"
                              title="Upload image"
                              variant="secondary"
                              onClick={() =>
                                fileInputRefs.current[item.id]?.click()
                              }
                              style={iconActionButtonStyle}
                              disabled={!!item.deletedAt}
                            />

                            {!!item.imageUrl && (
                              <IconButton
                                iconSrc="/icons/delete.png"
                                alt="Remove image"
                                title="Remove image"
                                variant="danger"
                                onClick={() => onRemoveImage(item.id)}
                                style={iconActionButtonStyle}
                                disabled={!!item.deletedAt}
                              />
                            )}

                            <IconButton
                              iconSrc="/icons/delete.png"
                              alt="Delete Equipment"
                              title="Delete Equipment"
                              variant="danger"
                              onClick={() => onDelete(item.id)}
                              style={iconActionButtonStyle}
                              disabled={!!item.deletedAt}
                            />
                          </>
                        ) : (
                          <span
                            style={{
                              opacity: 0.6,
                              fontSize: 14,
                              color: "#f3efe6",
                            }}
                          >
                            Read-only
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: 14,
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: 18,
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            marginBottom: 8,
                            color: "#f3efe6",
                            fontFamily: "monospace",
                          }}
                        >
                          Editing:{" "}
                          {editingItem?.name ?? `Equipment #${item.id}`}
                        </div>

                        <div style={{ display: "grid", gap: 10 }}>
                          <select
                            value={editForm?.category ?? "Primary"}
                            onChange={(ev) =>
                              setEditForm((f) =>
                                f
                                  ? {
                                      ...f,
                                      category: ev.target
                                        .value as EquipmentCategory,
                                    }
                                  : f,
                              )
                            }
                            style={formFieldStyle}
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
                              setEditForm((f) =>
                                f
                                  ? { ...f, quantity: Number(ev.target.value) }
                                  : f,
                              )
                            }
                            min={0}
                            style={formFieldStyle}
                          />

                          <textarea
                            value={editForm?.description ?? ""}
                            onChange={(ev) =>
                              setEditForm((f) =>
                                f ? { ...f, description: ev.target.value } : f,
                              )
                            }
                            rows={3}
                            placeholder="Description"
                            style={formFieldStyle}
                          />

                          <input
                            type="number"
                            value={editForm?.effectiveness ?? 50}
                            onChange={(ev) =>
                              setEditForm((f) =>
                                f
                                  ? {
                                      ...f,
                                      effectiveness: Number(ev.target.value),
                                    }
                                  : f,
                              )
                            }
                            min={1}
                            max={100}
                            style={formFieldStyle}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          onClick={submitEdit}
                          style={iconActionButtonStyle}
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={iconActionButtonStyle}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {!error && visibleItems.length === 0 && (
              <div style={{ color: "#f3efe6", fontFamily: "monospace" }}>
                No equipment found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
