// Helper para resolver el GIF de un ejercicio con fallback en cascada:
//   1) GIF local en /public/exercises/gifs/ (via exercise-images.ts)
//   2) GIF custom adoptado desde ExerciseDB (tabla custom_exercise_gifs)
//   3) undefined → la UI decide (placeholder, icono, etc.)

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getExerciseGif as getLocalGif } from "@/lib/exercise-images";

// Cache en memoria por sesion del usuario. Se llena al montar el hook.
let cache: Record<string, string> | null = null;
let loading: Promise<void> | null = null;

async function load(): Promise<void> {
  if (cache) return;
  if (loading) return loading;
  loading = (async () => {
    const { data } = await supabase
      .from("custom_exercise_gifs")
      .select("exercise_id, gif_url");
    cache = {};
    for (const r of data ?? []) cache[r.exercise_id] = r.gif_url;
  })();
  return loading;
}

/** Hook que devuelve un resolver sincronico a partir de los mappings ya cargados. */
export function useExerciseGifs(): (id: string) => string | undefined {
  const [, setTick] = useState(0);
  useEffect(() => {
    load().then(() => setTick((t) => t + 1));
  }, []);
  return (id: string) => getLocalGif(id) || (cache ? cache[id] : undefined);
}

/** Invalida el cache (llamar despues de adoptar un GIF nuevo desde el admin). */
export function invalidateExerciseGifsCache() {
  cache = null;
  loading = null;
}
