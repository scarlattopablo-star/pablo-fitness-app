"use client";

import { useState, useEffect, useRef } from "react";
import { User, Mail, Phone, Save, Shield, Loader2, Check, Camera, Pencil } from "lucide-react";
import { RatLoader } from "@/components/rat-loader";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { uploadProfilePhoto, getPhotoUrl } from "@/lib/upload-photo";

interface SurveyData {
  id: string;
  age: number;
  sex: string;
  weight: number;
  height: number;
  activity_level: string;
  dietary_restrictions: string[];
  objective: string;
  training_days?: number;
  wake_hour?: number;
  sleep_hour?: number;
  emphasis?: string;
}

const ACTIVITY_OPTIONS = [
  { value: "sedentario", label: "Sedentario" },
  { value: "moderado", label: "Moderado" },
  { value: "activo", label: "Activo" },
  { value: "muy-activo", label: "Muy Activo" },
];

const EMPHASIS_OPTIONS = [
  { value: "ninguno", label: "Equilibrado" },
  { value: "pecho", label: "Pecho" },
  { value: "espalda", label: "Espalda" },
  { value: "piernas", label: "Piernas" },
  { value: "abdomen", label: "Abdomen" },
  { value: "tren-superior", label: "Tren Superior" },
];

const RESTRICTIONS = [
  "Ninguna", "Vegetariano", "Vegano", "Sin gluten (celíaco)",
  "Sin lactosa", "Sin frutos secos", "Diabetes", "Otra",
];

export default function PerfilPage() {
  const { user, profile, subscription } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(false);
  const [surveyForm, setSurveyForm] = useState<Partial<SurveyData>>({});
  const [savingSurvey, setSavingSurvey] = useState(false);
  const [surveySuccess, setSurveySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      if (profile.avatar_url) {
        getPhotoUrl(profile.avatar_url).then(url => { if (url) setAvatarUrl(url); });
      }
    }
    if (user) loadSurvey();
  }, [user, profile]);

  const loadSurvey = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("surveys").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(1).single();
    if (data) setSurvey(data);
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    const path = await uploadProfilePhoto(file, user.id);
    if (path) {
      await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
      const url = await getPhotoUrl(path);
      if (url) setAvatarUrl(url);
    }
    setUploadingAvatar(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const displayName = profile?.full_name?.split(" ")[0] || "U";

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RatLoader size={64} /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Mi Perfil</h1>
      <p className="text-muted mb-8">Edita tu informacion personal</p>

      <div className="max-w-xl space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-primary/30 bg-card-bg">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center">
                  <span className="text-4xl font-black text-black">{displayName.charAt(0)}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full gradient-primary flex items-center justify-center border-2 border-background hover:opacity-90 transition-opacity"
            >
              {uploadingAvatar ? <Loader2 className="h-4 w-4 text-black animate-spin" /> : <Camera className="h-4 w-4 text-black" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <p className="text-xs text-muted mt-3">Toca el icono para cambiar tu foto</p>
        </div>

        {/* Personal Info */}
        <div className="card-premium rounded-2xl p-6">
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
          <div className="card-premium rounded-2xl p-6">
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
          <div className="card-premium rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Datos de mi Encuesta</h2>
              {!editingSurvey && (
                <button
                  onClick={() => {
                    setSurveyForm({
                      weight: survey.weight,
                      height: survey.height,
                      age: survey.age,
                      activity_level: survey.activity_level,
                      dietary_restrictions: survey.dietary_restrictions || [],
                      training_days: survey.training_days ?? 5,
                      wake_hour: survey.wake_hour ?? 7,
                      sleep_hour: survey.sleep_hour ?? 23,
                      emphasis: survey.emphasis ?? "ninguno",
                    });
                    setEditingSurvey(true);
                    setSurveySuccess(false);
                  }}
                  className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80 transition-opacity"
                >
                  <Pencil className="h-4 w-4" /> Actualizar Encuesta
                </button>
              )}
            </div>

            {surveySuccess && (
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-4 text-sm text-primary font-medium">
                Encuesta actualizada, tu plan se esta regenerando
              </div>
            )}

            {!editingSurvey ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-card-bg rounded-xl p-3">
                  <p className="text-xs text-muted">Edad</p>
                  <p className="font-bold">{survey.age} anos</p>
                </div>
                <div className="bg-card-bg rounded-xl p-3">
                  <p className="text-xs text-muted">Sexo</p>
                  <p className="font-bold capitalize">{survey.sex}</p>
                </div>
                <div className="bg-card-bg rounded-xl p-3">
                  <p className="text-xs text-muted">Peso</p>
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
                <div className="bg-card-bg rounded-xl p-3">
                  <p className="text-xs text-muted">Dias de entrenamiento</p>
                  <p className="font-bold">{survey.training_days ?? 5} dias/sem</p>
                </div>
                <div className="bg-card-bg rounded-xl p-3">
                  <p className="text-xs text-muted">Enfasis</p>
                  <p className="font-bold capitalize">{EMPHASIS_OPTIONS.find(e => e.value === survey.emphasis)?.label || "Equilibrado"}</p>
                </div>
                <div className="bg-card-bg rounded-xl p-3">
                  <p className="text-xs text-muted">Despertar</p>
                  <p className="font-bold">{survey.wake_hour ?? 7}:00</p>
                </div>
                <div className="bg-card-bg rounded-xl p-3">
                  <p className="text-xs text-muted">Dormir</p>
                  <p className="font-bold">{survey.sleep_hour ?? 23}:00</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">Peso (kg)</label>
                    <input type="number" value={surveyForm.weight || ""} onChange={(e) => setSurveyForm({ ...surveyForm, weight: Number(e.target.value) })}
                      className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Altura (cm)</label>
                    <input type="number" value={surveyForm.height || ""} onChange={(e) => setSurveyForm({ ...surveyForm, height: Number(e.target.value) })}
                      className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Edad</label>
                    <input type="number" value={surveyForm.age || ""} onChange={(e) => setSurveyForm({ ...surveyForm, age: Number(e.target.value) })}
                      className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Dias entrenamiento/sem</label>
                    <input type="number" min={1} max={7} value={surveyForm.training_days || ""} onChange={(e) => setSurveyForm({ ...surveyForm, training_days: Number(e.target.value) })}
                      className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Hora despertar</label>
                    <input type="number" min={0} max={23} value={surveyForm.wake_hour ?? ""} onChange={(e) => setSurveyForm({ ...surveyForm, wake_hour: Number(e.target.value) })}
                      className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Hora dormir</label>
                    <input type="number" min={0} max={23} value={surveyForm.sleep_hour ?? ""} onChange={(e) => setSurveyForm({ ...surveyForm, sleep_hour: Number(e.target.value) })}
                      className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1">Nivel de actividad</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ACTIVITY_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => setSurveyForm({ ...surveyForm, activity_level: opt.value })}
                        className={`text-left p-3 rounded-xl border transition-all text-sm ${surveyForm.activity_level === opt.value ? "border-primary bg-primary/5 font-medium" : "border-card-border hover:border-muted"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1">Enfasis</label>
                  <div className="grid grid-cols-3 gap-2">
                    {EMPHASIS_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => setSurveyForm({ ...surveyForm, emphasis: opt.value })}
                        className={`text-left p-2.5 rounded-xl border transition-all text-sm ${surveyForm.emphasis === opt.value ? "border-primary bg-primary/5 font-medium" : "border-card-border hover:border-muted"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1">Restricciones dietéticas</label>
                  <div className="flex flex-wrap gap-2">
                    {RESTRICTIONS.map((r) => (
                      <button key={r}
                        onClick={() => {
                          const current = surveyForm.dietary_restrictions || [];
                          if (r === "Ninguna") {
                            setSurveyForm({ ...surveyForm, dietary_restrictions: ["Ninguna"] });
                          } else {
                            const without = current.filter((x) => x !== "Ninguna");
                            setSurveyForm({
                              ...surveyForm,
                              dietary_restrictions: without.includes(r) ? without.filter((x) => x !== r) : [...without, r],
                            });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                          (surveyForm.dietary_restrictions || []).includes(r)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-card-border hover:border-muted"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditingSurvey(false)}
                    className="flex-1 border border-card-border text-muted font-bold py-3 rounded-xl hover:bg-card-bg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (!user) return;
                      setSavingSurvey(true);
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        const res = await fetch("/api/encuesta", {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${session?.access_token}`,
                          },
                          body: JSON.stringify({
                            weight: surveyForm.weight,
                            height: surveyForm.height,
                            age: surveyForm.age,
                            activity_level: surveyForm.activity_level,
                            dietary_restrictions: surveyForm.dietary_restrictions,
                            training_days: surveyForm.training_days,
                            wake_hour: surveyForm.wake_hour,
                            sleep_hour: surveyForm.sleep_hour,
                            emphasis: surveyForm.emphasis,
                          }),
                        });
                        if (res.ok) {
                          setSurvey({ ...survey, ...surveyForm } as SurveyData);
                          setEditingSurvey(false);
                          setSurveySuccess(true);
                          setTimeout(() => setSurveySuccess(false), 5000);
                        }
                      } catch (e) {
                        console.error("Error updating survey:", e);
                      } finally {
                        setSavingSurvey(false);
                      }
                    }}
                    disabled={savingSurvey}
                    className="flex-1 gradient-primary text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingSurvey ? (<><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>) : (<><Save className="h-4 w-4" /> Guardar Cambios</>)}
                  </button>
                </div>
              </div>
            )}
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
