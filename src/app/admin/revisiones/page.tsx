"use client";

// Nutrition v2 — F5: HISTORIAL de ajustes automaticos
//
// Pablo decidio no requerir aprobacion manual: los ajustes de check-in se
// aplican automaticamente al survey + regeneran el plan. Esta pagina muestra
// el historial de ajustes aplicados (status='applied') para auditoria.
//
// Si en el futuro Pablo quiere revertir un ajuste, puede editar manualmente
// el plan/survey desde /admin/clientes/[id].

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, AlertTriangle, MessageSquare, RefreshCw, History } from "lucide-react";
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

  const fetchRevisions = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sesion expirada");
      // Mostrar todas las revisiones (applied + rejected) ordenadas por fecha
      const res = await fetch("/api/admin/revisions?status=all", {
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

  // (Auto-aprobacion activa: ya no hay accion manual de aprobar/rechazar.
  //  Si Pablo necesita revertir un ajuste, edita el plan/survey en /admin/clientes/[id].)

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
          <h1 className="text-2xl font-black flex items-center gap-2">
            <History className="h-6 w-6 text-primary" /> Historial de ajustes
          </h1>
          <p className="text-muted text-sm">
            Ajustes aplicados automaticamente a partir de check-ins semanales.
            Si necesitas revertir alguno, edita el plan del cliente directamente.
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
          <History className="h-10 w-10 text-muted mx-auto mb-3" />
          <h2 className="font-bold mb-1">Sin ajustes todavia</h2>
          <p className="text-muted text-sm">Cuando un cliente haga check-in, aca vas a ver el ajuste aplicado automaticamente.</p>
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

                {/* Estado + acceso al cliente (auto-aplicado, sin acciones manuales) */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                    r.status === "applied"  ? "bg-success/10 text-success" :
                    r.status === "rejected" ? "bg-muted/10 text-muted" :
                    "bg-warning/10 text-warning"
                  }`}>
                    {r.status === "applied"  ? "Aplicado automaticamente" :
                     r.status === "rejected" ? "Sin cambios (registrado)" :
                     r.status}
                  </span>
                  <Link
                    href={`/admin/clientes/${r.user_id}`}
                    className="px-4 py-2 bg-card-bg border border-card-border rounded-xl text-sm hover:border-primary transition-colors"
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
