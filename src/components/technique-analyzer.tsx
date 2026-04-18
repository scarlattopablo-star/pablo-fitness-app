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

export function TechniqueAnalyzer({ open, onClose, exerciseName }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "extracting" | "analyzing" | "done" | "error">("idle");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const waitForEvent = (el: HTMLVideoElement, event: string, timeout = 8000): Promise<void> =>
    new Promise((resolve) => {
      const t = setTimeout(resolve, timeout);
      el.addEventListener(event, function h() {
        clearTimeout(t);
        el.removeEventListener(event, h);
        resolve();
      });
    });

  const seekTo = (video: HTMLVideoElement, time: number): Promise<void> =>
    new Promise((resolve) => {
      const t = setTimeout(resolve, 3000);
      const h = () => { clearTimeout(t); video.removeEventListener("seeked", h); resolve(); };
      video.addEventListener("seeked", h);
      video.currentTime = time;
    });

  const handleFile = async (file: File) => {
    setError(null);
    setAnalysis(null);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setStatus("extracting");

    const video = videoRef.current;
    if (!video) { setStatus("error"); setError("Error al cargar el video"); return; }

    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.load();

    // Wait for metadata
    if (video.readyState < 1) await waitForEvent(video, "loadedmetadata");

    // iOS CRITICAL: play briefly so the decoder actually loads frames
    // Without this, canvas.drawImage() renders black on iOS
    try {
      // Race play() against a 2s timeout — some browsers never resolve the promise
      await Promise.race([
        video.play(),
        new Promise<void>(r => setTimeout(r, 2000)),
      ]);
      await new Promise(r => setTimeout(r, 400)); // let it decode a few frames
      video.pause();
    } catch {
      // Some browsers block autoplay even muted — that's OK, continue anyway
    }

    // Wait until enough data to seek
    if (video.readyState < 3) await waitForEvent(video, "canplay", 6000);

    const duration = video.duration;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) { setStatus("error"); setError("Error al procesar"); return; }

    // 480px width keeps file sizes small (~20-40KB each) for fast API response
    const W = 480;
    const aspect = (video.videoHeight > 0 && video.videoWidth > 0)
      ? video.videoHeight / video.videoWidth
      : 16 / 9;
    canvas.width = W;
    canvas.height = Math.round(W * aspect);

    const frames: string[] = [];

    if (!isFinite(duration) || duration <= 0) {
      // Can't seek — capture current frame (whatever the video shows now)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL("image/jpeg", 0.8));
    } else {
      // Max 3 frames keeps request size small and API fast (avoids Vercel timeout)
      const count = Math.min(3, Math.max(2, Math.floor(duration)));
      const timestamps = Array.from({ length: count }, (_, i) => ((i + 0.5) / count) * duration);
      for (const t of timestamps) {
        await seekTo(video, t);
        // Small delay after seek for iOS to actually render the frame
        await new Promise(r => setTimeout(r, 150));
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Quality 0.65 — good enough for technique analysis, ~20-40KB per frame
        frames.push(canvas.toDataURL("image/jpeg", 0.65));
      }
    }

    await analyzeFrames(frames);
  };

  const analyzeFrames = async (frames: string[]) => {
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

  const reset = () => { setVideoUrl(null); setAnalysis(null); setError(null); setStatus("idle"); };
  const scoreColor = (s: number) => s >= 8 ? "text-emerald-400" : s >= 5 ? "text-amber-400" : "text-red-400";

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
          {/* Video element — tiny visible pixel so iOS decodes properly */}
          <video
            ref={videoRef}
            className="absolute opacity-0 pointer-events-none"
            style={{ width: 1, height: 1 }}
            playsInline
            muted
            preload="auto"
          />

          {status === "idle" && (
            <label className="block w-full aspect-video rounded-xl border-2 border-dashed border-card-border hover:border-primary/50 cursor-pointer transition-all flex items-center justify-center">
              <input
                type="file"
                accept="video/*"
                capture="environment"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <div className="text-center p-6">
                <Video className="h-10 w-10 text-muted mx-auto mb-2" />
                <p className="font-semibold text-sm">Grabar o subir video</p>
                <p className="text-[10px] text-muted mt-1">5-15 seg · de frente o costado · cuerpo visible</p>
              </div>
            </label>
          )}

          {(status === "extracting" || status === "analyzing") && (
            <div className="py-10 text-center">
              <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold">
                {status === "extracting" ? "Procesando video..." : "Analizando tu técnica..."}
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
              {videoUrl && <video src={videoUrl} controls playsInline className="w-full rounded-lg mb-2" />}

              {analysis.score === 0 ? (
                <div className="text-center py-6">
                  <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-amber-400 mb-1">No se pudo evaluar bien</p>
                  <p className="text-xs text-muted mb-4">{analysis.summary}</p>
                  <p className="text-[10px] text-muted mb-4">
                    Consejos: grabá de costado, con buena luz, cuerpo completo visible, 5-15 segundos.
                  </p>
                  <button onClick={reset} className="text-xs text-primary underline">Intentar con otro video</button>
                </div>
              ) : (
                <>
                  <div className="card-premium rounded-xl p-4 text-center">
                    <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Puntaje técnica</p>
                    <p className={`text-5xl font-black ${scoreColor(analysis.score)}`}>
                      {analysis.score}<span className="text-xl text-muted">/10</span>
                    </p>
                    <p className="text-xs text-muted mt-2 italic">{analysis.summary}</p>
                  </div>

                  {analysis.positives?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Lo que está bien
                      </p>
                      <ul className="space-y-1">
                        {analysis.positives.map((p, i) => (
                          <li key={i} className="text-sm bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.corrections?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Corregí esto
                      </p>
                      <ul className="space-y-1">
                        {analysis.corrections.map((c, i) => (
                          <li key={i} className="text-sm bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

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

                  <button onClick={reset}
                    className="w-full mt-3 py-3 rounded-xl border border-card-border text-sm font-semibold hover:bg-card-bg inline-flex items-center justify-center gap-2">
                    <Upload className="h-4 w-4" /> Analizar otro video
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
