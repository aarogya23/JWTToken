import { NavLink } from "react-router-dom";
import LogoMark from "./LogoMark";

const navItems = [
  { to: "/", label: "Dashboard", glyph: "◉" },
  { to: "/courses", label: "Courses", glyph: "▣" },
  { to: "/tests", label: "Tests", glyph: "✦" },
  { to: "/messages", label: "Messages", glyph: "✉" },
  { to: "/live", label: "Live", glyph: "▶" },
  { to: "/profile", label: "Profile", glyph: "☺" },
];

export default function AppShell({ title, subtitle, actions, rightPanel, children }) {
  return (
    <div className="skill-layout">
      <aside className="skill-sidebar">
        <div className="skill-sidebar-brand">
          <LogoMark />
        </div>
        <nav className="skill-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `skill-nav-item ${isActive ? "active" : ""}`}
              title={item.label}
            >
              <span className="skill-nav-glyph">{item.glyph}</span>
              <span className="skill-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <NavLink to="/logout" className="skill-profile-trigger" title="Logout">
          <span className="skill-nav-glyph">⎋</span>
          <span className="skill-nav-label">Logout</span>
        </NavLink>
      </aside>

      <main className="skill-main">
        <header className="skill-topbar">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="skill-topbar-actions">{actions}</div>
        </header>
        {children}
      </main>

      <aside className="skill-right-panel">{rightPanel}</aside>
    </div>
  );
}
