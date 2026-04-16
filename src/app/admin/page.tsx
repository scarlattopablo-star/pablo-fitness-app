"use client";

import {
  Users, Eye, AlertTriangle, RefreshCw, DollarSign, TrendingUp,
  Activity, Dumbbell, MessageCircle, Flame, ChevronRight, Send,
} from "lucide-react";
import { RatLoader } from "@/components/rat-loader";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface Metrics {
  kpis: {
    totalRevenue: number;
    activeClients: number;
    paidClients: number;
    freeClients: number;
    totalRegistered: number;
    conversionRate: number;
  };
  engagement: {
    sessionsThisWeek: number;
    uniqueTrainersWeek: number;
    avgStreak: number;
    visitsToday: number;
  };
  clients: {
    active: { id: string; name: string; email: string; lastActivity: string; streak: number }[];
    inactive: { id: string; name: string; email: string; lastActivity: string | null; streak: number; daysSince: number }[];
  };
  revenueChart: { month: string; amount: number }[];
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientTab, setClientTab] = useState<"active" | "inactive">("active");
  const [nudging, setNudging] = useState(false);
  const [nudgeResult, setNudgeResult] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) loadMetrics();
    else if (!authLoading) setLoading(false);
  }, [authLoading, user]);

  const loadMetrics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setLoading(false); return; }

      const [metricsRes] = await Promise.all([
        fetch("/api/admin/metrics", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);

      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
      }

      // Pending plan approvals
      const { data: pendingPlans } = await supabase
        .from("training_plans")
        .select("user_id, profiles(id, full_name)")
        .eq("plan_approved", false);
      if (pendingPlans) {
        const pending = pendingPlans
          .filter((p: Record<string, unknown>) => p.profiles)
          .map((p: Record<string, unknown>) => ({
            id: (p.profiles as Record<string, string>).id,
            full_name: (p.profiles as Record<string, string>).full_name || "Sin nombre",
          }));
        setPendingApprovals(pending);
      }
    } catch {}
    setLoading(false);
  };

  const formatMoney = (n: number) => {
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n.toLocaleString()}`;
  };

  const monthLabel = (m: string) => {
    const [, month] = m.split("-");
    const labels: Record<string, string> = { "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr", "05": "May", "06": "Jun", "07": "Jul", "08": "Ago", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic" };
    return labels[month] || month;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RatLoader size={64} />
      </div>
    );
  }

  const k = metrics?.kpis;
  const e = metrics?.engagement;

  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Dashboard</h1>
      <p className="text-muted mb-6">Metricas en tiempo real de tu negocio</p>

      {/* Pending approvals alert */}
      {pendingApprovals.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
            <p className="font-bold text-yellow-500">
              {pendingApprovals.length} plan{pendingApprovals.length > 1 ? "es" : ""} pendiente{pendingApprovals.length > 1 ? "s" : ""} de aprobacion
            </p>
          </div>
          <div className="space-y-2">
            {pendingApprovals.map((client) => (
              <Link
                key={client.id}
                href={`/admin/clientes/${client.id}`}
                className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-yellow-500/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-yellow-500">
                      {client.full_name[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{client.full_name}</p>
                </div>
                <span className="text-xs text-yellow-500 font-medium">Revisar →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* KPIs Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard icon={DollarSign} label="Revenue Total" value={formatMoney(k?.totalRevenue || 0)} sublabel="UYU cobrado" color="text-emerald-400" />
        <KpiCard icon={Users} label="Clientes Activos" value={String(k?.activeClients || 0)} sublabel={`${k?.paidClients || 0} pagos / ${k?.freeClients || 0} gratis`} color="text-primary" />
        <KpiCard icon={Users} label="Registrados" value={String(k?.totalRegistered || 0)} sublabel="Total de cuentas" color="text-blue-400" />
        <KpiCard icon={TrendingUp} label="Conversion" value={`${k?.conversionRate || 0}%`} sublabel="Gratis → Pago" color={k?.conversionRate && k.conversionRate > 0 ? "text-emerald-400" : "text-red-400"} />
      </div>

      {/* Engagement Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={Dumbbell} label="Sesiones esta semana" value={String(e?.sessionsThisWeek || 0)} sublabel={`${e?.uniqueTrainersWeek || 0} personas entrenaron`} color="text-orange-400" />
        <KpiCard icon={Flame} label="Racha Promedio" value={`${e?.avgStreak || 0} dias`} sublabel="Streak promedio" color="text-red-400" />
        <KpiCard icon={Eye} label="Visitas Hoy" value={String(e?.visitsToday || 0)} sublabel="Landing page" color="text-purple-400" />
        <KpiCard icon={Activity} label="Engagement" value={`${k?.totalRegistered ? Math.round(((e?.uniqueTrainersWeek || 0) / k.totalRegistered) * 100) : 0}%`} sublabel="Entreno esta semana" color="text-cyan-400" />
      </div>

      {/* Revenue Chart */}
      {metrics?.revenueChart && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="font-bold mb-4">Revenue Mensual (UYU)</h2>
          {metrics.revenueChart.every(r => r.amount === 0) ? (
            <div className="text-center py-8">
              <DollarSign className="h-8 w-8 text-muted mx-auto mb-2" />
              <p className="text-muted text-sm">Aun no hay pagos registrados</p>
              <p className="text-muted text-xs mt-1">Aca vas a ver tu revenue mes a mes</p>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.revenueChart.map(r => ({ ...r, label: monthLabel(r.month) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: "#888", fontSize: 12 }} axisLine={false} />
                  <YAxis tick={{ fill: "#888", fontSize: 12 }} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    labelStyle={{ color: "#888" }}
                    formatter={(value) => [`$${Number(value).toLocaleString()} UYU`, "Revenue"]}
                  />
                  <Bar dataKey="amount" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#CDFF00" />
                      <stop offset="100%" stopColor="#88aa00" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Active / Inactive Clients */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setClientTab("active")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${clientTab === "active" ? "gradient-primary text-black" : "text-muted hover:text-white"}`}
          >
            Activos ({metrics?.clients.active.length || 0})
          </button>
          <button
            onClick={() => setClientTab("inactive")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${clientTab === "inactive" ? "bg-red-500/20 text-red-400" : "text-muted hover:text-white"}`}
          >
            Inactivos ({metrics?.clients.inactive.length || 0})
          </button>
        </div>

        {clientTab === "active" ? (
          metrics?.clients.active.length === 0 ? (
            <p className="text-muted text-sm text-center py-6">Nadie entreno esta semana</p>
          ) : (
            <div className="space-y-2">
              {metrics?.clients.active.map((c) => (
                <Link key={c.id} href={`/admin/clientes/${c.id}`} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-400">{c.name[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-[10px] text-muted">
                        Ultimo: {new Date(c.lastActivity).toLocaleDateString("es", { day: "numeric", month: "short" })}
                        {c.streak > 0 && <span className="ml-2 text-orange-400">🔥 {c.streak} dias</span>}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </Link>
              ))}
            </div>
          )
        ) : (
          metrics?.clients.inactive.length === 0 ? (
            <p className="text-muted text-sm text-center py-6">Todos estan activos, genial!</p>
          ) : (
            <div className="space-y-2">
              {metrics?.clients.inactive.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <Link href={`/admin/clientes/${c.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-red-400">{c.name[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-[10px] text-muted">
                        {c.lastActivity
                          ? `Hace ${c.daysSince} dias`
                          : "Nunca entreno"
                        }
                      </p>
                    </div>
                  </Link>
                  <Link
                    href={`/admin/chat?to=${c.id}`}
                    className="flex items-center gap-1 text-xs text-primary font-medium px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors shrink-0"
                  >
                    <Send className="h-3 w-3" /> Mensaje
                  </Link>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Nudge inactive clients */}
      <div className="glass-card rounded-2xl p-5 flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm">Notificar Inactivos</h3>
          <p className="text-xs text-muted">Manda push + chat + email a clientes que no entrenan hace 3+ dias</p>
        </div>
        <button
          disabled={nudging}
          onClick={async () => {
            if (!confirm("Enviar notificaciones a todos los clientes inactivos?")) return;
            setNudging(true);
            setNudgeResult(null);
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) { setNudging(false); return alert("No hay sesion activa"); }
              const res = await fetch("/api/admin/nudge-inactive", {
                method: "POST",
                headers: { Authorization: `Bearer ${session.access_token}` },
              });
              const data = await res.json();
              if (data.ok) {
                setNudgeResult(`Enviado! Suave: ${data.results.gentle} | Urgente: ${data.results.urgent} | Personal: ${data.results.personal} | Saltados: ${data.results.skipped} | Errores: ${data.results.errors}`);
              } else {
                setNudgeResult("Error: " + (data.error || "desconocido"));
              }
            } catch {
              setNudgeResult("Notificaciones enviadas (la respuesta tardo demasiado pero se procesaron)");
            } finally {
              setNudging(false);
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-orange-500 text-black hover:bg-orange-400 transition-colors flex-shrink-0 disabled:opacity-50"
        >
          {nudging ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {nudging ? "Enviando..." : "Notificar"}
        </button>
      </div>
      {nudgeResult && (
        <div className="glass-card rounded-2xl p-4 text-xs text-center">
          <p>{nudgeResult}</p>
          <button onClick={() => setNudgeResult(null)} className="text-primary mt-2 font-bold">Cerrar</button>
        </div>
      )}

      {/* Regenerate all plans */}
      <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">Regenerar Todos los Planes</h3>
          <p className="text-xs text-muted">Actualiza entrenamiento y nutricion de todos los clientes</p>
        </div>
        <button
          onClick={async () => {
            const typed = prompt("ATENCION: Esto sobreescribe los planes de TODOS los clientes.\n\nEscribi REGENERAR para confirmar:");
            if (typed !== "REGENERAR") { alert("Cancelado."); return; }
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return alert("No hay sesion activa");
            const res = await fetch("/api/regenerate-all-plans", {
              method: "POST",
              headers: { "Authorization": `Bearer ${session.access_token}`, "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (data.success) {
              alert(`Planes regenerados: ${data.updated} clientes actualizados${data.errors?.length ? `. Errores: ${data.errors.length}` : ""}`);
            } else {
              alert("Error: " + (data.error || "desconocido"));
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-500 transition-colors flex-shrink-0"
        >
          <RefreshCw className="h-4 w-4" /> Regenerar
        </button>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sublabel, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sublabel: string;
  color: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <Icon className={`h-5 w-5 ${color} mb-2`} />
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-bold mt-0.5">{label}</p>
      <p className="text-[10px] text-muted">{sublabel}</p>
    </div>
  );
}
