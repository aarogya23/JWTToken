import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import LogoMark from "../components/LogoMark";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [oauthEnabled, setOauthEnabled] = useState(false);
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  useEffect(() => {
    api.get("/auth/oauth-enabled")
      .then((response) => setOauthEnabled(Boolean(response.data.google)))
      .catch(() => setOauthEnabled(false));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const action =
      mode === "login"
        ? login(form.email, form.password)
        : signup(form.fullName, form.email, form.password);
    const result = await action;
    if (result.success) {
      navigate("/");
      return;
    }
    setError(result.message);
  };

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <LogoMark />
        <h1>Gamified learning for bachelor students, built with academic calm.</h1>
        <p>
          Courses, test series, live sessions, and instructor communication stay in one
          real-time workspace without turning the experience childish.
        </p>
        <div className="hero-pills">
          <span>JWT auth</span>
          <span>OAuth ready</span>
          <span>WebSocket live updates</span>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-switch">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Login
          </button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
            Sign up
          </button>
        </div>

        <form onSubmit={submit}>
          {mode === "signup" && (
            <label>
              Full name
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Your name"
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="student@deltagamma.edu"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 6 characters"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="primary-button">
            {mode === "login" ? "Enter dashboard" : "Create account"}
          </button>

          {oauthEnabled ? (
            <a className="oauth-link" href="http://localhost:8081/oauth2/authorization/google">
              Continue with Google OAuth
            </a>
          ) : (
            <p className="form-error">Google OAuth is not enabled for this backend yet.</p>
          )}
        </form>

        <div className="demo-note">
          <span>Demo student</span>
          <strong>student@deltagamma.edu / student123</strong>
        </div>
      </section>
    </div>
  );
}
