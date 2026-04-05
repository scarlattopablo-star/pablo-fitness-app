"use client";

import { Users, Eye, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface ClientInfo {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [visits, setVisits] = useState({ total: 0, today: 0, week: 0, month: 0 });
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/track-visit")
      .then(r => r.json())
      .then(data => setVisits(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadClients();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user]);

  const loadClients = async () => {
    try {
      const { data, count } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("is_admin", false)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setClients(data);
      if (count !== null) setTotalClients(count);

      // Load pending plan approvals
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

  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Panel de Administracion</h1>
      <p className="text-muted mb-8">Bienvenido, Pablo</p>

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-5">
          <Users className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">{totalClients}</p>
          <p className="text-xs text-muted">Clientes registrados</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <Eye className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">{visits.today}</p>
          <p className="text-xs text-muted">Visitas hoy</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <Eye className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">{visits.week}</p>
          <p className="text-xs text-muted">Visitas esta semana</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <Eye className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">{visits.total}</p>
          <p className="text-xs text-muted">Visitas totales</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Clientes Recientes</h2>
          <Link href="/admin/clientes" className="text-sm text-primary hover:underline">Ver todos</Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-10">
            <Users className="h-8 w-8 text-muted mx-auto mb-2" />
            <p className="text-muted text-sm">No hay clientes todavia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => (
              <Link key={client.id} href={`/admin/clientes/${client.id}`}
                className="flex items-center justify-between py-2 hover:bg-white/[0.02] rounded-lg px-2 -mx-2 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {(client.full_name || client.email || "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{client.full_name || "Sin nombre"}</p>
                    <p className="text-xs text-muted">{client.email}</p>
                  </div>
                </div>
                <p className="text-xs text-muted">
                  {new Date(client.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
