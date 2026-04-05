"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

export default function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (content: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "42px";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text]);

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
    <div
      className="flex items-end gap-2 p-3 border-t border-card-border bg-card-bg"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "Chat bloqueado" : "Escribi un mensaje..."}
        disabled={disabled}
        rows={1}
        className="flex-1 bg-transparent border border-card-border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-primary transition-all disabled:opacity-50 max-h-32"
        style={{ minHeight: "42px" }}
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || disabled}
        className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 disabled:opacity-30 transition-opacity active:scale-95"
      >
        <Send className="h-4 w-4 text-black" />
      </button>
    </div>
  );
}
