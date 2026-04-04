"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Eye, Users, Loader2, QrCode } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  isDirectClient?: boolean;
  planApproved?: boolean;
}

export default function ClientesPage() {
  const { user, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      loadClients();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user]);

  const loadClients = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_admin", false)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      // Get QR codes with plan_slug to differentiate direct vs free
      const { data: qrCodes } = await supabase
        .from("free_access_codes")
        .select("used_by, plan_slug")
        .eq("used", true)
        .not("used_by", "is", null);

      const directClientIds = new Set(
        qrCodes?.filter(c => c.plan_slug === "direct-client").map(c => c.used_by) || []
      );

      // Get plan approval status
      const { data: plans } = await supabase
        .from("training_plans")
        .select("user_id, plan_approved");

      const approvedMap = new Map<string, boolean>();
      plans?.forEach(p => approvedMap.set(p.user_id, p.plan_approved));

      if (data) {
        setClients(data.map(c => ({
          ...c,
          isDirectClient: directClientIds.has(c.id),
          planApproved: approvedMap.get(c.id),
        })));
      }
    } catch {}
    setLoading(false);
  };

  const allFiltered = clients.filter((c) => {
    return c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
  });

  const directClients = allFiltered.filter(c => c.isDirectClient);
  const otherClients = allFiltered.filter(c => !c.isDirectClient);

  const ClientTable = ({ list, emptyMsg }: { list: Client[]; emptyMsg: string }) => (
    list.length === 0 ? (
      <div className="glass-card rounded-2xl p-8 text-center">
        <Users className="h-8 w-8 text-muted mx-auto mb-2" />
        <p className="text-sm text-muted">{emptyMsg}</p>
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
              {list.map((client) => (
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
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-xs text-muted">{client.email}</p>
                          {client.isDirectClient && client.planApproved === false && (
                            <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded font-bold">Pendiente</span>
                          )}
                          {client.isDirectClient && client.planApproved === true && (
                            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">Aprobado</span>
                          )}
                        </div>
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
    )
  );

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
      ) : (
        <>
          {/* Clientes Directos (QR) */}
          {directClients.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-bold">Clientes Directos</h2>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">{directClients.length}</span>
              </div>
              <ClientTable list={directClients} emptyMsg="No hay clientes directos" />
            </div>
          )}

          {/* Todos los demas clientes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">{directClients.length > 0 ? "Clientes de Pago" : "Clientes"}</h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{otherClients.length}</span>
            </div>
            <ClientTable list={otherClients} emptyMsg="No hay clientes de pago todavia" />
          </div>
        </>
      )}
    </div>
  );
}
