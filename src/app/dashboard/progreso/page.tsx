"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Camera, Plus, TrendingDown, Scale, Ruler,
  Calendar, Upload, X, ArrowRight, Check, Loader2,
} from "lucide-react";
import { uploadProgressPhoto } from "@/lib/upload-photo";
import { useAuth } from "@/lib/auth-context";

const MOCK_PROGRESS = [
  { date: "2026-03-28", weight: 82, chest: 100, waist: 85, hips: 95 },
  { date: "2026-03-21", weight: 83, chest: 100, waist: 86, hips: 96 },
  { date: "2026-03-14", weight: 84, chest: 101, waist: 87, hips: 96 },
  { date: "2026-03-07", weight: 85, chest: 101, waist: 88, hips: 97 },
  { date: "2026-03-01", weight: 88, chest: 102, waist: 90, hips: 98 },
];

export default function ProgresoPage() {
  const { user } = useAuth();
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

  const latest = MOCK_PROGRESS[0];
  const oldest = MOCK_PROGRESS[MOCK_PROGRESS.length - 1];
  const totalWeightLost = oldest.weight - latest.weight;
  const totalWaistLost = oldest.waist - latest.waist;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUploading(true);

    try {
      // Upload photos if provided
      const frontUrl = photoFront ? await uploadProgressPhoto(photoFront, user.id, "front") : null;
      const sideUrl = photoSide ? await uploadProgressPhoto(photoSide, user.id, "side") : null;
      const backUrl = photoBack ? await uploadProgressPhoto(photoBack, user.id, "back") : null;

      // TODO: Save progress entry to Supabase with photo URLs
      console.log("Progress saved:", {
        weight, chest, waist, hips, arms, notes,
        photos: { front: frontUrl, side: sideUrl, back: backUrl },
      });

      setUploadSuccess(true);
      setTimeout(() => {
        setShowForm(false);
        setUploadSuccess(false);
        setPhotoFront(null);
        setPhotoSide(null);
        setPhotoBack(null);
        setWeight(""); setChest(""); setWaist(""); setHips(""); setArms(""); setNotes("");
      }, 2000);
    } catch (err) {
      console.error("Error saving progress:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Mi Progreso</h1>
          <p className="text-muted">Seguí tu transformación</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="gradient-primary text-black font-semibold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Registrar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-5">
          <Scale className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">{latest.weight}kg</p>
          <p className="text-xs text-muted">Peso actual</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <TrendingDown className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black text-primary">-{totalWeightLost}kg</p>
          <p className="text-xs text-muted">Total perdido</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <Ruler className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black text-primary">-{totalWaistLost}cm</p>
          <p className="text-xs text-muted">Cintura perdida</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <Calendar className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">{MOCK_PROGRESS.length}</p>
          <p className="text-xs text-muted">Registros</p>
        </div>
      </div>

      {/* Weight Chart Visual */}
      <div className="glass-card rounded-2xl p-6 mb-8">
        <h2 className="font-bold mb-4">Evolución de Peso</h2>
        <div className="flex items-end gap-2 h-40">
          {[...MOCK_PROGRESS].reverse().map((entry, i) => {
            const minW = Math.min(...MOCK_PROGRESS.map(p => p.weight));
            const maxW = Math.max(...MOCK_PROGRESS.map(p => p.weight));
            const range = maxW - minW || 1;
            const height = ((entry.weight - minW) / range) * 100 + 20;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold">{entry.weight}</span>
                <div
                  className="w-full rounded-t-lg gradient-primary"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-muted">
                  {new Date(entry.date).toLocaleDateString("es", { day: "2-digit", month: "short" })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Photos Section */}
      <div className="glass-card rounded-2xl p-6 mb-8">
        <h2 className="font-bold mb-4">Fotos de Progreso</h2>
        <div className="grid grid-cols-3 gap-4">
          {["Frente", "Lateral", "Espalda"].map((view) => (
            <div
              key={view}
              className="aspect-[3/4] bg-card-bg border-2 border-dashed border-card-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer"
            >
              <Camera className="h-8 w-8 text-muted" />
              <span className="text-xs text-muted">{view}</span>
              <span className="text-[10px] text-primary">Subir foto</span>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <h2 className="font-bold text-lg mb-4">Historial</h2>
      <div className="space-y-2">
        {MOCK_PROGRESS.map((entry, i) => {
          const prev = MOCK_PROGRESS[i + 1];
          const diff = prev ? entry.weight - prev.weight : 0;
          return (
            <div key={entry.date} className="glass-card rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {new Date(entry.date).toLocaleDateString("es", { day: "numeric", month: "long" })}
                </p>
                <p className="text-sm text-muted">
                  Cintura: {entry.waist}cm | Pecho: {entry.chest}cm
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{entry.weight}kg</p>
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

      {/* Add Progress Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowForm(false)}>
          <div className="glass-card rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Registrar Progreso</h3>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-muted mb-2">Todos los campos son opcionales. Completá lo que puedas.</p>

              <div>
                <label className="block text-sm font-medium mb-1">Peso (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  step={0.1}
                  placeholder="Ej: 82.5"
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Pecho (cm)</label>
                  <input type="number" value={chest} onChange={(e) => setChest(e.target.value)}
                    className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cintura (cm)</label>
                  <input type="number" value={waist} onChange={(e) => setWaist(e.target.value)}
                    className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cadera (cm)</label>
                  <input type="number" value={hips} onChange={(e) => setHips(e.target.value)}
                    className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Brazos (cm)</label>
                  <input type="number" value={arms} onChange={(e) => setArms(e.target.value)}
                    className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                </div>
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
                          <img
                            src={URL.createObjectURL(item.file)}
                            alt={item.label}
                            className="absolute inset-0 w-full h-full object-cover rounded-xl"
                          />
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
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) item.setter(f);
                        }}
                      />
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted mt-1">Cuerpo entero, opcional. Podés usar cámara o galería.</p>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 mt-2">
                  <p className="text-[11px] text-primary">
                    🔒 Tus fotos son privadas. Solo vos y tu entrenador pueden verlas. No se comparten ni se publican en ningún lado.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="¿Cómo te sentiste esta semana?"
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full gradient-primary text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploadSuccess ? (
                  <><Check className="h-5 w-5" /> Guardado!</>
                ) : uploading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Subiendo fotos...</>
                ) : (
                  "Guardar Progreso"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
