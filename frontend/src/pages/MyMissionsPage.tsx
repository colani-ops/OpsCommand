import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import { logout } from "../api/auth";
import { Link, useNavigate } from "react-router-dom";

type Mission = {
  id: number;
  title?: string;
  name?: string;
  status?: string;
  squadId?: number | null;
  commanderId?: string | null;
};

export default function MyMissionsPage() {
  const nav = useNavigate();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<Mission[]>("/api/mission/my"); // ako ti je plural, promijeni
        setMissions(data);
      } catch (e: any) {
        setErr(e.message ?? "Failed to load missions");
      }
    })();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h2 style={{ marginRight: "auto" }}>My Missions</h2>
        <Link to="/equipment">Equipment</Link>
        <button
          onClick={() => {
            logout();
            nav("/login");
          }}
        >
          Logout
        </button>
      </div>

      {err && <div style={{ color: "crimson" }}>{err}</div>}

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
        {missions.map((m) => (
          <li key={m.id} style={{ border: "1px solid #333", borderRadius: 8, padding: 12 }}>
            <div><b>{m.title ?? m.name ?? `Mission #${m.id}`}</b></div>
            <div>Status: {m.status ?? "N/A"}</div>
            <div>SquadId: {String(m.squadId ?? "")}</div>
          </li>
        ))}
      </ul>

      {!missions.length && !err && <div>No missions yet.</div>}
    </div>
  );
}
