import { AppShell } from "../layout/AppShell";
import { Sidebar } from "../layout/Sidebar";
import { ChatSidebar } from "./ChatSidebar";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { useChat } from "../../hooks/useChat";
import "./ChatView.css";

export function ChatView() {
  const {
    messages,
    isAnswering,
    ask,
    clear,
    selectedDocumentIds,
    setSelectedDocumentIds,
    scopeMode,
    setScopeMode,
    conversations,
    conversationId,
    selectConversation,
  } = useChat();

  return (
    <AppShell
      sidebar={
        <Sidebar>
          <ChatSidebar
            conversations={conversations}
            activeConversationId={conversationId}
            onNewChat={clear}
            onSelectConversation={selectConversation}
          />
        </Sidebar>
      }
    >
      <div className="chat-view">
        <MessageList messages={messages} />
        <ChatInput
          onSend={ask}
          disabled={isAnswering}
          selectedDocumentIds={selectedDocumentIds}
          onChangeSelectedDocumentIds={setSelectedDocumentIds}
          scopeMode={scopeMode}
          onChangeScopeMode={setScopeMode}
        />
      </div>
    </AppShell>
  );
}
