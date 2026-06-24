import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Button } from "../ui/Button";
import { ThemeToggler } from "../ui/ThemeToggler";
import { ExpandableTabs } from "../ui/ExpandableTabs";
import { ChatBubbleIcon, FileTextIcon, HomeIcon } from "../ui/icons";
import "./TopNav.css";

const NAV_TABS = [
  { title: "Home", icon: HomeIcon, to: "/", end: true },
  { title: "Chat", icon: ChatBubbleIcon, to: "/chat" },
  { title: "Documents", icon: FileTextIcon, to: "/documents" },
];

export function TopNav() {
  const navigate = useNavigate();

  return (
    <header className="topnav">
      <div className="topnav__brand">
        <span className="topnav__logo-wrap">
          <img className="topnav__logo topnav__logo--light" src="/alten-logo.png" alt="ALTEN" />
          <img className="topnav__logo topnav__logo--dark" src="/alten-logo-dark.png" alt="ALTEN" />
        </span>
        <span className="topnav__title">RAG Assistant</span>
      </div>

      <ExpandableTabs tabs={NAV_TABS} />

      <div className="topnav__actions">
        <ThemeToggler />
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
