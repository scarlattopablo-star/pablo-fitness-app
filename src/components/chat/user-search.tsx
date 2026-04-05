"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MessageCircle } from "lucide-react";
import { searchUsers } from "@/lib/chat-helpers";

interface UserResult {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

export default function UserSearch({
  currentUserId,
  onStartChat,
}: {
  currentUserId: string;
  onStartChat: (userId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const users = await searchUsers(query, currentUserId);
        setResults(users);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentUserId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          placeholder="Buscar compañero de gym..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="w-full pl-10 pr-4 py-3 bg-card-bg border border-card-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl border border-card-border overflow-hidden z-50">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onStartChat(user.id);
                setQuery("");
                setResults([]);
                setShowResults(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {user.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.full_name}</p>
              </div>
              <MessageCircle className="h-4 w-4 text-primary shrink-0" />
            </button>
          ))}
        </div>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl border border-card-border p-4 z-50">
          <p className="text-sm text-muted text-center">No se encontraron usuarios</p>
        </div>
      )}
    </div>
  );
}
