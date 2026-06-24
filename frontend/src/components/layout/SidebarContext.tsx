import { createContext, useContext } from "react";
import type { ReactNode } from "react";

const SidebarCollapsedContext = createContext(false);

export function SidebarCollapsedProvider({ value, children }: { value: boolean; children: ReactNode }) {
  return <SidebarCollapsedContext.Provider value={value}>{children}</SidebarCollapsedContext.Provider>;
}

export function useSidebarCollapsed(): boolean {
  return useContext(SidebarCollapsedContext);
}
