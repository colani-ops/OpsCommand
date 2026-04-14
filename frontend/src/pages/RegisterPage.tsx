import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import {
  authContentStyle,
  authFieldWrapStyle,
  authFormStyle,
  authInputStyle,
  authLabelStyle,
  authMessageStyle,
  authOverlayStyle,
  authPageStyle,
  authPanelStyle,
  authPrimaryButtonStyle,
  authSecondaryButtonStyle,
  authTitleBoxStyle,
  authTitleStyle,
} from "../styles/authStyles";

const backgroundUrl = "/mainBG.png";

export default function RegisterPage() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);

    try {
      await register({
        email: email.trim(),
        userName: userName.trim(),
        password,
      });

      nav("/login");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        ...authPageStyle,
        backgroundImage: `url(${backgroundUrl})`,
      }}
    >
      <div style={authOverlayStyle} />
      <div style={authContentStyle}>
        <div style={authTitleBoxStyle}>
          <h1 style={authTitleStyle}>Command Access</h1>
        </div>

        <div style={authPanelStyle}>
          <form onSubmit={onSubmit} style={authFormStyle}>
            {err && <div style={authMessageStyle}>{err}</div>}

            <div style={authFieldWrapStyle}>
              <label htmlFor="email" style={authLabelStyle}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email.example@mail.com"
                autoComplete="email"
                style={authInputStyle}
                required
              />
            </div>

            <div style={authFieldWrapStyle}>
              <label htmlFor="username" style={authLabelStyle}>
                Username
              </label>
              <input
                id="username"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="username"
                autoComplete="username"
                style={authInputStyle}
                required
              />
            </div>

            <div style={authFieldWrapStyle}>
              <label htmlFor="password" style={authLabelStyle}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                autoComplete="new-password"
                style={authInputStyle}
                required
              />
            </div>

            <button type="submit" style={authPrimaryButtonStyle} disabled={submitting}>
              {submitting ? "Registering..." : "Register"}
            </button>

            <Link to="/login" style={{ textDecoration: "none" }}>
              <button type="button" style={authSecondaryButtonStyle}>
                Back to Login
              </button>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}