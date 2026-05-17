"use client";

import { useRef, useState } from "react";
import { Send, Paperclip, X, FileText, Loader2 } from "lucide-react";
import type { FileAttachment } from "@/lib/chat-helpers";

export default function MessageInput({
  onSend,
  onUploadFile,
  disabled,
}: {
  onSend: (content: string, file?: FileAttachment) => void;
  onUploadFile?: (file: File) => Promise<FileAttachment>;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState<FileAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onUploadFile) return;
    setUploading(true);
    try {
      const attachment = await onUploadFile(file);
      setPendingFile(attachment);
    } catch {
      // Ignore upload errors silently
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSubmit() {
    const trimmed = text.trim();
    if ((!trimmed && !pendingFile) || disabled) return;
    onSend(trimmed, pendingFile ?? undefined);
    setText("");
    setPendingFile(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t border-card-border bg-card-bg">
      {/* File preview */}
      {pendingFile && (
        <div className="flex items-center gap-2 px-3 pt-2.5">
          {pendingFile.type === "image" ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingFile.url}
                alt={pendingFile.name}
                className="h-16 w-16 object-cover rounded-lg border border-card-border"
              />
              <button
                onClick={() => setPendingFile(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-background border border-card-border flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-card-bg border border-card-border rounded-lg px-3 py-2">
              <FileText className="h-4 w-4 text-accent shrink-0" />
              <span className="text-xs truncate max-w-[160px]">{pendingFile.name}</span>
              <button onClick={() => setPendingFile(null)} className="ml-1">
                <X className="h-3 w-3 text-muted" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        {/* Attach button */}
        {onUploadFile && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx,video/mp4"
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled || uploading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="w-10 h-10 rounded-xl bg-card-bg border border-card-border flex items-center justify-center shrink-0 hover:border-primary transition-colors disabled:opacity-30"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted" />
              ) : (
                <Paperclip className="h-4 w-4 text-muted" />
              )}
            </button>
          </>
        )}

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
          disabled={(!text.trim() && !pendingFile) || disabled}
          className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 disabled:opacity-30 transition-opacity"
        >
          <Send className="h-4 w-4 text-black" />
        </button>
      </div>
    </div>
  );
}
