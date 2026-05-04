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
          User Profile
        </h2>

        {loading && <LoadingScreen label="Loading Initiate..." />}

        {!loading && !err && !user && (
          <div
            style={{
              border: "1px solid #9d8560",
              borderRadius: 14,
              background: "rgba(0,0,0,0.55)",
              padding: 18,
            }}
          >
            <div style={detailsTitleStyle}>User not found</div>
            <div style={detailsLineStyle}>
              The requested user profile could not be loaded.
            </div>
          </div>
        )}

        {!loading && !err && user && (
          <div
            style={{
              border: "1px solid #9d8560",
              borderRadius: 14,
              background: "rgba(0,0,0,0.55)",
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
                    alt={user.userName ?? user.email}
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

            <div
              style={{
                border: "1px solid rgba(201,165,106,0.35)",
                borderRadius: 12,
                padding: 16,
                background: "rgba(20,20,20,0.52)",
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
                <div style={detailsTitleStyle}>
                  {user.assignedSquadId ? squad?.name ?? "Unknown squad" : "No squad assigned"}
                </div>

                <div style={detailsLineStyle}>Squad Type: {squad?.type ?? "—"}</div>
                <div style={detailsLineStyle}>
                  Commander: {squad?.commanderId ?? "—"}
                </div>
                <div style={detailsLineStyle}>
                  Success Rate: {squad ? squadSuccessRate : "—"}
                </div>
                <div style={detailsLineStyle}>
                  Veterancy Status: {squad ? squadVeterancy : "—"}
                </div>

                {user.assignedSquadId && (
                  <div style={{ marginTop: 4 }}>
                    <Link
                      to={`/squads/${user.assignedSquadId}`}
                      style={{
                        color: "#efb85f",
                        textDecoration: "none",
                        fontFamily: "monospace",
                        fontWeight: 700,
                      }}
                    >
                      Open Squad
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && !err && user && !user.assignedSquadId && (
          <div
            style={{
              border: "1px solid #9d8560",
              borderRadius: 14,
              background: "rgba(0,0,0,0.55)",
              padding: 18,
            }}
          >
            <div style={detailsTitleStyle}>No squad assigned</div>
            <div style={detailsLineStyle}>
              This user is not currently assigned to a squad.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const heroTitleStyle: React.CSSProperties = {
  color: "#efb85f",
  fontFamily: "monospace",
  fontWeight: 800,
  fontSize: 24,
};


const metaLineStyle: React.CSSProperties = {
  color: "#d7b176",
  fontFamily: "monospace",
  fontSize: 16,
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