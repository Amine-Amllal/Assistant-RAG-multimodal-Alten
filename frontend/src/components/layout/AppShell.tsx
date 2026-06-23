import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { TopNav } from "./TopNav";
import "./AppShell.css";

interface AppShellProps {
  sidebar?: ReactNode;
  children: ReactNode;
}

export function AppShell({ sidebar, children }: AppShellProps) {
  const location = useLocation();

  return (
    <div className="app-shell">
      <TopNav />
      <div className="app-shell__body">
        {sidebar}
        <main className="app-shell__content">
          <div key={location.pathname} className="app-shell__page">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
