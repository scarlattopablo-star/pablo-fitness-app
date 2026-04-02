"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, RotateCcw, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
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
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadDeleted = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, deleted_at")
      .eq("is_admin", false)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && user) loadDeleted();
    else if (!authLoading) setLoading(false);
  }, [authLoading, user, loadDeleted]);

  const getToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
    // Fallback: try refreshing
    const { data: refreshed } = await supabase.auth.refreshSession();
    return refreshed.session?.access_token || null;
  };

  const restoreClient = async (id: string) => {
    if (!confirm("¿Restaurar este cliente? Se le devolvera el acceso a la app.")) return;
    setRestoring(id);
    setError("");

    try {
      const token = await getToken();
      if (!token) {
        setError("No hay sesion activa. Recarga la pagina.");
        setRestoring(null);
        return;
      }

      const res = await fetch("/api/admin/restore-client", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setClients((prev) => prev.filter((c) => c.id !== id));
      } else {
        const data = await res.json();
        setError(data.error || "Error al restaurar");
      }
    } catch {
      setError("Error de conexion");
    }
    setRestoring(null);
  };

  const permanentDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `¿Eliminar DEFINITIVAMENTE a ${name || "este cliente"}?\n\nSe borraran todos sus datos (planes, progreso, suscripciones, encuestas) y su cuenta. Esta accion NO se puede deshacer.`
      )
    )
      return;

    setDeleting(id);
    setError("");

    try {
      const token = await getToken();
      if (!token) {
        setError("No hay sesion activa. Recarga la pagina.");
        setDeleting(null);
        return;
      }

      const res = await fetch(`/api/admin/permanent-delete-client?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setClients((prev) => prev.filter((c) => c.id !== id));
      } else {
        const data = await res.json();
        setError(data.error || "Error al eliminar");
      }
    } catch {
      setError("Error de conexion");
    }
    setDeleting(null);
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
      <p className="text-muted mb-6">
        Clientes eliminados. Podes restaurarlos o eliminarlos definitivamente.
      </p>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl p-3 mb-4">
          {error}
        </div>
      )}

      {clients.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Trash2 className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="text-muted">La papelera esta vacia</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => {
            const isBusy = restoring === client.id || deleting === client.id;
            return (
              <div
                key={client.id}
                className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between"
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
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => restoreClient(client.id)}
                    disabled={isBusy}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {restoring === client.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    Restaurar
                  </button>
                  <button
                    onClick={() => permanentDelete(client.id, client.full_name)}
                    disabled={isBusy}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {deleting === client.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
