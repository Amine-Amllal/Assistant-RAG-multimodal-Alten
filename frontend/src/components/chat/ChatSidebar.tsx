import { useSidebarCollapsed } from "../layout/SidebarContext";
import { Button } from "../ui/Button";
import { PlusIcon } from "../ui/icons";
import "./ChatSidebar.css";

const SUGGESTED_QUESTIONS = [
  "Summarize the safety procedures in the hydraulic press manual",
  "What figure shows the transformer architecture?",
  "List the maintenance intervals for the robot arm",
];

interface ChatSidebarProps {
  onNewChat: () => void;
  onSuggestionClick: (text: string) => void;
}

export function ChatSidebar({ onNewChat, onSuggestionClick }: ChatSidebarProps) {
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
        <span className="chat-sidebar__heading">Suggested questions</span>
        <ul className="chat-sidebar__suggestions">
          {SUGGESTED_QUESTIONS.map((question) => (
            <li key={question}>
              <button
                type="button"
                className="chat-sidebar__suggestion"
                onClick={() => onSuggestionClick(question)}
              >
                {question}
              </button>
            </li>
          ))}
        </ul>
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
