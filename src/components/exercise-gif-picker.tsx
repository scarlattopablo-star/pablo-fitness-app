"use client";

import { useState } from "react";
import { Search, X, Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { invalidateExerciseGifsCache } from "@/lib/custom-exercise-gifs";

interface Result {
  externalId: string;
  name: string;
  gifUrl: string;
  bodyPart: string | null;
  equipment: string | null;
}

interface Props {
  exerciseId: string;       // id en nuestro catalogo local
  exerciseName: string;     // nombre sugerido para la busqueda
  onAdopted?: (url: string) => void;
}

// Modal que busca GIFs en ExerciseDB y permite al admin adoptar uno
// para un ejercicio concreto del catalogo.
export default function ExerciseGifPicker({ exerciseId, exerciseName, onAdopted }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(exerciseName);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [adopting, setAdopting] = useState<string>("");
  const [error, setError] = useState("");

  const doSearch = async () => {
    if (query.trim().length < 2) return;
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sesion expirada");
      const res = await fetch("/api/admin/exercise-gif/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: query }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setResults(body.results || []);
      if (!body.results?.length) setError("Sin resultados. Probá con otro nombre.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const adopt = async (gifUrl: string) => {
    setAdopting(gifUrl);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sesion expirada");
      const res = await fetch("/api/admin/exercise-gif/set", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ exerciseId, gifUrl, source: "exercisedb" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      invalidateExerciseGifsCache();
      onAdopted?.(gifUrl);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAdopting("");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); setQuery(exerciseName); }}
        className="text-[10px] px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors inline-flex items-center gap-1"
        title="Buscar GIF para este ejercicio"
      >
        <Search className="h-3 w-3" /> GIF
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card-bg border border-card-border rounded-2xl p-5 max-w-3xl w-full max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">Buscar GIF</h3>
                <p className="text-xs text-muted mt-0.5">Para: <strong>{exerciseName}</strong></p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder="Nombre del ejercicio (en español o inglés)"
                className="flex-1 bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                autoFocus
              />
              <button
                onClick={doSearch}
                disabled={loading || query.trim().length < 2}
                className="btn-shimmer px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </button>
            </div>

            {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

            {results.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {results.map((r) => (
                  <button
                    key={r.externalId}
                    onClick={() => adopt(r.gifUrl)}
                    disabled={adopting === r.gifUrl}
                    className="group relative bg-background rounded-xl border border-card-border hover:border-primary transition-all overflow-hidden text-left disabled:opacity-50"
                  >
                    <div className="aspect-square bg-card-bg flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.gifUrl} alt={r.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-bold leading-tight line-clamp-2">{r.name}</p>
                      <p className="text-[10px] text-muted mt-1">
                        {r.bodyPart || "-"}{r.equipment ? ` · ${r.equipment}` : ""}
                      </p>
                    </div>
                    {adopting === r.gifUrl && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check className="h-3 w-3" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && !results.length && !error && (
              <p className="text-xs text-muted text-center py-8">
                Ingresá un nombre y tocá buscar. Vas a ver hasta 8 opciones — click en una para fijarla.
              </p>
            )}

            <p className="text-[10px] text-muted mt-4 text-center">
              Fuente: <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener noreferrer" className="underline">free-exercise-db</a> · Las URLs quedan guardadas en tu DB, no dependés del servicio externo despues de adoptarlas.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
