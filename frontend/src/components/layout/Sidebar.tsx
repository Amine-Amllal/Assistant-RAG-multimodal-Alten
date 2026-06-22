import type { ReactNode } from "react";
import "./Sidebar.css";

export function Sidebar({ children }: { children: ReactNode }) {
  return <aside className="sidebar">{children}</aside>;
}
