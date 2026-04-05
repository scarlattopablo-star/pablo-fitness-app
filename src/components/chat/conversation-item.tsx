"use client";

import Link from "next/link";

interface ConversationItemProps {
  id: string;
  otherUser: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  lastMessagePreview: string | null;
  lastMessageAt: string;
  hasUnread?: boolean;
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return "ayer";
  return date.toLocaleDateString("es-UY", { day: "numeric", month: "short" });
}

export default function ConversationItem({
  id,
  otherUser,
  lastMessagePreview,
  lastMessageAt,
  hasUnread,
}: ConversationItemProps) {
  return (
    <Link
      href={`/dashboard/chat/${id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors rounded-xl"
    >
      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
        {otherUser.full_name?.charAt(0)?.toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{otherUser.full_name}</p>
        <p className="text-xs text-muted truncate mt-0.5">
          {lastMessagePreview || "Nuevo chat"}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-xs text-muted">{formatRelativeTime(lastMessageAt)}</span>
        {hasUnread && (
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
        )}
      </div>
    </Link>
  );
}
