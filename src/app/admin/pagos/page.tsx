"use client";

import { DollarSign, CheckCircle, Clock, XCircle } from "lucide-react";

const MOCK_PAYMENTS = [
  { id: "MP-001", client: "Lorena Vazquez", plan: "Quema Grasa", duration: "3 Meses", amount: 120, date: "2026-03-28", status: "approved" },
  { id: "MP-002", client: "Manuela Galiano", plan: "Tonificación", duration: "6 Meses", amount: 200, date: "2026-03-25", status: "approved" },
  { id: "MP-003", client: "Javier Cardellino", plan: "Ganancia Muscular", duration: "3 Meses", amount: 120, date: "2026-03-22", status: "approved" },
  { id: "MP-004", client: "Carlos Mendez", plan: "Principiante Total", duration: "1 Mes", amount: 50, date: "2026-03-18", status: "approved" },
  { id: "MP-005", client: "Ana Rodriguez", plan: "Post-Parto", duration: "3 Meses", amount: 120, date: "2026-03-15", status: "approved" },
  { id: "MP-006", client: "Diego Martinez", plan: "Fuerza Funcional", duration: "6 Meses", amount: 200, date: "2026-03-10", status: "approved" },
  { id: "MP-007", client: "Maria y Juan", plan: "Plan Pareja", duration: "3 Meses", amount: 190, date: "2026-03-08", status: "approved" },
  { id: "MP-008", client: "Test User", plan: "Quema Grasa", duration: "1 Mes", amount: 50, date: "2026-03-05", status: "rejected" },
];

export default function PagosPage() {
  const totalApproved = MOCK_PAYMENTS.filter(p => p.status === "approved").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Pagos</h1>
      <p className="text-muted mb-6">Historial de pagos vía MercadoPago</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-5">
          <DollarSign className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">${totalApproved}</p>
          <p className="text-xs text-muted">Total cobrado</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <CheckCircle className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">{MOCK_PAYMENTS.filter(p => p.status === "approved").length}</p>
          <p className="text-xs text-muted">Aprobados</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <XCircle className="h-5 w-5 text-danger mb-2" />
          <p className="text-2xl font-black">{MOCK_PAYMENTS.filter(p => p.status === "rejected").length}</p>
          <p className="text-xs text-muted">Rechazados</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-muted">
                <th className="text-left p-4 font-medium">ID</th>
                <th className="text-left p-4 font-medium">Cliente</th>
                <th className="text-left p-4 font-medium hidden sm:table-cell">Plan</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Duración</th>
                <th className="text-right p-4 font-medium">Monto</th>
                <th className="text-left p-4 font-medium hidden lg:table-cell">Fecha</th>
                <th className="text-center p-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PAYMENTS.map((payment) => (
                <tr key={payment.id} className="border-b border-card-border/50 last:border-0">
                  <td className="p-4 font-mono text-xs text-muted">{payment.id}</td>
                  <td className="p-4 font-medium">{payment.client}</td>
                  <td className="p-4 hidden sm:table-cell text-muted">{payment.plan}</td>
                  <td className="p-4 hidden md:table-cell text-muted">{payment.duration}</td>
                  <td className="p-4 text-right font-bold">${payment.amount}</td>
                  <td className="p-4 hidden lg:table-cell text-muted">
                    {new Date(payment.date).toLocaleDateString("es")}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                      payment.status === "approved" ? "bg-primary/10 text-primary" :
                      payment.status === "pending" ? "bg-warning/10 text-warning" :
                      "bg-danger/10 text-danger"
                    }`}>
                      {payment.status === "approved" ? <CheckCircle className="h-3 w-3" /> :
                       payment.status === "pending" ? <Clock className="h-3 w-3" /> :
                       <XCircle className="h-3 w-3" />}
                      {payment.status === "approved" ? "Aprobado" : payment.status === "pending" ? "Pendiente" : "Rechazado"}
                    </span>
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
