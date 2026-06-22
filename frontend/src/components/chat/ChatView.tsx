import { AppShell } from "../layout/AppShell";
import { Sidebar } from "../layout/Sidebar";
import { ChatSidebar } from "./ChatSidebar";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { useChat } from "../../hooks/useChat";
import "./ChatView.css";

export function ChatView() {
  const { messages, isAnswering, ask, clear } = useChat();

  return (
    <AppShell
      sidebar={
        <Sidebar>
          <ChatSidebar onNewChat={clear} onSuggestionClick={ask} />
        </Sidebar>
      }
    >
      <div className="chat-view">
        <MessageList messages={messages} />
        <ChatInput onSend={ask} disabled={isAnswering} />
      </div>
    </AppShell>
  );
}
