"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { PLANS } from "@/lib/plans-data";
import { supabase } from "@/lib/supabase";
import { Gift, Copy, Check, Plus, UserPlus, AlertTriangle } from "lucide-react";
import type { Duration } from "@/types";

interface GeneratedCode {
  code: string;
  type: "free-plan" | "direct-client";
  planSlug?: string;
  planName?: string;
  duration?: string;
  url: string;
}

export default function AccesoGratisPage() {
  const [tab, setTab] = useState<"direct-client" | "free-plan">("direct-client");
  const [selectedPlan, setSelectedPlan] = useState<string>(PLANS[0].slug);
  const [selectedDuration, setSelectedDuration] = useState<Duration>("3-meses");
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [genError, setGenError] = useState("");

  const getBaseUrl = () => {
    if (typeof window === "undefined") return "";
    return window.location.origin.split("/admin")[0];
  };

  // Server-side code generation — bypasses RLS, guarantees the code is saved
  const generateCode = async (type: "direct-client" | "free-plan") => {
    setGenerating(true);
    setGenError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setGenError("Sesión expirada. Recargá la página e intentá de nuevo.");
        setGenerating(false);
        return;
      }

      const plan = type === "free-plan" ? PLANS.find(p => p.slug === selectedPlan) : null;

      const res = await fetch("/api/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type,
          planSlug: type === "free-plan" ? selectedPlan : undefined,
          duration: type === "free-plan" ? selectedDuration : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setGenError(errData.error || "Error al generar código");
        setGenerating(false);
        return;
      }

      const data = await res.json();
      const route = type === "direct-client" ? "cliente-directo" : "acceso-gratis";
      const url = `${getBaseUrl()}/${route}?code=${data.code}`;

      setGeneratedCodes([
        {
          code: data.code,
          type,
          planSlug: type === "free-plan" ? selectedPlan : undefined,
          planName: type === "free-plan" ? plan?.name || "" : undefined,
          duration: data.duration,
          url,
        },
        ...generatedCodes,
      ]);
    } catch (err) {
      console.error(err);
      setGenError("Error de conexión. Intentá de nuevo.");
    } finally {
      setGenerating(false);
    }
  };

  const generateDirectClientCode = () => generateCode("direct-client");
  const generateFreePlanCode = () => generateCode("free-plan");

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Gestión de Accesos</h1>
      <p className="text-muted mb-8">Generá códigos QR para agregar clientes o regalar planes.</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setTab("direct-client")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            tab === "direct-client" ? "gradient-primary text-black" : "glass-card text-muted hover:text-white"
          }`}
        >
          <UserPlus className="h-4 w-4" /> Cliente Directo
        </button>
        <button
          onClick={() => setTab("free-plan")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            tab === "free-plan" ? "gradient-primary text-black" : "glass-card text-muted hover:text-white"
          }`}
        >
          <Gift className="h-4 w-4" /> Plan Gratis
        </button>
      </div>

      {genError && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm p-4 rounded-xl mb-6 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {genError}
        </div>
      )}

      {/* DIRECT CLIENT */}
      {tab === "direct-client" && (
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="font-bold mb-2 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Agregar Cliente Directo
          </h2>
          <p className="text-sm text-muted mb-4">
            Generá un QR para enviarle a tu cliente. Cuando lo escanee:
          </p>
          <ul className="text-sm text-muted mb-6 space-y-1">
            <li>&#8226; Se registra con email y contraseña</li>
            <li>&#8226; Completa la encuesta (datos, peso, altura, fotos)</li>
            <li>&#8226; <strong className="text-white">No ve precios ni planes de pago</strong></li>
            <li>&#8226; Vos le armás el plan personalizado desde el admin</li>
            <li>&#8226; Puede descargar la app en su celular</li>
          </ul>
          <button
            onClick={generateDirectClientCode}
            disabled={generating}
            className="gradient-primary text-black font-bold py-3 px-6 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
            {generating ? "Generando..." : "Generar QR Cliente Directo"}
          </button>
        </div>
      )}

      {/* FREE PLAN */}
      {tab === "free-plan" && (
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Regalar Plan Gratis
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Plan</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
              >
                {PLANS.map((plan) => (
                  <option key={plan.slug} value={plan.slug}>{plan.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Duración</label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value as Duration)}
                className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
              >
                <option value="1-mes">1 Mes</option>
                <option value="3-meses">3 Meses</option>
                <option value="6-meses">6 Meses</option>
                <option value="1-ano">1 Año</option>
              </select>
            </div>
          </div>
          <button
            onClick={generateFreePlanCode}
            disabled={generating}
            className="gradient-primary text-black font-bold py-3 px-6 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
            {generating ? "Generando..." : "Generar QR Plan Gratis"}
          </button>
        </div>
      )}

      {/* Generated Codes */}
      {generatedCodes.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Códigos Generados</h2>
          {generatedCodes.map((item) => (
            <div key={item.code} className="glass-card rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="bg-white p-3 rounded-xl">
                  <QRCodeSVG value={item.url} size={150} />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 mb-1">
                    {item.type === "direct-client" ? (
                      <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                        Cliente Directo
                      </span>
                    ) : (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        Plan Gratis
                      </span>
                    )}
                  </div>
                  {item.planName && (
                    <p className="font-bold text-lg">{item.planName}</p>
                  )}
                  {item.type === "direct-client" && (
                    <p className="font-bold">Cliente sin pago - Vos armás el plan</p>
                  )}
                  {item.duration && item.duration !== "custom" && (
                    <p className="text-sm text-muted">{item.duration.replace("-", " ")}</p>
                  )}
                  <p className="text-xs font-mono bg-card-bg rounded-lg px-3 py-2 my-3 break-all">
                    {item.code}
                  </p>
                  <button
                    onClick={() => copyUrl(item.url)}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    {copied === item.url ? (
                      <><Check className="h-4 w-4" /> Copiado!</>
                    ) : (
                      <><Copy className="h-4 w-4" /> Copiar link</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
