"use client";

// Nutrition v2 — F7: dashboard de metricas de nutricion para Pablo
//
// Vista panoramica de la salud de F3+F4+F5: revisiones pendientes,
// adherencia, suplementos top, distribucion por objetivo/pais, clientes en
// riesgo. Es una herramienta de operacion diaria — refrescar al inicio del dia.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, RefreshCw, AlertTriangle, ClipboardCheck, Pill, Wallet,
  Users, TrendingUp, Globe, Loader2, Target,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

interface Metrics {
  generatedAt: string;
  operation: {
    revisionsPending: number;
    revisionsApproved: number;
    revisionsRejected: number;
    checkinsLast7d: number;
    clientsAtRisk: number;
  };
  product: {
    activeClients: number;
    avgAdherence30d: number | null;
    avgEnergy: number | null;
    avgHunger: number | null;
    checkinResponseRate: number;
    plansWithSupplements: number;
    plansWithBudget: number;
    plansWithWeekMenu: number;
    plansBudgetOver: number;
    plansBudgetTight: number;
    avgMonthlyCost: number | null;
    monthlyCostCurrency: string;
  };
  distributions: {
    byObjective: Record<string, number>;
    byCountry: Record<string, number>;
    topSupplements: Array<{ id: string; name: string; count: number; essentialCount: number }>;
    withBodyFat: number;
    withBudget: number;
    withPathologies: number;
    withIntolerances: number;
    dietFlags: { vegan: number; vegetarian: number; glutenFree: number; lactoseFree: number };
  };
}

const OBJECTIVE_LABELS: Record<string, string> = {
  "quema-grasa": "Quema grasa",
  "ganancia-muscular": "Ganancia muscular",
  "tonificacion": "Tonificacion",
  "principiante-total": "Principiante",
  "rendimiento-deportivo": "Rendimiento",
  "post-parto": "Post-parto",
  "fuerza-funcional": "Fuerza",
  "recomposicion-corporal": "Recomposicion",
  "plan-pareja": "Pareja",
  "competicion": "Competicion",
  "kitesurf": "Kitesurf",
  "entrenamiento-casa": "En casa",
  "glutes-360": "Glutes 360",
  "direct-client": "Personalizado",
  "sin-definir": "Sin definir",
};

const COUNTRY_LABELS: Record<string, string> = {
  UY: "Uruguay", AR: "Argentina", ES: "Espana", BR: "Brasil",
  CL: "Chile", MX: "Mexico", OTRO: "Otro",
};

function MetricCard({
  icon: Icon, label, value, sub, color = "primary", href, alert,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color?: "primary" | "success" | "warning" | "danger" | "muted";
  href?: string;
  alert?: boolean;
}) {
  const colorMap = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    muted: "text-muted",
  };
  const inner = (
    <div className={`glass-card rounded-2xl p-4 ${alert ? "border-l-4 border-warning" : ""}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${colorMap[color]}`} />
        <span className="text-xs text-muted">{label}</span>
      </div>
      <p className={`text-2xl font-black ${colorMap[color]}`}>{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
  return href ? <Link href={href} className="block hover:opacity-90">{inner}</Link> : inner;
}

function BarRow({ label, count, max, color = "primary" }: { label: string; count: number; max: number; color?: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted truncate">{label}</span>
        <span className="font-bold">{count}</span>
      </div>
      <div className="h-1.5 bg-card-border/50 rounded-full overflow-hidden">
        <div className={`h-full bg-${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminMetricasPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMetrics = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sesion expirada");
      const res = await fetch("/api/admin/nutrition-metrics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error cargando metricas");
      setMetrics(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || !profile?.is_admin) return;
    fetchMetrics();
  }, [authLoading, user, profile]);

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

  if (error) {
    return (
      <div className="p-6">
        <div className="glass-card border-l-4 border-danger p-4">
          <p className="text-danger">{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const { operation, product, distributions } = metrics;
  const objectiveEntries = Object.entries(distributions.byObjective).sort((a, b) => b[1] - a[1]);
  const objectiveMax = Math.max(...objectiveEntries.map(([, v]) => v), 1);
  const countryEntries = Object.entries(distributions.byCountry).sort((a, b) => b[1] - a[1]);
  const countryMax = Math.max(...countryEntries.map(([, v]) => v), 1);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
      <Link href="/admin" className="flex items-center gap-2 text-muted hover:text-white mb-4 text-sm">
        <ArrowLeft className="h-4 w-4" /> Volver al admin
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Metricas de Nutricion</h1>
          <p className="text-muted text-sm">
            Estado de F3+F4+F5: variedad semanal, suplementacion, check-ins.
          </p>
        </div>
        <button onClick={fetchMetrics} className="text-muted hover:text-primary p-2" title="Actualizar">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* === SECCION 1: OPERACION DE HOY === */}
      <h2 className="text-sm font-bold text-muted uppercase tracking-wide mb-3">Operacion</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard
          icon={AlertTriangle}
          label="Revisiones pendientes"
          value={operation.revisionsPending}
          sub="Esperan tu aprobacion"
          color={operation.revisionsPending > 0 ? "warning" : "muted"}
          alert={operation.revisionsPending > 0}
          href="/admin/revisiones"
        />
        <MetricCard
          icon={ClipboardCheck}
          label="Check-ins ult. 7d"
          value={operation.checkinsLast7d}
          sub="Datos cargados por clientes"
          color="primary"
        />
        <MetricCard
          icon={Users}
          label="Clientes en riesgo"
          value={operation.clientsAtRisk}
          sub="Sin check-in >10 dias"
          color={operation.clientsAtRisk > 5 ? "warning" : "muted"}
        />
        <MetricCard
          icon={TrendingUp}
          label="Revisiones aplicadas"
          value={operation.revisionsApproved}
          sub={`${operation.revisionsRejected} rechazadas`}
          color="success"
        />
      </div>

      {/* === SECCION 2: PRODUCTO === */}
      <h2 className="text-sm font-bold text-muted uppercase tracking-wide mb-3">Salud del producto</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard
          icon={Users}
          label="Clientes activos"
          value={product.activeClients}
          color="primary"
        />
        <MetricCard
          icon={ClipboardCheck}
          label="Adherencia 30d"
          value={product.avgAdherence30d != null ? `${product.avgAdherence30d}%` : "—"}
          sub="Promedio de check-ins"
          color={(product.avgAdherence30d ?? 0) >= 80 ? "success" : (product.avgAdherence30d ?? 0) >= 60 ? "warning" : "danger"}
        />
        <MetricCard
          icon={TrendingUp}
          label="Tasa de check-in"
          value={`${product.checkinResponseRate}%`}
          sub="Activos con check-in <10d"
          color={product.checkinResponseRate >= 50 ? "success" : "warning"}
        />
        <MetricCard
          icon={Wallet}
          label="Costo plan/mes"
          value={product.avgMonthlyCost != null ? `${product.avgMonthlyCost.toLocaleString("es-UY")}` : "—"}
          sub={`${product.monthlyCostCurrency} promedio`}
          color="primary"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard
          icon={Pill}
          label="Planes con suplementos"
          value={product.plansWithSupplements}
          sub="Recomendaciones generadas"
          color="muted"
        />
        <MetricCard
          icon={Target}
          label="Planes con week-menu"
          value={product.plansWithWeekMenu}
          sub="Variedad de 7 dias"
          color="muted"
        />
        <MetricCard
          icon={Wallet}
          label="Sobre-presupuesto"
          value={product.plansBudgetOver}
          sub={`+${product.plansBudgetTight} ajustados`}
          color={product.plansBudgetOver > 0 ? "warning" : "muted"}
        />
        <MetricCard
          icon={ClipboardCheck}
          label="Energia / Hambre prom."
          value={product.avgEnergy != null && product.avgHunger != null ? `${product.avgEnergy} / ${product.avgHunger}` : "—"}
          sub="De check-ins (1-5)"
          color="muted"
        />
      </div>

      {/* === SECCION 3: DISTRIBUCIONES === */}
      <h2 className="text-sm font-bold text-muted uppercase tracking-wide mb-3">Distribuciones</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-bold">Por objetivo</h3>
          </div>
          {objectiveEntries.length === 0 ? (
            <p className="text-sm text-muted">Sin datos</p>
          ) : (
            <div>
              {objectiveEntries.slice(0, 8).map(([k, v]) => (
                <BarRow key={k} label={OBJECTIVE_LABELS[k] || k} count={v} max={objectiveMax} />
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-primary" />
            <h3 className="font-bold">Por pais</h3>
          </div>
          {countryEntries.length === 0 ? (
            <p className="text-sm text-muted">Aun no hay datos por pais. Los planes nuevos lo guardan automaticamente.</p>
          ) : (
            <div>
              {countryEntries.map(([k, v]) => (
                <BarRow key={k} label={COUNTRY_LABELS[k] || k} count={v} max={countryMax} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Pill className="h-4 w-4 text-primary" />
            <h3 className="font-bold">Top suplementos recomendados</h3>
          </div>
          {distributions.topSupplements.length === 0 ? (
            <p className="text-sm text-muted">Sin datos. Los planes nuevos generan recomendaciones automaticamente.</p>
          ) : (
            <ul className="space-y-2">
              {distributions.topSupplements.map(s => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted truncate">{s.name}</span>
                  <span className="font-bold">
                    {s.count} <span className="text-xs text-muted">({s.essentialCount} esenciales)</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-bold">Datos de la encuesta v2</h3>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-muted">Con % graso reportado</span>
              <span className="font-bold">{distributions.withBodyFat}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Con presupuesto declarado</span>
              <span className="font-bold">{distributions.withBudget}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Con patologias</span>
              <span className="font-bold">{distributions.withPathologies}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Con intolerancias</span>
              <span className="font-bold">{distributions.withIntolerances}</span>
            </li>
            <li className="border-t border-card-border/50 pt-2 mt-2">
              <p className="text-xs text-muted mb-1">Restricciones dieteticas</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span>Vegano: <b>{distributions.dietFlags.vegan}</b></span>
                <span>Vegetariano: <b>{distributions.dietFlags.vegetarian}</b></span>
                <span>Sin gluten: <b>{distributions.dietFlags.glutenFree}</b></span>
                <span>Sin lactosa: <b>{distributions.dietFlags.lactoseFree}</b></span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <p className="text-xs text-muted text-center mt-6">
        Generado: {new Date(metrics.generatedAt).toLocaleString("es-UY")}
      </p>
    </div>
  );
}
