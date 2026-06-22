import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import "./AppShell.css";

interface AppShellProps {
  sidebar?: ReactNode;
  children: ReactNode;
}

export function AppShell({ sidebar, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <TopNav />
      <div className="app-shell__body">
        {sidebar}
        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  );
}
