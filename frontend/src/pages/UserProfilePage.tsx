import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { hasRole } from "../api/auth";
import { getUserProfile, type UserProfileDto } from "../api/users";
import ErrorBanner from "../components/ErrorBanner";

export default function UserProfilePage() {
  const { id } = useParams();
  const canAccess = hasRole("Member", "Commander", "Admin", "SuperAdmin");

  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) {
        setUser(null);
        setErr("User not found.");
        setLoading(false);
        return;
      }

      setErr(null);
      setLoading(true);

      try {
        const data = await getUserProfile(id);
        setUser(data);
      } catch (e: unknown) {
        setUser(null);
        setErr(e instanceof Error ? e.message : "Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

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

        {loading && (
          <div style={infoTextStyle}>
            Loading...
          </div>
        )}

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
                  display: "grid",
                  placeItems: "center",
                  fontSize: 64,
                  color: "#666",
                  margin: "0 auto",
                }}
              >
                ◉
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div style={heroTitleStyle}>{user.userName ?? user.email}</div>
                <div style={metaLineStyle}>Email: {user.email}</div>
                <div style={metaLineStyle}>Primary Role: {user.primaryRole ?? "—"}</div>
                <div style={metaLineStyle}>
                  Assigned Squad ID: {user.assignedSquadId ?? "None"}
                </div>
                <div style={metaLineStyle}>
                  Status: {user.isActive ? "Active" : "Disabled"}
                </div>
              </div>
            </div>

            {user.assignedSquadId && (
              <div
                style={{
                  border: "1px solid rgba(201,165,106,0.35)",
                  borderRadius: 12,
                  padding: 16,
                  background: "rgba(20,20,20,0.52)",
                }}
              >
                <div style={detailsTitleStyle}>Squad Link</div>
                <Link
                  to={`/squads/${user.assignedSquadId}`}
                  style={{
                    color: "#efb85f",
                    textDecoration: "none",
                    fontFamily: "monospace",
                    fontWeight: 700,
                  }}
                >
                  Open Squad #{user.assignedSquadId}
                </Link>
              </div>
            )}
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

const infoTextStyle: React.CSSProperties = {
  color: "#f3efe6",
  fontFamily: "monospace",
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