"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (content: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex items-end gap-2 p-3 border-t border-card-border bg-card-bg">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "Chat bloqueado" : "Escribí un mensaje..."}
        disabled={disabled}
        rows={1}
        className="flex-1 bg-transparent border border-card-border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-primary transition-colors disabled:opacity-50 max-h-32"
        style={{ minHeight: "42px" }}
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || disabled}
        className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 disabled:opacity-30 transition-opacity"
      >
        <Send className="h-4 w-4 text-black" />
      </button>
    </div>
  );
}
