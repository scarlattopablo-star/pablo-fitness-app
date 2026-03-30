"use client";

import { Users, CreditCard, TrendingUp, DollarSign, UserPlus, AlertCircle } from "lucide-react";
import Link from "next/link";

const MOCK_STATS = {
  totalClients: 47,
  activeClients: 38,
  monthlyRevenue: 2850,
  totalRevenue: 12400,
  newThisMonth: 8,
  expiringSoon: 5,
};

const RECENT_CLIENTS = [
  { name: "Lorena Vazquez", plan: "Quema Grasa", date: "28 Mar", status: "active" },
  { name: "Manuela Galiano", plan: "Tonificación", date: "25 Mar", status: "active" },
  { name: "Javier Cardellino", plan: "Ganancia Muscular", date: "22 Mar", status: "active" },
  { name: "Paulina Berriel", plan: "Rendimiento Deportivo", date: "20 Mar", status: "active" },
  { name: "Carlos Mendez", plan: "Principiante Total", date: "18 Mar", status: "expiring" },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Panel de Administración</h1>
      <p className="text-muted mb-8">Bienvenido, Pablo</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-5">
          <Users className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">{MOCK_STATS.activeClients}</p>
          <p className="text-xs text-muted">Clientes activos</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <UserPlus className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black text-primary">+{MOCK_STATS.newThisMonth}</p>
          <p className="text-xs text-muted">Nuevos este mes</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <DollarSign className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">${MOCK_STATS.monthlyRevenue}</p>
          <p className="text-xs text-muted">Ingresos del mes</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <TrendingUp className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">${MOCK_STATS.totalRevenue}</p>
          <p className="text-xs text-muted">Ingresos totales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Clientes Recientes</h2>
            <Link href="/admin/clientes" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {RECENT_CLIENTS.map((client) => (
              <div key={client.name} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {client.name[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{client.name}</p>
                    <p className="text-xs text-muted">{client.plan}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">{client.date}</p>
                  {client.status === "expiring" && (
                    <span className="text-xs text-warning">Por vencer</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6 border-l-4 border-warning">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              <h3 className="font-bold">Planes por Vencer</h3>
            </div>
            <p className="text-sm text-muted mb-3">
              {MOCK_STATS.expiringSoon} clientes tienen planes que vencen en los próximos 7 días.
            </p>
            <Link href="/admin/clientes" className="text-sm text-primary hover:underline">
              Ver clientes
            </Link>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold mb-3">Distribución de Planes</h3>
            <div className="space-y-2">
              {[
                { name: "Quema Grasa", count: 12, color: "#FF4444" },
                { name: "Ganancia Muscular", count: 10, color: "#4CAF50" },
                { name: "Tonificación", count: 8, color: "#FF9800" },
                { name: "Principiante", count: 5, color: "#2196F3" },
                { name: "Otros", count: 3, color: "#607D8B" },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="flex-1 text-sm">{item.name}</span>
                  <span className="text-sm font-bold">{item.count}</span>
                  <div className="w-20 bg-card-border rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(item.count / 38) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold mb-3">Ingresos por Mes</h3>
            <div className="flex items-end gap-2 h-32">
              {[1800, 2100, 2400, 2200, 2850, 0].map((amount, i) => {
                const months = ["Oct", "Nov", "Dic", "Ene", "Feb", "Mar"];
                const maxAmount = 3000;
                const height = amount > 0 ? (amount / maxAmount) * 100 : 5;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold">{amount > 0 ? `$${amount}` : "-"}</span>
                    <div
                      className={`w-full rounded-t-lg ${amount > 0 ? "gradient-primary" : "bg-card-border"}`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-muted">{months[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
