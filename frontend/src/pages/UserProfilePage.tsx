import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { hasRole } from "../api/auth";
import { getSquad, type SquadDto } from "../api/squads";
import {
  getUserProfile,
  resolveUserImageUrl,
  type UserProfileDto,
} from "../api/users";
import ErrorBanner from "../components/ErrorBanner";
import LoadingScreen from "../components/LoadingScreen";
import {
  detailsLineStyle,
  detailsTitleStyle,
  emptyPanelStyle,
  heroTitleStyle,
  metaLineStyle,
  panelStyle,
  pageTitleStyleShared,
  softSectionBoxStyle,
} from "../styles/uiStyles";

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

function renderSummaryValue(items?: string[]) {
  return items && items.length > 0 ? items.join(", ") : "—";
}

export default function UserProfilePage() {
  const { id } = useParams();
  const canAccess = hasRole("Member", "Commander", "Admin", "SuperAdmin");

  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [squad, setSquad] = useState<SquadDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setUser(null);
      setSquad(null);
      setErr("User not found.");
      setLoading(false);
      return;
    }

    setErr(null);
    setLoading(true);

    try {
      const userData = await getUserProfile(id);
      setUser(userData);

      const squadId = userData.assignedSquadId ?? null;

      if (squadId) {
        const squadData = await getSquad(squadId);
        setSquad(squadData);
      } else {
        setSquad(null);
      }
    } catch (e: unknown) {
      setUser(null);
      setSquad(null);
      setErr(e instanceof Error ? e.message : "Failed to load user profile.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  const squadSuccessRate =
    squad && squad.missionsServed > 0
      ? `${Math.round((squad.missionsWon / squad.missionsServed) * 100)}%`
      : "N/A";

  const squadVeterancy = squad ? getVeterancyLabel(squad.missionsServed) : "—";
  const profileImageUrl = resolveUserImageUrl(user?.profileImageUrl);

  return (
    <div>
      <ErrorBanner error={err} />

      <div style={panelStyle}>
        <h2 style={{ ...pageTitleStyleShared, marginBottom: 24 }}>
          User Profile
        </h2>

        {loading && <LoadingScreen label="Loading Initiate..." />}

        {!loading && !err && !user && (
          <div style={emptyPanelStyle}>
            <div style={detailsTitleStyle}>User not found</div>
            <div style={detailsLineStyle}>
              The requested user profile could not be loaded.
            </div>
          </div>
        )}

        {!loading && !err && user && (
          <div style={profileShellStyle}>
            <div style={profileHeaderStyle}>
              <div style={profileImageFrameStyle}>
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={user.userName ?? user.email}
                    style={imageCoverStyle}
                  />
                ) : (
                  "◉"
                )}
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div style={heroTitleStyle}>{user.userName ?? user.email}</div>
                <div style={metaLineStyle}>Email: {user.email}</div>
                <div style={metaLineStyle}>Role: {user.primaryRole ?? "—"}</div>
                <div style={metaLineStyle}>
                  Missions Served: {squad?.missionsServed ?? 0}
                </div>
                <div style={metaLineStyle}>
                  Veterancy: {squad ? squadVeterancy : "No squad history"}
                </div>
                <div style={metaLineStyle}>
                  Status: {user.isActive ? "Active" : "Disabled"}
                </div>
              </div>
            </div>

            {user.assignedSquadId ? (
              <div style={profileDetailsGridStyle}>
                <div style={squadCardStyle}>
                  <div style={squadImageFrameStyle}>
                    <img
                      src={getSquadTypeImage(squad?.type)}
                      alt={squad?.type ?? "Squad"}
                      style={imageCoverStyle}
                    />
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={detailsTitleStyle}>
                      {squad?.name ?? "Unknown squad"}
                    </div>

                    <div style={detailsLineStyle}>
                      Squad Type: {squad?.type ?? "—"}
                    </div>
                    <div style={detailsLineStyle}>
                      Commander: {squad?.commanderId ?? "—"}
                    </div>
                    <div style={detailsLineStyle}>
                      Success Rate: {squad ? squadSuccessRate : "—"}
                    </div>
                    <div style={detailsLineStyle}>
                      Veterancy Status: {squad ? squadVeterancy : "—"}
                    </div>

                    <div style={{ marginTop: 4 }}>
                      <Link
                        to={`/squads/${user.assignedSquadId}`}
                        style={profileLinkStyle}
                      >
                        Open Squad
                      </Link>
                    </div>
                  </div>
                </div>

                <div style={equipmentSummaryCardStyle}>
                  <div style={detailsTitleStyle}>Equipped Summary</div>

                  <div style={summaryGridStyle}>
                    <div style={summaryLabelStyle}>Primary:</div>
                    <div style={detailsLineStyle}>
                      {renderSummaryValue(user.equipmentSummary?.primary)}
                    </div>

                    <div style={summaryLabelStyle}>Secondary:</div>
                    <div style={detailsLineStyle}>
                      {renderSummaryValue(user.equipmentSummary?.secondary)}
                    </div>

                    <div style={summaryLabelStyle}>Melee:</div>
                    <div style={detailsLineStyle}>
                      {renderSummaryValue(user.equipmentSummary?.melee)}
                    </div>

                    <div style={summaryLabelStyle}>Utility:</div>
                    <div style={detailsLineStyle}>
                      {renderSummaryValue(user.equipmentSummary?.utility)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={emptyPanelStyle}>
                <div style={detailsTitleStyle}>No squad assigned</div>
                <div style={detailsLineStyle}>
                  This user is not currently assigned to a squad, so there is no
                  squad-based equipment loadout available.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const profileShellStyle: React.CSSProperties = {
  border: "1px solid #9d8560",
  borderRadius: 14,
  background: "rgba(0,0,0,0.55)",
  padding: 18,
  display: "grid",
  gap: 18,
  marginBottom: 18,
};

const profileHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "140px 1fr",
  gap: 22,
  alignItems: "center",
};

const profileImageFrameStyle: React.CSSProperties = {
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
};

const profileDetailsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(520px, 2fr) minmax(320px, 1fr)",
  gap: 18,
  alignItems: "stretch",
};

const squadCardStyle: React.CSSProperties = {
  ...softSectionBoxStyle,
  display: "grid",
  gridTemplateColumns: "180px 1fr",
  gap: 22,
  alignItems: "center",
};

const squadImageFrameStyle: React.CSSProperties = {
  width: 180,
  height: 180,
  borderRadius: 12,
  overflow: "hidden",
  border: "2px solid #b8945c",
  background: "rgba(255,255,255,0.06)",
  display: "grid",
  placeItems: "center",
  margin: "0 auto",
};

const equipmentSummaryCardStyle: React.CSSProperties = {
  ...softSectionBoxStyle,
  minHeight: "100%",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "110px 1fr",
  columnGap: 10,
  rowGap: 8,
  alignItems: "start",
};

const summaryLabelStyle: React.CSSProperties = {
  color: "#d7b176",
  fontFamily: "monospace",
  fontSize: 14,
  fontWeight: 800,
  marginBottom: 6,
};

const imageCoverStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const profileLinkStyle: React.CSSProperties = {
  color: "#efb85f",
  textDecoration: "none",
  fontFamily: "monospace",
  fontWeight: 700,
};