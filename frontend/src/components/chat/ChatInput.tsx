import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "../ui/Button";
import { DocumentScopePicker } from "./DocumentScopePicker";
import "./ChatInput.css";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  selectedDocumentIds: string[];
  onChangeSelectedDocumentIds: (ids: string[]) => void;
  scopeMode: "auto" | "manual";
  onChangeScopeMode: (mode: "auto" | "manual") => void;
}

export function ChatInput({
  onSend,
  disabled,
  selectedDocumentIds,
  onChangeSelectedDocumentIds,
  scopeMode,
  onChangeScopeMode,
}: ChatInputProps) {
  const [value, setValue] = useState("");

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <div className="chat-input__toolbar">
        <DocumentScopePicker
          selectedDocumentIds={selectedDocumentIds}
          onChange={onChangeSelectedDocumentIds}
          scopeMode={scopeMode}
          onChangeScopeMode={onChangeScopeMode}
        />
      </div>
      <div className="chat-input__row">
        <textarea
          className="chat-input__textarea"
          placeholder="Ask about a manual, spec, or research paper…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
        />
        <Button type="submit" disabled={disabled || !value.trim()}>
          Send
        </Button>
      </div>
    </form>
  );
}
