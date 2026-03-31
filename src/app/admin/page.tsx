"use client";

import { Users, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface ClientInfo {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [visits, setVisits] = useState({ total: 0, today: 0, week: 0, month: 0 });
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/track-visit")
      .then(r => r.json())
      .then(data => setVisits(data))
      .catch(() => {});

    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/clients?limit=5", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.clients) setClients(data.clients);
      if (data.total !== undefined) setTotalClients(data.total);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Panel de Administración</h1>
      <p className="text-muted mb-8">Bienvenido, Pablo</p>

      {/* Stats */}
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

      {/* Recent Clients */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Clientes Recientes</h2>
          <Link href="/admin/clientes" className="text-sm text-primary hover:underline">
            Ver todos
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-10">
            <Users className="h-8 w-8 text-muted mx-auto mb-2" />
            <p className="text-muted text-sm">No hay clientes todavía</p>
            <p className="text-xs text-muted mt-1">Aparecerán acá cuando se registren</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/admin/clientes/${client.id}`}
                className="flex items-center justify-between py-2 hover:bg-white/[0.02] rounded-lg px-2 -mx-2 transition-colors"
              >
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
