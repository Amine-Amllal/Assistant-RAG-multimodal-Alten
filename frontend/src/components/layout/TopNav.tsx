import { NavLink, useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Button } from "../ui/Button";
import "./TopNav.css";

export function TopNav() {
  const navigate = useNavigate();

  return (
    <header className="topnav">
      <div className="topnav__brand">
        <img className="topnav__logo" src="/alten-logo.png" alt="ALTEN" />
        <span className="topnav__title">RAG Assistant</span>
      </div>

      <nav className="topnav__links">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `topnav__link ${isActive ? "topnav__link--active" : ""}`}
        >
          Home
        </NavLink>
        <NavLink
          to="/chat"
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
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
        <SignedOut>
          <Button variant="secondary" onClick={() => navigate("/sign-in")}>
            Log in
          </Button>
          <Button variant="primary" onClick={() => navigate("/sign-up")}>
            Sign up
          </Button>
        </SignedOut>
      </div>
    </header>
  );
}
