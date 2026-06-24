import { useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { TopNav } from "./TopNav";
import { SidebarCollapsedProvider } from "./SidebarContext";
import { ChevronLeftIcon } from "../ui/icons";
import "./AppShell.css";

interface AppShellProps {
  sidebar?: ReactNode;
  children: ReactNode;
}

const SIDEBAR_COLLAPSED_STORAGE_KEY = "app-shell-sidebar-collapsed";

export function AppShell({ sidebar, children }: AppShellProps) {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true",
  );

  function toggleSidebar() {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <div className="app-shell">
      <TopNav />
      <div className="app-shell__body">
        {sidebar && (
          <>
            <SidebarCollapsedProvider value={isSidebarCollapsed}>{sidebar}</SidebarCollapsedProvider>
            <button
              type="button"
              className={`app-shell__sidebar-toggle${isSidebarCollapsed ? " app-shell__sidebar-toggle--collapsed" : ""}`}
              onClick={toggleSidebar}
              aria-label={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
              aria-expanded={!isSidebarCollapsed}
            >
              <ChevronLeftIcon
                className={isSidebarCollapsed ? "app-shell__sidebar-toggle-icon--collapsed" : undefined}
              />
            </button>
          </>
        )}
        <main className="app-shell__content">
          <div key={location.pathname} className="app-shell__page">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
