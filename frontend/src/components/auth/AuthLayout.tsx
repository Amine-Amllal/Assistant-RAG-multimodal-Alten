import type { ReactNode } from "react";
import "./AuthLayout.css";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__brand">
        <img className="auth-layout__logo" src="/alten-logo.png" alt="ALTEN" />
        <span className="auth-layout__title">RAG Assistant</span>
      </div>
      <div className="auth-layout__panel">{children}</div>
    </div>
  );
}
