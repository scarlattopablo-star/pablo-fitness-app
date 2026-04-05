"use client";

import type { PresenceUser } from "@/hooks/use-presence";
import Link from "next/link";

interface OnlineUsersPanelProps {
  users: PresenceUser[];
  currentUserId: string;
  isAdmin?: boolean;
}

export default function OnlineUsersPanel({ users, currentUserId, isAdmin }: OnlineUsersPanelProps) {
  const sorted = [...users].sort((a, b) => {
    if (a.user_id === currentUserId) return -1;
    if (b.user_id === currentUserId) return 1;
    return a.full_name.localeCompare(b.full_name);
  });

  return (
    <div className="space-y-1">
      {sorted.length === 0 && (
        <p className="text-xs text-muted text-center py-4">Nadie conectado</p>
      )}
      {sorted.map((u) => {
        const isMe = u.user_id === currentUserId;
        const row = (
          <div
            key={u.user_id}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
              <span className="online-dot absolute -bottom-0.5 -right-0.5 border-2 border-background" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {u.full_name || "Usuario"}{isMe ? " (Yo)" : ""}
              </p>
              <p className="text-[10px] text-muted">En linea</p>
            </div>
          </div>
        );

        if (isAdmin && !isMe) {
          return (
            <Link key={u.user_id} href={`/admin/clientes/${u.user_id}`}>
              {row}
            </Link>
          );
        }

        return row;
      })}
    </div>
  );
}
