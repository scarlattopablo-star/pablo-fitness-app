"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Users, ChevronRight } from "lucide-react";
import { RatLoader } from "@/components/rat-loader";
import { supabase } from "@/lib/supabase";

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
}

export default function EntrenadorClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/trainer/clients", {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        const body = await res.json();
        if (!res.ok) setError(body.error || "Error cargando clientes");
        else setClients(body.clients);
      } catch {
        setError("Error de conexion");
      }
      setLoading(false);
    })();
  }, []);

  const filtered = clients.filter((c) =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-black mb-1">Clientes a entrenar</h1>
      <p className="text-muted text-sm mb-6">Clientes personalizados de Pablo. Podes ver su plan y cargar la sesion cuando los entrenas.</p>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="w-full bg-card-bg border border-card-border rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><RatLoader size={64} /></div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <Users className="h-8 w-8 text-muted mx-auto mb-2" />
          <p className="text-sm text-muted">No hay clientes</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl divide-y divide-card-border/50 overflow-hidden">
          {filtered.map((c) => (
            <Link key={c.id} href={`/entrenador/${c.id}`}
              className="flex items-center gap-3 p-4 hover:bg-white/[0.03] transition-colors">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">{(c.full_name || c.email || "?")[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{c.full_name || "Sin nombre"}</p>
                <p className="text-xs text-muted truncate">{c.phone || c.email}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
