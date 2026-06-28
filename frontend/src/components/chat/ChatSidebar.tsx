import { useSidebarCollapsed } from "../layout/SidebarContext";
import { Button } from "../ui/Button";
import { PlusIcon } from "../ui/icons";
import type { ConversationSummary } from "../../types";
import "./ChatSidebar.css";

interface ChatSidebarProps {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
}: ChatSidebarProps) {
  const isCollapsed = useSidebarCollapsed();

  if (isCollapsed) {
    return (
      <div className="chat-sidebar chat-sidebar--collapsed">
        <button type="button" className="chat-sidebar__new-collapsed" onClick={onNewChat} title="New conversation">
          <PlusIcon />
        </button>
      </div>
    );
  }

  return (
    <div className="chat-sidebar">
      <Button variant="primary" onClick={onNewChat}>
        + New conversation
      </Button>

      <div className="chat-sidebar__section">
        <span className="chat-sidebar__heading">Conversations</span>
        {conversations.length === 0 ? (
          <p className="chat-sidebar__hint">Your past conversations will show up here.</p>
        ) : (
          <ul className="chat-sidebar__conversations">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  className={
                    conversation.id === activeConversationId
                      ? "chat-sidebar__conversation chat-sidebar__conversation--active"
                      : "chat-sidebar__conversation"
                  }
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  {conversation.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="chat-sidebar__section chat-sidebar__section--bottom">
        <span className="chat-sidebar__heading">Scope</span>
        <p className="chat-sidebar__hint">
          Answers are grounded in the indexed corpus only. Manage documents from the{" "}
          <strong>Documents</strong> tab.
        </p>
      </div>
    </div>
  );
}
