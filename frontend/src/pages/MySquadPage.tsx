import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getUser, hasRole } from "../api/auth";
import { resolveUserImageUrl } from "../api/users";
import {
  getEquipment,
  resolveEquipmentImageUrl,
  type EquipmentDto,
} from "../api/equipment";
import {
  addSquadEquipment,
  deleteSquadEquipment,
  getMySquad,
  getSquadEquipment,
  removeSquadBanner,
  resolveSquadBannerUrl,
  updateSquadEquipment,
  uploadSquadBanner,
  type MySquadDto,
  type SquadEquipmentDto,
} from "../api/squads";
import { useErrorHandler } from "../hooks/useErrorHandler";
import ErrorBanner from "../components/ErrorBanner";
import IconButton from "../ui/IconButton";
import LoadingScreen from "../components/LoadingScreen";
import {
  detailsLineStyle,
  emptyPanelStyle,
  formFieldStyle,
  iconActionButtonStyle,
  metaLineStyle,
  miniTitleStyle,
  pageTitleStyleShared,
  panelStyle,
  sectionTitleStyle,
  toolbarButtonStyle,
} from "../styles/uiStyles";

export default function MySquadPage() {
  const canAccess = hasRole("Member", "Commander");
  const canManageEquipment = hasRole("Commander");
  const currentUser = getUser();

  const [squad, setSquad] = useState<MySquadDto | null>(null);
  const [equipment, setEquipment] = useState<SquadEquipmentDto[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<EquipmentDto[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | "">(
    "",
  );
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [editQuantities, setEditQuantities] = useState<Record<number, number>>(
    {},
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const { error, showError, clearError } = useErrorHandler();

  const load = useCallback(async () => {
    clearError();
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
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [canManageEquipment, clearError, showError]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  function getSquadTypeImage(type: string | null) {
    switch (type) {
      case "Assault":
        return "/squad-assault.png";
      case "Tactical":
        return "/squad-tactical.png";
      case "Recon":
        return "/squad-recon.png";
      default:
        return "/squad-default.png";
    }
  }

  function getSquadBannerImage() {
    if (squad?.bannerImageUrl) {
      return (
        resolveSquadBannerUrl(squad.bannerImageUrl) ??
        getSquadTypeImage(squad.type)
      );
    }

    return getSquadTypeImage(squad?.type ?? null);
  }

  function getEquipmentBanner(category: string | null) {
    switch (category) {
      case "Primary":
        return "/banners/equipment-primary.png";
      case "Secondary":
        return "/banners/equipment-secondary.png";
      case "Melee":
        return "/banners/equipment-melee.png";
      case "Utility":
        return "/banners/equipment-utility.png";
      default:
        return "/banners/equipment-default.png";
    }
  }

  function getEquipmentDisplayImage(
    item: SquadEquipmentDto & { imageUrl?: string | null },
  ) {
    return (
      resolveEquipmentImageUrl(item.imageUrl) ??
      getEquipmentBanner(item.category)
    );
  }

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

  async function onAddEquipment(e: React.FormEvent) {
    e.preventDefault();
    if (!squad || selectedEquipmentId === "") return;

    try {
      clearError();

      await addSquadEquipment(squad.id, {
        equipmentId: Number(selectedEquipmentId),
        quantity: newQuantity,
      });

      setSelectedEquipmentId("");
      setNewQuantity(1);
      await load();
    } catch (e) {
      showError(e);
    }
  }

  async function onUpdateQuantity(equipmentId: number, quantity: number) {
    if (!squad) return;

    try {
      clearError();

      await updateSquadEquipment(squad.id, equipmentId, { quantity });
      await load();
    } catch (e) {
      showError(e);
    }
  }

  async function onDeleteEquipment(equipmentId: number) {
    if (!squad) return;
    if (!confirm("Remove this equipment from squad?")) return;

    try {
      clearError();

      await deleteSquadEquipment(squad.id, equipmentId);
      await load();
    } catch (e) {
      showError(e);
    }
  }

  async function onUploadBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !squad) return;

    try {
      clearError();
      setUploadingBanner(true);

      await uploadSquadBanner(squad.id, file);
      await load();
    } catch (e) {
      showError(e);
    } finally {
      setUploadingBanner(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function onRemoveBanner() {
    if (!squad) return;
    if (!confirm("Remove squad banner and revert to default?")) return;

    try {
      clearError();
      setUploadingBanner(true);

      await removeSquadBanner(squad.id);
      await load();
    } catch (e) {
      showError(e);
    } finally {
      setUploadingBanner(false);
    }
  }

  const canManageBanner =
    canManageEquipment && currentUser && squad?.commanderId === currentUser.id;

  return (
    <div>
      <ErrorBanner error={error} />

      <div style={panelStyle}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 16,
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <h2 style={pageTitleStyleShared}>My Squad</h2>

          <IconButton
            iconSrc="/icons/refresh.png"
            alt="Refresh squads"
            title="Refresh squads"
            variant="transparent"
            onClick={load}
          />
        </div>

        {loading && <LoadingScreen label="Loading squad..." />}

        {!loading && !error && !squad && (
          <div
            style={{
              ...emptyPanelStyle,
              display: "grid",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#efb85f",
                fontFamily: "monospace",
              }}
            >
              No squad assigned
            </div>
            <div style={detailsLineStyle}>
              You're not assigned to a squad yet. Contact an Admin to be
              assigned to one.
            </div>
          </div>
        )}

        {!loading && squad && (
          <>
            <div
              style={{
                border: "1px solid #9d8560",
                borderRadius: 14,
                overflow: "hidden",
                marginBottom: 18,
                background: "rgba(0,0,0,0.58)",
              }}
            >
              <div
                style={{
                  minHeight: 210,
                  display: "grid",
                  gridTemplateColumns: "180px 1fr",
                  gap: 18,
                  padding: 18,
                  alignItems: "start",
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.34), rgba(0,0,0,0.52)), url(${getSquadBannerImage()})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: 14,
                    overflow: "hidden",
                    border: "2px solid #c9a56a",
                    background: "rgba(0,0,0,0.35)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <img
                    src={getSquadTypeImage(squad.type)}
                    alt={squad.type}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>

                <div
                  style={{
                    maxWidth: 720,
                    border: "1px solid rgba(255,255,255,0.16)",
                    borderRadius: 12,
                    padding: 16,
                    background: "rgba(20,20,20,0.68)",
                    backdropFilter: "blur(2px)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: "#efb85f",
                      fontFamily: "monospace",
                      marginBottom: 10,
                    }}
                  >
                    {squad.name}{" "}
                    <span style={{ opacity: 0.75 }}>· {squad.type}</span>
                  </div>

                  <div style={metaLineStyle}>
                    Commander: {squad.commanderName ?? squad.commanderId ?? "—"}
                  </div>
                  <div style={metaLineStyle}>
                    Missions Served: {squad.missionsServed}
                  </div>
                  <div style={metaLineStyle}>
                    Successful Missions: {squad.missionsWon}
                  </div>
                  <div style={metaLineStyle}>
                    Success Rate:{" "}
                    {squad.missionsServed > 0 ? `${squad.successRate}%` : "N/A"}
                  </div>

                  {canManageBanner && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={onUploadBanner}
                        style={{ display: "none" }}
                      />

                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          flexWrap: "wrap",
                          marginTop: 12,
                        }}
                      >
                        <IconButton
                          iconSrc="/icons/upload.png"
                          label={
                            uploadingBanner ? "Uploading..." : "Upload Banner"
                          }
                          alt="Upload banner"
                          title="Upload banner"
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingBanner}
                        />

                        {squad.bannerImageUrl && (
                          <IconButton
                            iconSrc="/icons/delete.png"
                            label="Remove Banner"
                            alt="Remove banner"
                            title="Remove banner"
                            variant="danger"
                            onClick={onRemoveBanner}
                            disabled={uploadingBanner}
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                border: "1px solid #9d8560",
                borderRadius: 14,
                background: "rgba(0,0,0,0.58)",
                padding: 16,
                marginBottom: 18,
              }}
            >
              <div style={sectionTitleStyle}>Squad Members</div>

              {squad.members.length === 0 ? (
                <div style={detailsLineStyle}>
                  No members assigned to this squad.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {squad.members.map((member) => {
                    const memberImageUrl = resolveUserImageUrl(
                      member.profileImageUrl,
                    );

                    return (
                      <div
                        key={member.id}
                        style={{
                          border: "1px solid rgba(255,255,255,0.16)",
                          borderRadius: 12,
                          padding: 16,
                          background: "rgba(20,20,20,0.72)",
                          display: "grid",
                          gridTemplateColumns: "110px 1fr 280px",
                          gap: 16,
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 88,
                            height: 88,
                            borderRadius: "50%",
                            border: "2px solid rgba(255,255,255,0.18)",
                            background: "rgba(220,220,220,0.92)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 34,
                            color: "#666",
                            overflow: "hidden",
                          }}
                        >
                          {memberImageUrl ? (
                            <img
                              src={memberImageUrl}
                              alt={member.userName ?? member.email}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            "◉"
                          )}
                        </div>

                        <div>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 22,
                              fontFamily: "monospace",
                              color: "#efb85f",
                              marginBottom: 8,
                            }}
                          >
                            <Link
                              to={
                                member.id === currentUser?.id
                                  ? "/my-profile"
                                  : `/users/${member.id}`
                              }
                              style={{
                                color: "inherit",
                                textDecoration: "none",
                              }}
                              title={
                                member.id === currentUser?.id
                                  ? "Open my profile"
                                  : "Open user profile"
                              }
                            >
                              {member.userName ?? member.email}
                            </Link>
                          </div>

                          <div style={detailsLineStyle}>
                            Email: {member.email}
                          </div>
                          <div style={detailsLineStyle}>
                            Role: {member.role}
                          </div>
                          <div style={detailsLineStyle}>
                            Status: {member.isActive ? "Active" : "Disabled"}
                          </div>
                        </div>

                        <div
                          style={{
                            border: "1px solid rgba(201,165,106,0.20)",
                            borderRadius: 12,
                            padding: 12,
                            background: "rgba(0,0,0,0.28)",
                          }}
                        >
                          <div style={miniTitleStyle}>Equipped Summary</div>

                          <div style={detailsLineStyle}>
                            Primary:{" "}
                            {member.equipmentSummary.primary.length > 0
                              ? member.equipmentSummary.primary.join(", ")
                              : "—"}
                          </div>

                          <div style={detailsLineStyle}>
                            Secondary:{" "}
                            {member.equipmentSummary.secondary.length > 0
                              ? member.equipmentSummary.secondary.join(", ")
                              : "—"}
                          </div>

                          <div style={detailsLineStyle}>
                            Melee:{" "}
                            {member.equipmentSummary.melee.length > 0
                              ? member.equipmentSummary.melee.join(", ")
                              : "—"}
                          </div>

                          <div style={detailsLineStyle}>
                            Utility:{" "}
                            {member.equipmentSummary.utility.length > 0
                              ? member.equipmentSummary.utility.join(", ")
                              : "—"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              style={{
                border: "1px solid #9d8560",
                borderRadius: 14,
                background: "rgba(0,0,0,0.58)",
                padding: 16,
              }}
            >
              <div style={sectionTitleStyle}>Squad Equipment</div>

              {canManageEquipment && (
                <form
                  onSubmit={onAddEquipment}
                  style={{
                    display: "grid",
                    gap: 10,
                    marginBottom: 16,
                    border: "1px solid rgba(201,165,106,0.28)",
                    borderRadius: 12,
                    padding: 14,
                    background: "rgba(0,0,0,0.40)",
                  }}
                >
                  <select
                    value={selectedEquipmentId}
                    onChange={(e) =>
                      setSelectedEquipmentId(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                    style={formFieldStyle}
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
                    style={formFieldStyle}
                  />

                  <button style={toolbarButtonStyle}>Add Equipment</button>
                </form>
              )}

              {equipment.length === 0 ? (
                <div style={detailsLineStyle}>
                  No equipment assigned to this squad.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {equipment.map((item) => {
                    const squadEquipmentItem = item as SquadEquipmentDto & {
                      effectiveness?: number;
                      availableQuantity?: number;
                      description?: string | null;
                    };

                    return (
                      <div
                        key={item.equipmentId}
                        style={{
                          border: "1px solid #9d8560",
                          borderRadius: 14,
                          overflow: "hidden",
                          background: "rgba(0,0,0,0.58)",
                        }}
                      >
                        <div
                          style={{
                            minHeight: 170,
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            gap: 18,
                            alignItems: "stretch",
                            backgroundImage: `linear-gradient(${getEquipmentOverlay(
                              item.category,
                            )}, rgba(0,0,0,0.74)), url(${getEquipmentDisplayImage(item)})`,
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
                                  to={`/equipment/${item.equipmentId}`}
                                  style={{
                                    color: "inherit",
                                    textDecoration: "none",
                                  }}
                                  title="Open equipment profile"
                                >
                                  {item.equipmentName}
                                </Link>
                              </div>

                              <div style={metaLineStyle}>
                                Category: {item.category ?? "—"}
                              </div>
                              <div style={metaLineStyle}>
                                Squad Quantity: {item.quantity}
                              </div>

                              {squadEquipmentItem.effectiveness != null && (
                                <div style={metaLineStyle}>
                                  Effectiveness:{" "}
                                  {squadEquipmentItem.effectiveness}/100
                                </div>
                              )}

                              {squadEquipmentItem.availableQuantity != null && (
                                <div style={metaLineStyle}>
                                  Global Available:{" "}
                                  {squadEquipmentItem.availableQuantity}
                                </div>
                              )}

                              {squadEquipmentItem.description && (
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
                                  {squadEquipmentItem.description}
                                </div>
                              )}
                            </div>
                          </div>

                          {canManageEquipment &&
                            currentUser &&
                            squad.commanderId === currentUser.id && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: 14,
                                  flexWrap: "wrap",
                                }}
                              >
                                <input
                                  type="number"
                                  min={1}
                                  value={
                                    editQuantities[item.equipmentId] ??
                                    item.quantity
                                  }
                                  onChange={(e) =>
                                    setEditQuantities((prev) => ({
                                      ...prev,
                                      [item.equipmentId]: Number(
                                        e.target.value,
                                      ),
                                    }))
                                  }
                                  style={{
                                    width: 80,
                                    ...formFieldStyle,
                                  }}
                                />

                                <IconButton
                                  iconSrc="/icons/save.png"
                                  alt="Save"
                                  title="Save"
                                  variant="secondary"
                                  onClick={() =>
                                    onUpdateQuantity(
                                      item.equipmentId,
                                      editQuantities[item.equipmentId] ??
                                        item.quantity,
                                    )
                                  }
                                  style={iconActionButtonStyle}
                                />

                                <IconButton
                                  iconSrc="/icons/delete.png"
                                  alt="Remove"
                                  title="Remove"
                                  variant="danger"
                                  onClick={() =>
                                    onDeleteEquipment(item.equipmentId)
                                  }
                                  style={iconActionButtonStyle}
                                />
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
