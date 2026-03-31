"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { PLANS } from "@/lib/plans-data";
import { supabase } from "@/lib/supabase";
import { Gift, Copy, Check, QrCode, Plus, Trash2 } from "lucide-react";
import type { Duration } from "@/types";

interface GeneratedCode {
  code: string;
  planSlug: string;
  planName: string;
  duration: string;
  url: string;
}

export default function AccesoGratisPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>(PLANS[0].slug);
  const [selectedDuration, setSelectedDuration] = useState<Duration>("3-meses");
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const generateCode = async () => {
    setGenerating(true);
    const code = `FREE-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const plan = PLANS.find(p => p.slug === selectedPlan);
    const appUrl = typeof window !== "undefined" ? window.location.origin.replace("/admin/acceso-gratis", "") : "";
    const baseUrl = appUrl.includes("admin") ? appUrl.split("/admin")[0] : appUrl;
    const url = `${baseUrl}/acceso-gratis?code=${code}`;

    try {
      await supabase.from("free_access_codes").insert({
        code,
        plan_slug: selectedPlan,
        duration: selectedDuration,
        used: false,
      });

      setGeneratedCodes([
        {
          code,
          planSlug: selectedPlan,
          planName: plan?.name || "",
          duration: selectedDuration,
          url,
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
      <h1 className="text-2xl font-black mb-2 flex items-center gap-2">
        <Gift className="h-6 w-6 text-primary" />
        Acceso Gratis
      </h1>
      <p className="text-muted mb-8">
        Generá códigos QR de acceso gratis para regalar a quien quieras. Solo vos ves esta página.
      </p>

      {/* Generator */}
      <div className="glass-card rounded-2xl p-6 mb-8">
        <h2 className="font-bold mb-4">Generar Código de Acceso</h2>

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
          onClick={generateCode}
          disabled={generating}
          className="gradient-primary text-black font-bold py-3 px-6 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
          {generating ? "Generando..." : "Generar Código QR"}
        </button>
      </div>

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
                  <p className="font-bold text-lg">{item.planName}</p>
                  <p className="text-sm text-muted mb-2">{item.duration.replace("-", " ")}</p>
                  <p className="text-xs font-mono bg-card-bg rounded-lg px-3 py-2 mb-3 break-all">
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
