"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, ChevronRight, Eye } from "lucide-react";

const MOCK_CLIENTS = [
  { id: "1", name: "Lorena Vazquez", email: "lorena@email.com", plan: "Quema Grasa", duration: "3 Meses", start: "2026-01-15", end: "2026-04-15", status: "active", weight: "68kg" },
  { id: "2", name: "Manuela Galiano", email: "manuela@email.com", plan: "Tonificación", duration: "6 Meses", start: "2025-12-01", end: "2026-06-01", status: "active", weight: "55kg" },
  { id: "3", name: "Javier Cardellino", email: "javier@email.com", plan: "Ganancia Muscular", duration: "3 Meses", start: "2026-02-01", end: "2026-05-01", status: "active", weight: "78kg" },
  { id: "4", name: "Paulina Berriel", email: "paulina@email.com", plan: "Rendimiento Deportivo", duration: "1 Año", start: "2025-06-01", end: "2026-06-01", status: "active", weight: "62kg" },
  { id: "5", name: "Carlos Mendez", email: "carlos@email.com", plan: "Principiante Total", duration: "1 Mes", start: "2026-03-01", end: "2026-04-01", status: "expiring", weight: "95kg" },
  { id: "6", name: "Ana Rodriguez", email: "ana@email.com", plan: "Post-Parto", duration: "3 Meses", start: "2026-02-15", end: "2026-05-15", status: "active", weight: "70kg" },
  { id: "7", name: "Diego Martinez", email: "diego@email.com", plan: "Fuerza Funcional", duration: "6 Meses", start: "2026-01-01", end: "2026-07-01", status: "active", weight: "82kg" },
  { id: "8", name: "Maria y Juan", email: "mariajuan@email.com", plan: "Plan Pareja", duration: "3 Meses", start: "2026-03-01", end: "2026-06-01", status: "active", weight: "-" },
];

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = MOCK_CLIENTS.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Clientes</h1>
      <p className="text-muted mb-6">{MOCK_CLIENTS.length} clientes registrados</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full bg-card-bg border border-card-border rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "expiring", "expired"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === s
                  ? "gradient-primary text-black"
                  : "glass-card text-muted hover:text-white"
              }`}
            >
              {s === "all" ? "Todos" : s === "active" ? "Activos" : s === "expiring" ? "Por vencer" : "Vencidos"}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-muted">
                <th className="text-left p-4 font-medium">Cliente</th>
                <th className="text-left p-4 font-medium hidden sm:table-cell">Plan</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Duración</th>
                <th className="text-left p-4 font-medium hidden lg:table-cell">Vencimiento</th>
                <th className="text-center p-4 font-medium">Estado</th>
                <th className="text-center p-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="border-b border-card-border/50 last:border-0 hover:bg-white/[0.02]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{client.name[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-xs text-muted">{client.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell">{client.plan}</td>
                  <td className="p-4 hidden md:table-cell text-muted">{client.duration}</td>
                  <td className="p-4 hidden lg:table-cell text-muted">
                    {new Date(client.end).toLocaleDateString("es")}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      client.status === "active" ? "bg-primary/10 text-primary" :
                      client.status === "expiring" ? "bg-warning/10 text-warning" :
                      "bg-danger/10 text-danger"
                    }`}>
                      {client.status === "active" ? "Activo" : client.status === "expiring" ? "Por vencer" : "Vencido"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <Link
                      href={`/admin/clientes/${client.id}`}
                      className="text-muted hover:text-primary transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
