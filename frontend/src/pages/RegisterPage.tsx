import { useState } from "react";
import { Link } from "react-router-dom";
import { register } from "../api/auth";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      const response = await register({
        email,
        password,
        userName: userName.trim() || undefined,
      });

      setMsg(typeof response === "string" ? response : "Registration submitted.");
      setEmail("");
      setUserName("");
      setPassword("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>Register</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          style={{ padding: 10 }}
        />

        <input
          placeholder="username (optional)"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          style={{ padding: 10 }}
        />

        <input
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          style={{ padding: 10 }}
        />

        <button disabled={loading} style={{ padding: 10 }}>
          {loading ? "Submitting..." : "Register"}
        </button>

        {msg && <div style={{ color: "lightgreen" }}>{msg}</div>}
        {err && <div style={{ color: "crimson" }}>{err}</div>}
      </form>

      <div style={{ marginTop: 16 }}>
        <Link to="/login">Back to login</Link>
      </div>
    </div>
  );
}