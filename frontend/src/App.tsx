import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { HomeView } from "./components/home/HomeView";
import { ChatView } from "./components/chat/ChatView";
import { DocumentsView } from "./components/documents/DocumentsView";
import { DocumentDetailView } from "./components/documents/DocumentDetailView";
import { SignInPage } from "./components/auth/SignInPage";
import { SignUpPage } from "./components/auth/SignUpPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { registerTokenGetter } from "./lib/authToken";

export function App() {
  const { getToken } = useAuth();

  // Registered during render, not inside a useEffect: effects fire child-before-parent
  // within the same commit, so a child page's effect that fetches data on mount (e.g.
  // useChat's conversation list fetch) could otherwise run before this registration and
  // send an unauthenticated request — which silently leaves that list empty since the
  // fetch error there isn't surfaced. Render-phase assignment to this module-level
  // variable has no React side effects, so it's safe to do unconditionally on every render.
  registerTokenGetter(getToken);

  return (
    <Routes>
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />
      <Route path="/" element={<HomeView />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <DocumentsView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents/:id"
        element={
          <ProtectedRoute>
            <DocumentDetailView />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
