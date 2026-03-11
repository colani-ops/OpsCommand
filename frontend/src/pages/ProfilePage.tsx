import { getUser } from "../api/auth";
import { useEffect, useState } from "react";
import { getMe } from "../api/users";
import { getSquad } from "../api/squads";

export default function ProfilePage() {
  const user = getUser();

  const [assignedSquadId, setAssignedSquadId] = useState<number | null>(null);
  const [squadName, setSquadName] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileData() {
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);

      try {
        const me = await getMe();
        if (cancelled) return;

        const squadId = me.assignedSquadId ?? null;
        setAssignedSquadId(squadId);

        if (!squadId) {
          setSquadName(null);
          return;
        }

        const squad = await getSquad(squadId);
        if (cancelled) return;

        setSquadName(squad.name);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed loading profile data", err);
          setAssignedSquadId(null);
          setSquadName(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    }

    loadProfileData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div>
      <h2>Profile</h2>

      {!user ? (
        <p>No user loaded.</p>
      ) : (
        <div style={{ border: "1px solid #333", borderRadius: 10, padding: 12 }}>
          <div><b>Username:</b> {user.userName}</div>
          <div><b>Email:</b> {user.email}</div>
          <div><b>Roles:</b> {user.roles.join(", ")}</div>

          <div>
            <b>Squad:</b>{" "}
            {loadingProfile
              ? "Checking squad..."
              : assignedSquadId
                ? `${squadName ?? "Unknown"} (ID: ${assignedSquadId})`
                : "None"}
          </div>
        </div>
      )}
    </div>
  );
}