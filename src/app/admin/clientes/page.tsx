"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Eye, Users, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
}

export default function ClientesPage() {
  const { user, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      loadClients();
    }
  }, [authLoading, user]);

  const loadClients = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/clients", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.clients) setClients(data.clients);
    } catch {
      // Network error - silently fail
    } finally {
      setLoading(false);
    }
  };

  const filtered = clients.filter((c) => {
    return c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Clientes</h1>
      <p className="text-muted mb-6">{clients.length} clientes registrados</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full bg-card-bg border border-card-border rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Users className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="font-bold">No hay clientes todavia</p>
          <p className="text-sm text-muted mt-1">Los clientes apareceran aca cuando se registren.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-muted">
                  <th className="text-left p-4 font-medium">Cliente</th>
                  <th className="text-left p-4 font-medium hidden sm:table-cell">Telefono</th>
                  <th className="text-left p-4 font-medium hidden md:table-cell">Registro</th>
                  <th className="text-center p-4 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr key={client.id} className="border-b border-card-border/50 last:border-0 hover:bg-white/[0.02]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">
                            {(client.full_name || client.email || "?")[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{client.full_name || "Sin nombre"}</p>
                          <p className="text-xs text-muted">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell text-muted">{client.phone || "-"}</td>
                    <td className="p-4 hidden md:table-cell text-muted">
                      {new Date(client.created_at).toLocaleDateString("es")}
                    </td>
                    <td className="p-4 text-center">
                      <Link href={`/admin/clientes/${client.id}`} className="text-muted hover:text-primary transition-colors">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
