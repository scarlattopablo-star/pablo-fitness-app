"use client";

import { useState, useEffect } from "react";
import { DollarSign, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { RatLoader } from "@/components/rat-loader";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface Payment {
  id: string;
  user_id: string;
  mercadopago_id: string | null;
  amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  client_name: string;
  plan_name: string;
  duration: string;
}

export default function PagosPage() {
  const { user, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) loadPayments();
  }, [authLoading, user]);

  const loadPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select("*, profiles(full_name), subscriptions(plan_name, duration)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPayments(
        data.map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          mercadopago_id: p.mercadopago_id,
          amount: p.amount,
          status: p.status,
          payment_method: p.payment_method,
          created_at: p.created_at,
          client_name: p.profiles?.full_name || "Sin nombre",
          plan_name: p.subscriptions?.plan_name || "—",
          duration: p.subscriptions?.duration || "—",
        }))
      );
    }
    setLoading(false);
  };

  const totalApproved = payments
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const durationLabel = (d: string) => {
    const map: Record<string, string> = {
      "1-mes": "1 Mes",
      "3-meses": "3 Meses",
      "6-meses": "6 Meses",
      "1-ano": "1 Año",
    };
    return map[d] || d;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RatLoader size={64} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Pagos</h1>
      <p className="text-muted mb-6">Historial de pagos vía MercadoPago</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-5">
          <DollarSign className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">${totalApproved.toLocaleString("es-UY")}</p>
          <p className="text-xs text-muted">Total cobrado</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <CheckCircle className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">
            {payments.filter((p) => p.status === "approved").length}
          </p>
          <p className="text-xs text-muted">Aprobados</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <XCircle className="h-5 w-5 text-danger mb-2" />
          <p className="text-2xl font-black">
            {payments.filter((p) => p.status === "rejected").length}
          </p>
          <p className="text-xs text-muted">Rechazados</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <DollarSign className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="text-muted">No hay pagos registrados todavía</p>
        </div>
      ) : (
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
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-card-border/50 last:border-0">
                    <td className="p-4 font-mono text-xs text-muted">
                      {payment.mercadopago_id
                        ? `MP-${payment.mercadopago_id.slice(-4)}`
                        : payment.id.slice(0, 8)}
                    </td>
                    <td className="p-4 font-medium">{payment.client_name}</td>
                    <td className="p-4 hidden sm:table-cell text-muted">{payment.plan_name}</td>
                    <td className="p-4 hidden md:table-cell text-muted">
                      {durationLabel(payment.duration)}
                    </td>
                    <td className="p-4 text-right font-bold">${Number(payment.amount).toLocaleString("es-UY")}</td>
                    <td className="p-4 hidden lg:table-cell text-muted">
                      {new Date(payment.created_at).toLocaleDateString("es")}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                          payment.status === "approved"
                            ? "bg-primary/10 text-primary"
                            : payment.status === "pending"
                            ? "bg-warning/10 text-warning"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        {payment.status === "approved" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : payment.status === "pending" ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {payment.status === "approved"
                          ? "Aprobado"
                          : payment.status === "pending"
                          ? "Pendiente"
                          : "Rechazado"}
                      </span>
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
