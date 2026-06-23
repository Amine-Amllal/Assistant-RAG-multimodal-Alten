import { Routes, Route, Navigate } from "react-router-dom";
import { HomeView } from "./components/home/HomeView";
import { ChatView } from "./components/chat/ChatView";
import { DocumentsView } from "./components/documents/DocumentsView";
import { SignInPage } from "./components/auth/SignInPage";
import { SignUpPage } from "./components/auth/SignUpPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

export function App() {
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
