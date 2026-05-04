import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { hasRole } from "../api/auth";
import {
  deleteEquipment,
  getEquipmentById,
  removeEquipmentImage,
  resolveEquipmentImageUrl,
  updateEquipment,
  uploadEquipmentImage,
  type EquipmentCategory,
  type EquipmentDto,
} from "../api/equipment";
import ErrorBanner from "../components/ErrorBanner";
import { useErrorHandler } from "../hooks/useErrorHandler";
import IconButton from "../ui/IconButton";
import { getEquipmentBanner } from "../utils/bannerFallbacks";

const CATEGORIES: EquipmentCategory[] = ["Primary", "Secondary", "Melee", "Utility"];

type EditForm = {
  category: EquipmentCategory;
  quantity: number;
  description: string;
  effectiveness: number;
};

export default function EquipmentProfilePage() {
  const { id } = useParams();
  const canAccess = hasRole("Member", "Commander", "Admin", "SuperAdmin");
  const canManage = hasRole("Admin", "SuperAdmin");

  const [item, setItem] = useState<EquipmentDto | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { error, showError, clearError } = useErrorHandler();

  const load = useCallback(async () => {
    if (!id) {
      setItem(null);
      setLoading(false);
      showError("Equipment not found.");
      return;
    }

    clearError();
    setLoading(true);

    try {
      const data = await getEquipmentById(Number(id));
      setItem(data);
    } catch (e: unknown) {
      setItem(null);
      showError(e instanceof Error ? e.message : "Failed to load equipment");
    } finally {
      setLoading(false);
    }
  }, [id, clearError, showError]);

  useEffect(() => {
    load();
  }, [load]);

  function getEquipmentOverlay(category: string | null) {
    switch (category) {
      case "Primary":
        return "rgba(12, 32, 50, 0.68)";
      case "Secondary":
        return "rgba(38, 20, 52, 0.66)";
      case "Melee":
        return "rgba(52, 22, 22, 0.66)";
      case "Utility":
        return "rgba(24, 48, 34, 0.66)";
      default:
        return "rgba(0, 0, 0, 0.62)";
    }
  }

  function getEquipmentDisplayImage(currentItem: EquipmentDto) {
    return resolveEquipmentImageUrl(currentItem.imageUrl) ?? getEquipmentBanner(currentItem.category);
  }

  function getAllocationPercent(currentItem: EquipmentDto) {
    if (currentItem.quantity <= 0) return 0;
    return Math.round((currentItem.allocatedQuantity / currentItem.quantity) * 100);
  }

  function startEdit() {
    if (!item) return;

    setEditForm({
      category: (item.category as EquipmentCategory) ?? "Primary",
      quantity: item.quantity ?? 0,
      description: item.description ?? "",
      effectiveness: item.effectiveness ?? 50,
    });
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditForm(null);
  }

  async function submitEdit() {
    if (!item || !editForm) return;

    clearError();

    try {
      await updateEquipment(item.id, {
        category: editForm.category,
        quantity: Number(editForm.quantity) || 0,
        description: editForm.description.trim() ? editForm.description.trim() : null,
        effectiveness: Number(editForm.effectiveness) || 50,
      });

      setIsEditing(false);
      setEditForm(null);
      await load();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Failed to update equipment");
    }
  }

  async function onDelete() {
    if (!item) return;
    if (!confirm("Soft-delete this equipment?")) return;

    clearError();

    try {
      await deleteEquipment(item.id);
      await load();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Failed to delete equipment");
    }
  }

  async function onUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !item) return;

    clearError();

    try {
      setUploadingImage(true);
      await uploadEquipmentImage(item.id, file);
      await load();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Failed to upload equipment image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function onRemoveImage() {
    if (!item) return;
    if (!confirm("Remove equipment image and revert to default?")) return;

    clearError();

    try {
      setUploadingImage(true);
      await removeEquipmentImage(item.id);
      await load();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Failed to remove equipment image");
    } finally {
      setUploadingImage(false);
    }
  }

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <ErrorBanner error={error} />

      <div
        style={{
          border: "2px solid #c9a56a",
          borderRadius: 14,
          background: "rgba(0, 0, 0, 0.78)",
          padding: 24,
        }}
      >
        <h2
          style={{
            margin: "0 0 24px 0",
            color: "#f3efe6",
            fontFamily: "monospace",
            fontSize: 28,
          }}
        >
          Equipment Profile
        </h2>

        {loading && <div style={infoTextStyle}>Loading...</div>}

        {!loading && !error && !item && (
          <div
            style={{
              border: "1px solid #9d8560",
              borderRadius: 14,
              background: "rgba(0,0,0,0.55)",
              padding: 18,
            }}
          >
            <div style={detailsTitleStyle}>Equipment not found</div>
            <div style={detailsLineStyle}>
              The requested equipment profile could not be loaded.
            </div>
          </div>
        )}

        {!loading && item && (
          <div
            style={{
              border: "1px solid #9d8560",
              borderRadius: 14,
              overflow: "hidden",
              background: "rgba(0,0,0,0.55)",
              opacity: item.deletedAt ? 0.72 : 1,
            }}
          >
            {!isEditing ? (
              <div
                style={{
                  minHeight: 620,
                  display: "grid",
                  gridTemplateRows: "auto 1fr",
                  backgroundImage: `linear-gradient(${getEquipmentOverlay(
                    item.category
                  )}, rgba(0,0,0,0.78)), url(${getEquipmentDisplayImage(item)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                    padding: 18,
                  }}
                >
                  <div style={{ minHeight: 46 }} />

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {canManage && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          onChange={onUploadImage}
                          style={{ display: "none" }}
                        />

                        <IconButton
                          iconSrc="/icons/edit.png"
                          alt="Edit equipment"
                          title="Edit equipment"
                          variant="secondary"
                          onClick={startEdit}
                          disabled={!!item.deletedAt}
                        />

                        <IconButton
                          iconSrc="/icons/upload.png"
                          alt="Upload equipment image"
                          title="Upload equipment image"
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={!!item.deletedAt || uploadingImage}
                        />

                        {!!item.imageUrl && (
                          <IconButton
                            iconSrc="/icons/delete.png"
                            alt="Remove equipment image"
                            title="Remove equipment image"
                            variant="danger"
                            onClick={onRemoveImage}
                            disabled={!!item.deletedAt || uploadingImage}
                          />
                        )}

                        <IconButton
                          iconSrc="/icons/delete.png"
                          alt="Delete equipment"
                          title="Delete equipment"
                          variant="danger"
                          onClick={onDelete}
                          disabled={!!item.deletedAt}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    alignItems: "start",
                    padding: "0 18px 18px 18px",
                  }}
                >
                  <div
                    style={{
                      maxWidth: 860,
                      minHeight: 360,
                      border: "1px solid rgba(201,165,106,0.55)",
                      borderRadius: 14,
                      padding: 22,
                      background: "rgba(8,12,18,0.72)",
                      backdropFilter: "blur(2px)",
                      boxShadow: "0 10px 28px rgba(0,0,0,0.24)",
                    }}
                  >
                    <div
                      style={{
                        color: "#efb85f",
                        fontFamily: "monospace",
                        fontWeight: 800,
                        fontSize: 30,
                        marginBottom: 16,
                      }}
                    >
                      {item.name}
                    </div>

                    <div style={metaLineStyle}>Category: {item.category ?? "—"}</div>
                    <div style={metaLineStyle}>Total Stock: {item.quantity}</div>
                    <div style={metaLineStyle}>
                      Available Stock: {item.availableQuantity}
                    </div>
                    <div style={metaLineStyle}>
                      Allocated Stock: {item.allocatedQuantity}
                    </div>
                    <div style={metaLineStyle}>
                      Allocation Rate: {getAllocationPercent(item)}%
                    </div>
                    <div style={metaLineStyle}>
                      Effectiveness: {item.effectiveness}/100
                    </div>

                    {item.deletedAt && (
                      <div
                        style={{
                          marginTop: 10,
                          color: "#ffb347",
                          fontFamily: "monospace",
                          fontSize: 15,
                          fontWeight: 700,
                        }}
                      >
                        Soft-deleted
                      </div>
                    )}

                    <div
                      style={{
                        marginTop: 22,
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 12,
                        padding: 14,
                        background: "rgba(20,20,20,0.48)",
                      }}
                    >
                      <div style={detailsTitleStyle}>Description</div>
                      <div
                        style={{
                          ...detailsLineStyle,
                          whiteSpace: "pre-wrap",
                          marginBottom: 0,
                        }}
                      >
                        {item.description?.trim() || "No description."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  minHeight: 520,
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 18,
                  alignItems: "start",
                  padding: 18,
                  backgroundImage: `linear-gradient(${getEquipmentOverlay(
                    item.category
                  )}, rgba(0,0,0,0.74)), url(${getEquipmentDisplayImage(item)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <div
                  style={{
                    maxWidth: 860,
                    border: "1px solid rgba(201,165,106,0.55)",
                    borderRadius: 14,
                    padding: 22,
                    background: "rgba(8,12,18,0.74)",
                    backdropFilter: "blur(2px)",
                  }}
                >
                  <div
                    style={{
                      color: "#efb85f",
                      fontFamily: "monospace",
                      fontWeight: 800,
                      fontSize: 24,
                      marginBottom: 8,
                    }}
                  >
                    Editing: {item.name}
                  </div>

                  <div
                    style={{
                      color: "#d7b176",
                      fontFamily: "monospace",
                      fontSize: 14,
                      marginBottom: 16,
                    }}
                  >
                    Name is currently fixed here to stay aligned with your existing equipment flow.
                  </div>

                  <div style={{ display: "grid", gap: 12 }}>
                    <select
                      value={editForm?.category ?? "Primary"}
                      onChange={(e) =>
                        setEditForm((f) =>
                          f ? { ...f, category: e.target.value as EquipmentCategory } : f
                        )
                      }
                      style={formFieldStyle}
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={0}
                      value={editForm?.quantity ?? 0}
                      onChange={(e) =>
                        setEditForm((f) =>
                          f ? { ...f, quantity: Number(e.target.value) } : f
                        )
                      }
                      style={formFieldStyle}
                      placeholder="Quantity"
                    />

                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={editForm?.effectiveness ?? 50}
                      onChange={(e) =>
                        setEditForm((f) =>
                          f ? { ...f, effectiveness: Number(e.target.value) } : f
                        )
                      }
                      style={formFieldStyle}
                      placeholder="Effectiveness"
                    />

                    <textarea
                      rows={6}
                      value={editForm?.description ?? ""}
                      onChange={(e) =>
                        setEditForm((f) =>
                          f ? { ...f, description: e.target.value } : f
                        )
                      }
                      style={formFieldStyle}
                      placeholder="Description"
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const infoTextStyle: React.CSSProperties = {
  color: "#f3efe6",
  fontFamily: "monospace",
};

const metaLineStyle: React.CSSProperties = {
  color: "#d7b176",
  fontFamily: "monospace",
  fontSize: 16,
  marginBottom: 6,
};

const detailsTitleStyle: React.CSSProperties = {
  color: "#efb85f",
  fontFamily: "monospace",
  fontWeight: 800,
  fontSize: 18,
  marginBottom: 10,
};

const detailsLineStyle: React.CSSProperties = {
  color: "#f3efe6",
  fontFamily: "monospace",
  fontSize: 14,
  marginBottom: 6,
};

const formFieldStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #9d8560",
  background: "rgba(0,0,0,0.55)",
  color: "#f3efe6",
  fontFamily: "monospace",
};