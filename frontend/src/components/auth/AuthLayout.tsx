import type { ReactNode } from "react";
import "./AuthLayout.css";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__brand">
        <span className="auth-layout__logo-wrap">
          <img className="auth-layout__logo auth-layout__logo--light" src="/alten-logo.png" alt="ALTEN" />
          <img className="auth-layout__logo auth-layout__logo--dark" src="/alten-logo-dark.png" alt="ALTEN" />
        </span>
        <span className="auth-layout__title">RAG Assistant</span>
      </div>
      <div className="auth-layout__panel">{children}</div>
    </div>
  );
}
