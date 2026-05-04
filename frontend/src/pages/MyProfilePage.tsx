import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getUser } from "../api/auth";
import {
  changeMyPassword,
  deleteMyProfileImage,
  getMe,
  resolveUserImageUrl,
  updateMe,
  uploadMyProfileImage,
  type UserDto,
} from "../api/users";
import { getSquad, type SquadDto } from "../api/squads";
import {
  addMyUserEquipment,
  deleteMyUserEquipment,
  getAvailableUserEquipment,
  getMyUserEquipment,
  updateMyUserEquipment,
  type UserEquipmentDto,
} from "../api/userEquipment";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { resolveEquipmentImageUrl } from "../api/equipment";
import ErrorBanner from "../components/ErrorBanner";
import LoadingScreen from "../components/LoadingScreen";
import {
  detailsLineStyle,
  detailsTitleStyle,
  emptyPanelStyle,
  formFieldStyle,
  heroTitleStyle,
  iconActionButtonStyle,
  metaLineStyle,
  pageTitleStyleShared,
  panelStyle,
  sectionBoxStyle,
  sectionTitleStyle,
  smallActionButtonStyle,
  smallDangerButtonStyle,
  softSectionBoxStyle,
  toolbarButtonStyle,
} from "../styles/uiStyles";

function getPrimaryRoleLabel(roles: string[]) {
  const order = ["SuperAdmin", "Admin", "Commander", "Member", "Recruit"];
  for (const role of order) {
    if (roles.includes(role)) return role;
  }
  return roles[0] ?? "User";
}

function getVeterancyLabel(missionsServed: number) {
  if (missionsServed >= 20) return "Elite";
  if (missionsServed >= 10) return "Veteran";
  if (missionsServed >= 5) return "Experienced";
  if (missionsServed >= 1) return "Active";
  return "Fresh";
}

function getSquadTypeImage(type?: string | null) {
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

function getEquipmentBanner(category?: string | null) {
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

function getEquipmentDisplayImage(item: UserEquipmentDto) {
  return resolveEquipmentImageUrl(item.imageUrl) ?? getEquipmentBanner(item.category);
}

export default function MyProfilePage() {
  const authUser = useMemo(() => getUser(), []);
  const { error, showError, clearError } = useErrorHandler();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [me, setMe] = useState<UserDto | null>(null);
  const [assignedSquadId, setAssignedSquadId] = useState<number | null>(null);
  const [squad, setSquad] = useState<SquadDto | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingEquipment, setSavingEquipment] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [availableEquipment, setAvailableEquipment] = useState<UserEquipmentDto[]>([]);
  const [myEquipment, setMyEquipment] = useState<UserEquipmentDto[]>([]);

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | "">("");
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [editQuantities, setEditQuantities] = useState<Record<number, number>>({});

  const [profileForm, setProfileForm] = useState({
    userName: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const loadEquipmentData = useCallback(async () => {
    const [available, mine] = await Promise.all([
      getAvailableUserEquipment(),
      getMyUserEquipment(),
    ]);

    setAvailableEquipment(available);
    setMyEquipment(mine);
    setEditQuantities(Object.fromEntries(mine.map((item) => [item.equipmentId, item.quantity])));
  }, []);

  const loadProfileData = useCallback(async () => {
    if (!authUser) {
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    clearError();

    try {
      const meData = await getMe();
      setMe(meData);
      setProfileForm({
        userName: meData.userName ?? "",
        email: meData.email ?? "",
      });

      const squadId = meData.assignedSquadId ?? null;
      setAssignedSquadId(squadId);

      if (!squadId) {
        setSquad(null);
        setAvailableEquipment([]);
        setMyEquipment([]);
        return;
      }

      const squadData = await getSquad(squadId);
      setSquad(squadData);

      await loadEquipmentData();
    } catch (e: unknown) {
      showError(e);
      setMe(null);
      setAssignedSquadId(null);
      setSquad(null);
      setAvailableEquipment([]);
      setMyEquipment([]);
    } finally {
      setLoadingProfile(false);
    }
  }, [authUser, clearError, showError, loadEquipmentData]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setSuccessMsg(null);

    try {
      setSavingProfile(true);

      const updated = await updateMe({
        userName: profileForm.userName.trim(),
        email: profileForm.email.trim(),
      });

      setMe(updated);
      setProfileForm({
        userName: updated.userName ?? "",
        email: updated.email ?? "",
      });
      setSuccessMsg("Profile updated.");
    } catch (e: unknown) {
      showError(e);
    } finally {
      setSavingProfile(false);
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setSuccessMsg(null);

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showError(new Error("Fill in current and new password."));
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError(new Error("New password and confirmation do not match."));
      return;
    }

    try {
      setChangingPassword(true);

      await changeMyPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSuccessMsg("Password changed.");
    } catch (e: unknown) {
      showError(e);
    } finally {
      setChangingPassword(false);
    }
  }

  async function onAddMyEquipment(e: React.FormEvent) {
    e.preventDefault();
    if (selectedEquipmentId === "") return;

    try {
      clearError();
      setSavingEquipment(true);

      await addMyUserEquipment({
        equipmentId: Number(selectedEquipmentId),
        quantity: newQuantity,
      });

      setSelectedEquipmentId("");
      setNewQuantity(1);
      await loadEquipmentData();
    } catch (e: unknown) {
      showError(e);
    } finally {
      setSavingEquipment(false);
    }
  }

  async function onUpdateMyEquipment(equipmentId: number, quantity: number) {
    try {
      clearError();
      setSavingEquipment(true);

      await updateMyUserEquipment(equipmentId, { quantity });
      await loadEquipmentData();
    } catch (e: unknown) {
      showError(e);
    } finally {
      setSavingEquipment(false);
    }
  }

  async function onDeleteMyEquipment(equipmentId: number) {
    if (!confirm("Remove this equipment from your loadout?")) return;

    try {
      clearError();
      setSavingEquipment(true);

      await deleteMyUserEquipment(equipmentId);
      await loadEquipmentData();
    } catch (e: unknown) {
      showError(e);
    } finally {
      setSavingEquipment(false);
    }
  }

  async function onUploadProfileImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      clearError();
      setSuccessMsg(null);
      setUploadingImage(true);

      await uploadMyProfileImage(file);
      await loadProfileData();
      setSuccessMsg("Profile image updated.");
    } catch (e: unknown) {
      showError(e);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function onRemoveProfileImage() {
    if (!confirm("Remove your profile image?")) return;

    try {
      clearError();
      setSuccessMsg(null);
      setUploadingImage(true);

      await deleteMyProfileImage();
      await loadProfileData();
      setSuccessMsg("Profile image removed.");
    } catch (e: unknown) {
      showError(e);
    } finally {
      setUploadingImage(false);
    }
  }

  if (!authUser) {
    return (
      <div style={{ color: "#f3efe6", fontFamily: "monospace" }}>
        No user loaded.
      </div>
    );
  }

  if (loadingProfile) {
    return (
      <div>
        <ErrorBanner error={error} />

        <div style={panelStyle}>
          <h2 style={{ ...pageTitleStyleShared, marginBottom: 24 }}>
            My Profile
          </h2>

          <LoadingScreen label="Loading initial data..." />
        </div>
      </div>
    );
  }

  const roleLabel = getPrimaryRoleLabel(me?.roles ?? authUser.roles);
  const displayName = me?.userName ?? authUser.userName;
  const displayEmail = me?.email ?? authUser.email;
  const profileImageUrl = resolveUserImageUrl(me?.profileImageUrl);

  const squadSuccessRate =
    squad && squad.missionsServed > 0
      ? `${Math.round((squad.missionsWon / squad.missionsServed) * 100)}%`
      : "N/A";

  const squadVeterancy = squad ? getVeterancyLabel(squad.missionsServed) : "—";

  return (
    <div>
      <ErrorBanner error={error} />

      {successMsg && (
        <div
          style={{
            marginBottom: 12,
            color: "lightgreen",
            fontFamily: "monospace",
          }}
        >
          {successMsg}
        </div>
      )}

      <div style={panelStyle}>
        <h2 style={{ ...pageTitleStyleShared, marginBottom: 24 }}>
          My Profile
        </h2>

        <div
          style={{
            ...sectionBoxStyle,
            padding: 18,
            display: "grid",
            gap: 18,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              gap: 22,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                border: "3px solid rgba(255,255,255,0.22)",
                background: "rgba(220,220,220,0.82)",
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
                fontSize: 64,
                color: "#666",
                margin: "0 auto",
              }}
            >
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={displayName ?? "Profile"}
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

            <div style={{ display: "grid", gap: 12 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={onUploadProfileImage}
                style={{ display: "none" }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={heroTitleStyle}>{displayName}</div>
                  <div style={metaLineStyle}>Email: {displayEmail}</div>
                  <div style={metaLineStyle}>Role: {roleLabel}</div>
                  <div style={metaLineStyle}>Missions Served: {squad?.missionsServed ?? 0}</div>
                  <div style={metaLineStyle}>
                    Veterancy: {squad ? squadVeterancy : "No squad history"}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={smallActionButtonStyle}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? "Uploading..." : "Upload"}
                  </button>

                  {profileImageUrl && (
                    <button
                      type="button"
                      onClick={onRemoveProfileImage}
                      style={smallDangerButtonStyle}
                      disabled={uploadingImage}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 18,
            }}
          >
            <form
              onSubmit={onSaveProfile}
              style={{
                ...softSectionBoxStyle,
                display: "grid",
                gap: 12,
              }}
            >
              <div style={detailsTitleStyle}>Edit Profile</div>

              <input
                value={profileForm.userName}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, userName: e.target.value }))
                }
                placeholder="Username"
                style={formFieldStyle}
                disabled={savingProfile}
              />

              <input
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Email"
                type="email"
                style={formFieldStyle}
                disabled={savingProfile}
              />

              <button type="submit" style={toolbarButtonStyle} disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </form>

            <form
              onSubmit={onChangePassword}
              style={{
                ...softSectionBoxStyle,
                display: "grid",
                gap: 12,
              }}
            >
              <div style={detailsTitleStyle}>Change Password</div>

              <input
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                }
                placeholder="Current password"
                type="password"
                style={formFieldStyle}
                disabled={changingPassword}
              />

              <input
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                placeholder="New password"
                type="password"
                style={formFieldStyle}
                disabled={changingPassword}
              />

              <input
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                placeholder="Confirm new password"
                type="password"
                style={formFieldStyle}
                disabled={changingPassword}
              />

              <button type="submit" style={toolbarButtonStyle} disabled={changingPassword}>
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>

          <div
            style={{
              ...softSectionBoxStyle,
              display: "grid",
              gridTemplateColumns: "180px 1fr",
              gap: 22,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: 12,
                overflow: "hidden",
                border: "2px solid #b8945c",
                background: "rgba(255,255,255,0.06)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto",
              }}
            >
              <img
                src={getSquadTypeImage(squad?.type)}
                alt={squad?.type ?? "Squad"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={detailsLineStyle}>Squad Type: {squad?.type ?? "—"}</div>
              <div style={detailsLineStyle}>Commander: {squad?.commanderId ?? "—"}</div>
              <div style={detailsLineStyle}>Success Rate: {squad ? squadSuccessRate : "—"}</div>
              <div style={detailsLineStyle}>
                Veterancy Status: {squad ? squadVeterancy : "—"}
              </div>

              {assignedSquadId && (
                <div style={{ marginTop: 4 }}>
                  <Link
                    to="/my-squad"
                    style={{
                      color: "#efb85f",
                      textDecoration: "none",
                      fontFamily: "monospace",
                      fontWeight: 700,
                    }}
                  >
                    Open My Squad
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {assignedSquadId && (
          <>
            <div
              style={{
                ...sectionBoxStyle,
                padding: 18,
                marginBottom: 18,
              }}
            >
              <div style={sectionTitleStyle}>Available Squad Equipment</div>

              <form
                onSubmit={onAddMyEquipment}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px auto",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <select
                  value={selectedEquipmentId}
                  onChange={(e) =>
                    setSelectedEquipmentId(e.target.value ? Number(e.target.value) : "")
                  }
                  style={formFieldStyle}
                  disabled={savingEquipment}
                >
                  <option value="">— Select equipment —</option>
                  {availableEquipment.map((eq) => (
                    <option key={eq.equipmentId} value={eq.equipmentId}>
                      {eq.equipmentName} {eq.category ? `(${eq.category})` : ""} · Available:{" "}
                      {eq.quantity}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(Number(e.target.value))}
                  style={formFieldStyle}
                  disabled={savingEquipment}
                />

                <button style={toolbarButtonStyle} disabled={savingEquipment}>
                  {savingEquipment ? "Saving..." : "Add To Loadout"}
                </button>
              </form>
            </div>

            <div
              style={{
                ...sectionBoxStyle,
                padding: 18,
              }}
            >
              <div style={sectionTitleStyle}>My Equipment</div>

              {myEquipment.length === 0 ? (
                <div style={detailsLineStyle}>No equipment selected.</div>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {myEquipment.map((item) => (
                    <div
                      key={item.equipmentId}
                      style={{
                        border: "1px solid rgba(201,165,106,0.35)",
                        borderRadius: 14,
                        overflow: "hidden",
                        background: "rgba(0,0,0,0.45)",
                      }}
                    >
                      <div
                        style={{
                          minHeight: 180,
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: 18,
                          alignItems: "stretch",
                          backgroundImage: `linear-gradient(rgba(10,10,10,0.38), rgba(10,10,10,0.38)), url(${getEquipmentDisplayImage(
                            item
                          )})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div style={{ padding: 16 }}>
                          <div
                            style={{
                              maxWidth: 920,
                              border: "1px solid rgba(255,255,255,0.14)",
                              borderRadius: 12,
                              padding: 16,
                              background: "rgba(20,20,20,0.70)",
                            }}
                          >
                            <div style={detailsTitleStyle}>{item.equipmentName}</div>
                            <div style={detailsLineStyle}>Category: {item.category ?? "—"}</div>
                            <div style={detailsLineStyle}>Quantity: {item.quantity}</div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: 16,
                            flexWrap: "wrap",
                          }}
                        >
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
                            style={{ ...formFieldStyle, width: 96 }}
                            disabled={savingEquipment}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              onUpdateMyEquipment(
                                item.equipmentId,
                                editQuantities[item.equipmentId] ?? item.quantity
                              )
                            }
                            style={iconActionButtonStyle}
                            disabled={savingEquipment}
                          >
                            {savingEquipment ? "Saving..." : "Save"}
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteMyEquipment(item.equipmentId)}
                            style={iconActionButtonStyle}
                            disabled={savingEquipment}
                          >
                            {savingEquipment ? "Working..." : "Remove"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!assignedSquadId && (
          <div
            style={{
              ...emptyPanelStyle,
              borderRadius: 14,
              padding: 18,
            }}
          >
            <div style={detailsTitleStyle}>No squad assigned</div>
            <div style={detailsLineStyle}>
              You are not assigned to a squad yet, so there is no personal loadout available.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}