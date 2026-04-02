"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Save, Shield, Loader2, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

interface SurveyData {
  id: string;
  age: number;
  sex: string;
  weight: number;
  height: number;
  activity_level: string;
  dietary_restrictions: string[];
  objective: string;
}

export default function PerfilPage() {
  const { user, profile, subscription } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
    if (user) loadSurvey();
  }, [user, profile]);

  const loadSurvey = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("surveys")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (data) setSurvey(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Mi Perfil</h1>
      <p className="text-muted mb-8">Edita tu informacion personal</p>

      <div className="max-w-xl space-y-6">
        {/* Personal Info */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Informacion Personal
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre Completo</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email
              </label>
              <input type="email" value={profile?.email || ""} disabled
                className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-muted cursor-not-allowed" />
              <p className="text-xs text-muted mt-1">El email no se puede cambiar</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Phone className="h-3 w-3" /> Telefono
              </label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+598 99 123 456"
                className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        {/* Plan Info */}
        {subscription && (
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Mi Plan
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Plan</span>
                <span className="font-medium">{subscription.plan_name || "Plan Personalizado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Duracion</span>
                <span className="font-medium">{subscription.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Inicio</span>
                <span className="font-medium">{new Date(subscription.start_date).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Vencimiento</span>
                <span className="font-medium">{new Date(subscription.end_date).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Estado</span>
                <span className={subscription.status === "active" ? "text-primary font-bold" : "text-danger font-bold"}>
                  {subscription.status === "active" ? "Activo" : subscription.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Survey Data */}
        {survey && (
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-bold mb-4">Datos de mi Encuesta</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-card-bg rounded-xl p-3">
                <p className="text-xs text-muted">Edad</p>
                <p className="font-bold">{survey.age} años</p>
              </div>
              <div className="bg-card-bg rounded-xl p-3">
                <p className="text-xs text-muted">Sexo</p>
                <p className="font-bold capitalize">{survey.sex}</p>
              </div>
              <div className="bg-card-bg rounded-xl p-3">
                <p className="text-xs text-muted">Peso inicial</p>
                <p className="font-bold">{survey.weight} kg</p>
              </div>
              <div className="bg-card-bg rounded-xl p-3">
                <p className="text-xs text-muted">Altura</p>
                <p className="font-bold">{survey.height} cm</p>
              </div>
              <div className="bg-card-bg rounded-xl p-3">
                <p className="text-xs text-muted">Actividad</p>
                <p className="font-bold capitalize">{survey.activity_level?.replace("-", " ")}</p>
              </div>
              <div className="bg-card-bg rounded-xl p-3">
                <p className="text-xs text-muted">Restricciones</p>
                <p className="font-bold">{survey.dietary_restrictions?.join(", ") || "Ninguna"}</p>
              </div>
            </div>
          </div>
        )}

        <button onClick={handleSave} disabled={saving}
          className="w-full gradient-primary text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
          {saved ? (<><Check className="h-5 w-5" /> Guardado!</>) :
           saving ? (<><Loader2 className="h-5 w-5 animate-spin" /> Guardando...</>) :
           (<><Save className="h-5 w-5" /> Guardar Cambios</>)}
        </button>
      </div>
    </div>
  );
}
