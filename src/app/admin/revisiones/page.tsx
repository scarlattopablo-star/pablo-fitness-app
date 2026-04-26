"use client";

// Nutrition v2 — F5: panel admin para aprobar/rechazar revisiones de plan
//
// Lista las plan_revisions pendientes con info del cliente + check-in que la
// origino. Pablo puede:
//   - APROBAR  → aplica el delta al survey y regenera plan
//   - RECHAZAR → marca como rechazada (no toca el plan)
//
// Una vez resuelta, queda en historial pero ya no aparece en pending.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, Loader2, AlertTriangle, MessageSquare, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

interface RevisionRow {
  id: string;
  user_id: string;
  delta: Record<string, number | string>;
  rationale: string | null;
  status: string;
  created_at: string;
  triggered_by: string;
  profiles: { id: string; full_name: string; email: string } | null;
  checkin: {
    week_number: number;
    weight: number | null;
    energy: number | null;
    hunger: number | null;
    performance: number | null;
    adherence_pct: number | null;
    notes: string | null;
    created_at: string;
  } | null;
}

function formatDelta(delta: Record<string, number | string>): string {
  const parts: string[] = [];
  if (typeof delta.calories === "number" && delta.calories !== 0) parts.push(`${delta.calories > 0 ? "+" : ""}${delta.calories} kcal`);
  if (typeof delta.protein === "number" && delta.protein !== 0)   parts.push(`${delta.protein > 0 ? "+" : ""}${delta.protein}g proteina`);
  if (typeof delta.carbs === "number" && delta.carbs !== 0)       parts.push(`${delta.carbs > 0 ? "+" : ""}${delta.carbs}g carbos`);
  if (typeof delta.fats === "number" && delta.fats !== 0)         parts.push(`${delta.fats > 0 ? "+" : ""}${delta.fats}g grasas`);
  if (typeof delta.cardio === "number" && delta.cardio !== 0)     parts.push(`${delta.cardio > 0 ? "+" : ""}${delta.cardio} sesiones cardio`);
  if (typeof delta.meal_strategy === "string")                    parts.push(`estrategia: ${delta.meal_strategy}`);
  if (parts.length === 0) return "Sin cambios concretos (solo recomendacion humana)";
  return parts.join(" · ");
}

export default function AdminRevisionesPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [revisions, setRevisions] = useState<RevisionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingOn, setActingOn] = useState<string | null>(null);

  const fetchRevisions = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sesion expirada");
      const res = await fetch("/api/admin/revisions?status=pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error cargando revisiones");
      setRevisions(data.revisions || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || !profile?.is_admin) return;
    fetchRevisions();
  }, [authLoading, user, profile]);

  const handleAction = async (revisionId: string, action: "approve" | "reject") => {
    setActingOn(revisionId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sesion expirada");
      const res = await fetch("/api/admin/revisions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ revisionId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error procesando accion");
      // Quitar la revision de la lista
      setRevisions(prev => prev.filter(r => r.id !== revisionId));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setActingOn(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile?.is_admin) {
    return <div className="p-6 text-center text-danger">Acceso restringido</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link href="/admin" className="flex items-center gap-2 text-muted hover:text-white mb-4 text-sm">
        <ArrowLeft className="h-4 w-4" /> Volver al admin
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Revisiones de Plan</h1>
          <p className="text-muted text-sm">
            Sugerencias generadas a partir de check-ins semanales. Aprobá o rechazá cada una.
          </p>
        </div>
        <button onClick={fetchRevisions} className="text-muted hover:text-primary p-2">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="glass-card border-l-4 border-danger p-4 mb-4">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {revisions.length === 0 && !error ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <Check className="h-10 w-10 text-success mx-auto mb-3" />
          <h2 className="font-bold mb-1">Todo al dia</h2>
          <p className="text-muted text-sm">No hay revisiones pendientes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {revisions.map(r => {
            const cli = r.profiles;
            const ck = r.checkin;
            return (
              <div key={r.id} className="glass-card rounded-2xl p-5">
                {/* Cliente + fecha */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold">{cli?.full_name || "Cliente"}</p>
                    <p className="text-xs text-muted">{cli?.email}</p>
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(r.created_at).toLocaleDateString("es-UY", {
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Datos del check-in */}
                {ck && (
                  <div className="bg-card-bg/50 rounded-xl p-3 mb-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div>
                      <p className="text-muted">Semana</p>
                      <p className="font-bold">{ck.week_number}</p>
                    </div>
                    {ck.weight != null && (
                      <div>
                        <p className="text-muted">Peso</p>
                        <p className="font-bold">{ck.weight} kg</p>
                      </div>
                    )}
                    {ck.energy != null && (
                      <div>
                        <p className="text-muted">Energia</p>
                        <p className="font-bold">{ck.energy}/5</p>
                      </div>
                    )}
                    {ck.hunger != null && (
                      <div>
                        <p className="text-muted">Hambre</p>
                        <p className="font-bold">{ck.hunger}/5</p>
                      </div>
                    )}
                    {ck.adherence_pct != null && (
                      <div>
                        <p className="text-muted">Adherencia</p>
                        <p className="font-bold">{ck.adherence_pct}%</p>
                      </div>
                    )}
                  </div>
                )}

                {ck?.notes && (
                  <div className="bg-primary/5 rounded-xl p-3 mb-3 flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted">{ck.notes}</p>
                  </div>
                )}

                {/* Sugerencia */}
                <div className="border-l-4 border-primary bg-primary/5 rounded-r-xl p-3 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    <p className="font-bold text-sm">Sugerencia del sistema</p>
                  </div>
                  <p className="text-sm font-mono mb-2">{formatDelta(r.delta)}</p>
                  {r.rationale && <p className="text-xs text-muted">{r.rationale}</p>}
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(r.id, "approve")}
                    disabled={actingOn === r.id}
                    className="flex-1 gradient-primary text-black font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actingOn === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Aprobar y aplicar
                  </button>
                  <button
                    onClick={() => handleAction(r.id, "reject")}
                    disabled={actingOn === r.id}
                    className="flex-1 bg-card-bg border border-card-border text-muted font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:border-danger hover:text-danger transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Rechazar
                  </button>
                  <Link
                    href={`/admin/clientes/${r.user_id}`}
                    className="px-4 py-2.5 bg-card-bg border border-card-border rounded-xl text-sm hover:border-primary transition-colors"
                  >
                    Ver cliente
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
