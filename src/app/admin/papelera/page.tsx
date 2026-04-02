"use client";

import { useState, useEffect } from "react";
import { Trash2, RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface DeletedClient {
  id: string;
  full_name: string;
  email: string;
  deleted_at: string;
}

export default function PapeleraPage() {
  const { user, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<DeletedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) loadDeleted();
  }, [authLoading, user]);

  const loadDeleted = async () => {
    setLoading(true);
    const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/clients?deleted=true`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const json = await res.json();
    setClients(json.clients || []);
    setLoading(false);
  };

  const restoreClient = async (id: string) => {
    if (!confirm("¿Restaurar este cliente?")) return;
    setRestoring(id);
    const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
    if (!session) return;

    const res = await fetch("/api/admin/restore-client", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setClients((prev) => prev.filter((c) => c.id !== id));
    }
    setRestoring(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Trash2 className="h-6 w-6 text-muted" />
        <h1 className="text-2xl font-black">Papelera</h1>
      </div>
      <p className="text-muted mb-6">Clientes eliminados. Podés restaurarlos en cualquier momento.</p>

      {clients.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Trash2 className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="text-muted">La papelera está vacía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <div
              key={client.id}
              className="glass-card rounded-2xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-bold">{client.full_name || "Sin nombre"}</p>
                <p className="text-sm text-muted">{client.email}</p>
                <p className="text-xs text-muted mt-1">
                  Eliminado el{" "}
                  {new Date(client.deleted_at).toLocaleDateString("es", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => restoreClient(client.id)}
                disabled={restoring === client.id}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {restoring === client.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Restaurar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
