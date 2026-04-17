"use client";

import { useRef, useState } from "react";
import { X, Video, Loader2, Upload, Sparkles, CheckCircle, AlertTriangle, Lightbulb } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Analysis {
  score: number;
  summary: string;
  positives: string[];
  corrections: string[];
  cues: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  exerciseName: string;
}

/**
 * Modal that lets a user upload a short video of an exercise.
 * Extracts ~5 evenly-spaced frames client-side, sends to /api/analyze-technique,
 * and renders the AI feedback.
 */
export function TechniqueAnalyzer({ open, onClose, exerciseName }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "extracting" | "analyzing" | "done" | "error">("idle");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleFile = async (file: File) => {
    setError(null);
    setAnalysis(null);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setStatus("extracting");

    // Wait for video metadata to load
    await new Promise<void>((resolve) => {
      const v = videoRef.current;
      if (!v) return resolve();
      v.src = url;
      v.onloadedmetadata = () => resolve();
    });

    const video = videoRef.current;
    if (!video) { setStatus("error"); setError("No se pudo cargar el video"); return; }

    const duration = video.duration;
    if (!isFinite(duration) || duration <= 0) {
      setStatus("error"); setError("Video invalido"); return;
    }

    const framesCount = Math.min(5, Math.max(3, Math.floor(duration)));
    const timestamps = Array.from({ length: framesCount }, (_, i) => ((i + 1) / (framesCount + 1)) * duration);

    const canvas = document.createElement("canvas");
    const frames: string[] = [];
    const W = 512;
    const aspect = video.videoHeight / video.videoWidth || 16 / 9;
    canvas.width = W;
    canvas.height = Math.round(W * aspect);
    const ctx = canvas.getContext("2d");
    if (!ctx) { setStatus("error"); setError("No se pudo procesar"); return; }

    for (const t of timestamps) {
      await new Promise<void>((resolve) => {
        const onSeeked = () => { video.removeEventListener("seeked", onSeeked); resolve(); };
        video.addEventListener("seeked", onSeeked);
        video.currentTime = t;
      });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL("image/jpeg", 0.75));
    }

    setStatus("analyzing");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setStatus("error"); setError("No autenticado"); return; }

      const res = await fetch("/api/analyze-technique", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ exerciseName, frames }),
      });
      const data = await res.json();
      if (!res.ok || !data.analysis) {
        setStatus("error");
        setError(data.error || "Error en el analisis");
        return;
      }
      setAnalysis(data.analysis);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(String(err));
    }
  };

  const reset = () => {
    setVideoUrl(null);
    setAnalysis(null);
    setError(null);
    setStatus("idle");
  };

  const scoreColor = (s: number) =>
    s >= 8 ? "text-emerald-400" : s >= 5 ? "text-amber-400" : "text-red-400";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background border border-card-border rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-card-border sticky top-0 bg-background">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <div>
              <p className="font-bold text-sm">Analizar mi tecnica</p>
              <p className="text-[10px] text-muted">{exerciseName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-4">
          <video ref={videoRef} className="hidden" playsInline muted />

          {status === "idle" && (
            <label className="block w-full aspect-video rounded-xl border-2 border-dashed border-card-border hover:border-primary/50 cursor-pointer transition-all flex items-center justify-center">
              <input
                type="file"
                accept="video/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <div className="text-center p-6">
                <Video className="h-10 w-10 text-muted mx-auto mb-2" />
                <p className="font-semibold text-sm">Grabar o subir video</p>
                <p className="text-[10px] text-muted mt-1">3-10 segundos, de costado, cuerpo completo visible</p>
              </div>
            </label>
          )}

          {(status === "extracting" || status === "analyzing") && (
            <div className="py-10 text-center">
              <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold">
                {status === "extracting" ? "Procesando video..." : "Pablo esta analizando tu tecnica..."}
              </p>
              <p className="text-[10px] text-muted mt-1">Puede tardar hasta 20 segundos</p>
            </div>
          )}

          {status === "error" && (
            <div className="py-6 text-center">
              <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-400 mb-3">{error || "Error"}</p>
              <button onClick={reset} className="text-xs text-primary underline">Intentar de nuevo</button>
            </div>
          )}

          {status === "done" && analysis && (
            <div className="space-y-3">
              {videoUrl && (
                <video src={videoUrl} controls playsInline className="w-full rounded-lg mb-2" />
              )}

              {/* Score */}
              <div className="card-premium rounded-xl p-4 text-center">
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Puntaje tecnica</p>
                <p className={`text-5xl font-black ${scoreColor(analysis.score)}`}>
                  {analysis.score}<span className="text-xl text-muted">/10</span>
                </p>
                <p className="text-xs text-muted mt-2 italic">{analysis.summary}</p>
              </div>

              {/* Positives */}
              {analysis.positives?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Lo que esta bien
                  </p>
                  <ul className="space-y-1">
                    {analysis.positives.map((p, i) => (
                      <li key={i} className="text-sm bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Corrections */}
              {analysis.corrections?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Corregi esto
                  </p>
                  <ul className="space-y-1">
                    {analysis.corrections.map((c, i) => (
                      <li key={i} className="text-sm bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cues */}
              {analysis.cues?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" /> Cues mentales
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.cues.map((c, i) => (
                      <span key={i} className="text-xs bg-primary/10 border border-primary/20 rounded-full px-3 py-1">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={reset}
                className="w-full mt-3 py-3 rounded-xl border border-card-border text-sm font-semibold hover:bg-card-bg inline-flex items-center justify-center gap-2"
              >
                <Upload className="h-4 w-4" /> Analizar otro video
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
