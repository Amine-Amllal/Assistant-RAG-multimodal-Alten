import { Routes, Route, Navigate } from "react-router-dom";
import { ChatView } from "./components/chat/ChatView";
import { DocumentsView } from "./components/documents/DocumentsView";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatView />} />
      <Route path="/documents" element={<DocumentsView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
