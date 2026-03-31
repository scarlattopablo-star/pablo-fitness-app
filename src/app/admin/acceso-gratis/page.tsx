"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { PLANS } from "@/lib/plans-data";
import { supabase } from "@/lib/supabase";
import { Gift, Copy, Check, Plus, UserPlus } from "lucide-react";
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

  const getBaseUrl = () => {
    if (typeof window === "undefined") return "";
    return window.location.origin.split("/admin")[0];
  };

  const generateDirectClientCode = async () => {
    setGenerating(true);
    const code = `CLIENT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const url = `${getBaseUrl()}/cliente-directo?code=${code}`;

    try {
      await supabase.from("free_access_codes").insert({
        code,
        plan_slug: "direct-client",
        duration: "custom",
        used: false,
      });

      setGeneratedCodes([
        { code, type: "direct-client", url },
        ...generatedCodes,
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const generateFreePlanCode = async () => {
    setGenerating(true);
    const code = `FREE-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const plan = PLANS.find(p => p.slug === selectedPlan);
    const url = `${getBaseUrl()}/acceso-gratis?code=${code}`;

    try {
      await supabase.from("free_access_codes").insert({
        code,
        plan_slug: selectedPlan,
        duration: selectedDuration,
        used: false,
      });

      setGeneratedCodes([
        {
          code, type: "free-plan", planSlug: selectedPlan,
          planName: plan?.name || "", duration: selectedDuration, url,
        },
        ...generatedCodes,
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

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
