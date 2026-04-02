"use client";

import { useState, useEffect } from "react";
import {
  Camera, Plus, TrendingDown, Scale, Ruler,
  Calendar, X, Check, Loader2, Image,
} from "lucide-react";
import { uploadProgressPhoto, getPhotoUrl } from "@/lib/upload-photo";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { SubscriptionExpiredBanner } from "@/components/subscription-expired";
import { calculateMacros } from "@/lib/harris-benedict";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import type { Sex, ActivityLevel } from "@/types";

interface ProgressEntry {
  id: string;
  date: string;
  weight: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arms: number | null;
  legs: number | null;
  photo_front: string | null;
  photo_side: string | null;
  photo_back: string | null;
  notes: string | null;
}

interface SurveyBaseline {
  weight: number;
  created_at: string;
}

export default function ProgresoPage() {
  const { user, isExpired } = useAuth();
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [baseline, setBaseline] = useState<SurveyBaseline | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [weight, setWeight] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [arms, setArms] = useState("");
  const [legs, setLegs] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFront, setPhotoFront] = useState<File | null>(null);
  const [photoSide, setPhotoSide] = useState<File | null>(null);
  const [photoBack, setPhotoBack] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [planUpdated, setPlanUpdated] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load survey baseline (initial weight)
    const { data: surveyData } = await supabase
      .from("surveys")
      .select("weight, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (surveyData) setBaseline(surveyData);

    // Load all progress entries
    const { data: progressData } = await supabase
      .from("progress_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (progressData) {
      setEntries(progressData);
      // Load photo URLs for entries that have photos
      const paths = progressData.flatMap((e: ProgressEntry) =>
        [e.photo_front, e.photo_side, e.photo_back].filter(Boolean) as string[]
      );
      if (paths.length > 0) {
        const urls: Record<string, string> = {};
        await Promise.all(
          paths.map(async (path) => {
            const url = await getPhotoUrl(path);
            if (url) urls[path] = url;
          })
        );
        setPhotoUrls(urls);
      }
    }
    setLoading(false);
  };

  const latest = entries.find(e => e.weight) || null;
  const currentWeight = latest?.weight || baseline?.weight || null;
  const initialWeight = baseline?.weight || null;
  const totalWeightLost = initialWeight && currentWeight ? Number((initialWeight - currentWeight).toFixed(1)) : null;

  const firstWaist = entries.length > 0 ? [...entries].reverse().find(e => e.waist)?.waist : null;
  const latestWaist = entries.find(e => e.waist)?.waist || null;
  const totalWaistLost = firstWaist && latestWaist ? Number((firstWaist - latestWaist).toFixed(1)) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUploading(true);

    try {
      const frontUrl = photoFront ? await uploadProgressPhoto(photoFront, user.id, "front") : null;
      const sideUrl = photoSide ? await uploadProgressPhoto(photoSide, user.id, "side") : null;
      const backUrl = photoBack ? await uploadProgressPhoto(photoBack, user.id, "back") : null;

      await supabase.from("progress_entries").insert({
        user_id: user.id,
        weight: weight ? Number(weight) : null,
        chest: chest ? Number(chest) : null,
        waist: waist ? Number(waist) : null,
        hips: hips ? Number(hips) : null,
        arms: arms ? Number(arms) : null,
        legs: legs ? Number(legs) : null,
        photo_front: frontUrl,
        photo_side: sideUrl,
        photo_back: backUrl,
        notes: notes || null,
      });

      // Recalculate macros if weight changed
      if (weight) {
        const { data: survey } = await supabase
          .from("surveys")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (survey) {
          const newMacros = calculateMacros(
            survey.sex as Sex,
            Number(weight),
            survey.height,
            survey.age,
            survey.activity_level as ActivityLevel,
            survey.objective || "quema-grasa"
          );

          await supabase.from("surveys")
            .update({
              weight: Number(weight),
              tmb: newMacros.tmb,
              tdee: newMacros.tdee,
              target_calories: newMacros.targetCalories,
              protein: newMacros.protein,
              carbs: newMacros.carbs,
              fats: newMacros.fats,
            })
            .eq("id", survey.id);

          setPlanUpdated(true);
        }
      }

      setUploadSuccess(true);
      setTimeout(() => {
        setShowForm(false);
        setUploadSuccess(false);
        setPhotoFront(null); setPhotoSide(null); setPhotoBack(null);
        setWeight(""); setChest(""); setWaist(""); setHips(""); setArms(""); setLegs(""); setNotes("");
        loadData();
      }, 1500);
    } catch (err) {
      console.error("Error saving progress:", err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isExpired) return <SubscriptionExpiredBanner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Mi Progreso</h1>
          <p className="text-muted text-sm">Segui tu transformacion</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="gradient-primary text-black font-semibold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Registrar
        </button>
      </div>

      {/* Plan Updated Notification */}
      {planUpdated && (
        <div className="rounded-2xl p-4 mb-6 flex items-center gap-3 border border-primary/25 bg-primary/5">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Check className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-primary">Tu plan fue actualizado</p>
            <p className="text-xs text-muted">Tu plan de nutricion y entrenamiento se actualizo con tus nuevos datos.</p>
          </div>
          <button onClick={() => setPlanUpdated(false)} className="text-muted hover:text-white shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4">
          <Scale className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">{currentWeight || "-"}<span className="text-sm text-muted">kg</span></p>
          <p className="text-xs text-muted">Peso actual</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <TrendingDown className="h-5 w-5 text-primary mb-2" />
          <p className={`text-2xl font-black ${totalWeightLost && totalWeightLost > 0 ? "text-primary" : ""}`}>
            {totalWeightLost !== null ? `${totalWeightLost > 0 ? "-" : "+"}${Math.abs(totalWeightLost)}` : "-"}<span className="text-sm text-muted">kg</span>
          </p>
          <p className="text-xs text-muted">Total perdido</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <Ruler className="h-5 w-5 text-primary mb-2" />
          <p className={`text-2xl font-black ${totalWaistLost && totalWaistLost > 0 ? "text-primary" : ""}`}>
            {totalWaistLost !== null ? `${totalWaistLost > 0 ? "-" : "+"}${Math.abs(totalWaistLost)}` : "-"}<span className="text-sm text-muted">cm</span>
          </p>
          <p className="text-xs text-muted">Cintura perdida</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <Calendar className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">{entries.length}</p>
          <p className="text-xs text-muted">Registros</p>
        </div>
      </div>

      {/* Weight Chart */}
      {entries.filter(e => e.weight).length > 0 ? (() => {
        const weightData = [...entries].filter(e => e.weight).reverse().map(e => ({
          date: new Date(e.date).toLocaleDateString("es", { day: "2-digit", month: "short" }),
          peso: e.weight,
        }));
        return (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h2 className="font-bold mb-4">Evolucion de Peso</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: "#888" }} width={40} />
                <Tooltip
                  contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  labelStyle={{ color: "#888" }}
                  itemStyle={{ color: "#00f593" }}
                  formatter={(value) => [`${value} kg`, "Peso"]}
                />
                <Line type="monotone" dataKey="peso" stroke="#00f593" strokeWidth={2} dot={{ fill: "#00f593", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })() : (
        <div className="glass-card rounded-2xl p-6 mb-6 text-center">
          <Scale className="h-8 w-8 text-muted mx-auto mb-2" />
          <p className="text-muted text-sm">Aun no hay registros de peso.</p>
          <p className="text-xs text-muted mt-1">Registra tu primer progreso para ver el grafico.</p>
        </div>
      )}

      {/* Body Measurements Chart */}
      {(() => {
        const measurementData = [...entries].reverse()
          .filter(e => e.waist || e.chest || e.hips || e.arms || e.legs)
          .map(e => ({
            date: new Date(e.date).toLocaleDateString("es", { day: "2-digit", month: "short" }),
            cintura: e.waist,
            pecho: e.chest,
            cadera: e.hips,
            brazos: e.arms,
            piernas: e.legs,
          }));
        if (measurementData.length < 2) return null;
        return (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h2 className="font-bold mb-4">Medidas Corporales</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={measurementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} width={40} />
                <Tooltip
                  contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  labelStyle={{ color: "#888" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="cintura" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="pecho" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="cadera" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="brazos" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="piernas" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {/* Progress Photos: Before / After */}
      {(() => {
        const entriesWithPhotos = entries.filter(e => e.photo_front || e.photo_side || e.photo_back);
        if (entriesWithPhotos.length === 0) return null;
        const first = entriesWithPhotos[entriesWithPhotos.length - 1];
        const latest = entriesWithPhotos.length > 1 ? entriesWithPhotos[0] : null;
        return (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              {latest ? "Antes / Despues" : "Fotos de Progreso"}
            </h2>
            <div className={`grid ${latest ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
              <div>
                <p className="text-xs text-muted mb-2 text-center">
                  {latest ? "Inicio" : ""} — {new Date(first.date).toLocaleDateString("es", { day: "numeric", month: "short" })}
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {[first.photo_front, first.photo_side, first.photo_back].map((path, i) => (
                    <div key={i} className="aspect-[3/4] rounded-lg bg-card-bg overflow-hidden">
                      {path && photoUrls[path] ? (
                        <img src={photoUrls[path]} alt={["Frente", "Perfil", "Espalda"][i]} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="h-4 w-4 text-muted" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {latest && (
                <div>
                  <p className="text-xs text-muted mb-2 text-center">
                    Actual — {new Date(latest.date).toLocaleDateString("es", { day: "numeric", month: "short" })}
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    {[latest.photo_front, latest.photo_side, latest.photo_back].map((path, i) => (
                      <div key={i} className="aspect-[3/4] rounded-lg bg-card-bg overflow-hidden">
                        {path && photoUrls[path] ? (
                          <img src={photoUrls[path]} alt={["Frente", "Perfil", "Espalda"][i]} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Camera className="h-4 w-4 text-muted" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* History */}
      <h2 className="font-bold text-lg mb-3">Historial</h2>
      {entries.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center">
          <Calendar className="h-8 w-8 text-muted mx-auto mb-2" />
          <p className="text-muted text-sm">Sin registros todavia.</p>
          <button onClick={() => setShowForm(true)} className="text-primary text-sm font-semibold mt-2 hover:underline">
            Registrar mi primer progreso
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const prev = entries[i + 1];
            const diff = prev?.weight && entry.weight ? Number((entry.weight - prev.weight).toFixed(1)) : 0;
            return (
              <div key={entry.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {new Date(entry.date).toLocaleDateString("es", { day: "numeric", month: "long" })}
                  </p>
                  <p className="text-sm text-muted">
                    {[
                      entry.waist ? `Cintura: ${entry.waist}cm` : null,
                      entry.chest ? `Pecho: ${entry.chest}cm` : null,
                      entry.hips ? `Cadera: ${entry.hips}cm` : null,
                      entry.arms ? `Brazos: ${entry.arms}cm` : null,
                    ].filter(Boolean).join(" | ") || "Sin medidas"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{entry.weight ? `${entry.weight}kg` : "-"}</p>
                  {diff !== 0 && (
                    <p className={`text-xs font-bold ${diff < 0 ? "text-primary" : "text-danger"}`}>
                      {diff > 0 ? "+" : ""}{diff}kg
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Progress Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowForm(false)}>
          <div className="glass-card rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Registrar Progreso</h3>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-muted">Todos los campos son opcionales. Completa lo que puedas.</p>

              <div>
                <label className="block text-sm font-medium mb-1">Peso (kg)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} step={0.1} placeholder="Ej: 82.5"
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Pecho (cm)", value: chest, setter: setChest },
                  { label: "Cintura (cm)", value: waist, setter: setWaist },
                  { label: "Cadera (cm)", value: hips, setter: setHips },
                  { label: "Brazos (cm)", value: arms, setter: setArms },
                  { label: "Piernas (cm)", value: legs, setter: setLegs },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="block text-sm font-medium mb-1">{field.label}</label>
                    <input type="number" value={field.value} onChange={(e) => field.setter(e.target.value)} step={0.1}
                      className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fotos (frente, perfil, espalda)</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { label: "Frente", file: photoFront, setter: setPhotoFront },
                    { label: "Perfil", file: photoSide, setter: setPhotoSide },
                    { label: "Espalda", file: photoBack, setter: setPhotoBack },
                  ] as const).map((item) => (
                    <label key={item.label} className="aspect-[3/4] border-2 border-dashed border-card-border rounded-xl flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors cursor-pointer overflow-hidden relative">
                      {item.file ? (
                        <>
                          <img src={URL.createObjectURL(item.file)} alt={item.label} className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Check className="h-6 w-6 text-primary" />
                          </div>
                        </>
                      ) : (
                        <>
                          <Camera className="h-6 w-6 text-muted" />
                          <span className="text-xs text-muted">{item.label}</span>
                          <span className="text-[10px] text-primary">Subir</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) item.setter(f); }} />
                    </label>
                  ))}
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 mt-2">
                  <p className="text-[11px] text-primary">Tus fotos son privadas. Solo vos y tu entrenador pueden verlas.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Como te sentiste?"
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none" />
              </div>

              <button type="submit" disabled={uploading}
                className="w-full gradient-primary text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {uploadSuccess ? (<><Check className="h-5 w-5" /> Guardado!</>) :
                 uploading ? (<><Loader2 className="h-5 w-5 animate-spin" /> Subiendo...</>) :
                 "Guardar Progreso"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
