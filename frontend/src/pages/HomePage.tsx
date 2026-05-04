import { useEffect, useState } from "react";
import { getPrimaryRole, getUser } from "../api/auth";
import { getMe } from "../api/users";
import { getMySquad } from "../api/squads";
import {
  glassCardStyle,
  pageTextStyle,
  pageTitleStyle,
} from "../styles/appShellStyles";
import LoadingScreen from "../components/LoadingScreen";

export default function HomePage() {
  const user = getUser();
  const role = getPrimaryRole();

  const [squadName, setSquadName] = useState("No squad assigned");
  const [squadType, setSquadType] = useState("—");
  const [successRate, setSuccessRate] = useState("—");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);

        const me = await getMe();
        const squad = await getMySquad();

        if (!me.assignedSquadId || !squad) {
          setSquadName("No squad assigned");
          setSquadType("—");
          setSuccessRate("—");
          return;
        }

        setSquadName(squad.name);
        setSquadType(squad.type);
        setSuccessRate(
          squad.missionsServed > 0 ? `${squad.successRate}%` : "N/A",
        );
      } catch {
        setSquadName("Unavailable");
        setSquadType("—");
        setSuccessRate("—");
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "calc(100dvh - 140px)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <section
          style={{
            ...glassCardStyle,
            width: "min(600px, 92vw)",
            padding: "34px 38px",
            textAlign: "center",
          }}
        >
          <h1 style={{ ...pageTitleStyle, marginBottom: 28 }}>Home</h1>
          <LoadingScreen label="Loading command overview..." />
        </section>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "calc(100dvh - 140px)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <section
        style={{
          ...glassCardStyle,
          width: "min(600px, 92vw)",
          padding: "34px 38px",
          textAlign: "center",
        }}
      >
        <h1 style={{ ...pageTitleStyle, marginBottom: 28 }}>Home</h1>

        <div
          style={{
            ...pageTextStyle,
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          Welcome {user?.userName ? `{${user.userName}}` : "{User}"}.
        </div>

        <div
          style={{
            ...pageTextStyle,
            fontSize: 16,
            opacity: 0.92,
            marginBottom: 34,
          }}
        >
          {`{${role}}`}
        </div>

        <div
          style={{
            ...pageTextStyle,
            fontSize: 22,
            fontWeight: 800,
            marginBottom: 26,
          }}
        >
          {`{${squadName}}`}
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            justifyItems: "center",
            ...pageTextStyle,
            fontSize: 16,
          }}
        >
          <div>{`Squad type : {${squadType}}`}</div>
          <div>{`Success rate : {${successRate}}`}</div>
        </div>
      </section>
    </div>
  );
}
