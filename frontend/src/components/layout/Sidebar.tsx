import type { ReactNode } from "react";
import { useSidebarCollapsed } from "./SidebarContext";
import "./Sidebar.css";

export function Sidebar({ children }: { children: ReactNode }) {
  const isCollapsed = useSidebarCollapsed();
  return <aside className={`sidebar${isCollapsed ? " sidebar--collapsed" : ""}`}>{children}</aside>;
}
