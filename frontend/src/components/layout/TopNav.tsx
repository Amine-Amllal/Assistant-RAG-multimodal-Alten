import { NavLink } from "react-router-dom";
import "./TopNav.css";

export function TopNav() {
  return (
    <header className="topnav">
      <div className="topnav__brand">
        <span className="topnav__logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="22" height="22">
            <polygon points="4,26 16,6 28,26" fill="var(--alten-red)" />
            <polygon points="16,26 22,16 28,26" fill="var(--alten-blue)" />
          </svg>
        </span>
        <span className="topnav__title">ALTEN&nbsp;|&nbsp;RAG Assistant</span>
      </div>

      <nav className="topnav__links">
        <NavLink
          to="/"
          className={({ isActive }) => `topnav__link ${isActive ? "topnav__link--active" : ""}`}
        >
          Chat
        </NavLink>
        <NavLink
          to="/documents"
          className={({ isActive }) => `topnav__link ${isActive ? "topnav__link--active" : ""}`}
        >
          Documents
        </NavLink>
      </nav>

      <div className="topnav__actions">
        <span className="topnav__user" title="Hanane Amllal">
          HA
        </span>
      </div>
    </header>
  );
}
