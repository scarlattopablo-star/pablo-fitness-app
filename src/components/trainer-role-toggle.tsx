"use client";

import { useState, useEffect } from "react";
import { UserCog, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

/** Boton del admin para activar/quitar el rol de entrenador suplente a un usuario. */
export default function TrainerRoleToggle({ userId }: { userId: string }) {
  const [isTrainer, setIsTrainer] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch(`/api/admin/trainers?userId=${userId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setIsTrainer((await res.json()).isTrainer);
    })();
  }, [userId]);

  const toggle = async () => {
    if (isTrainer === null) return;
    const next = !isTrainer;
    const msg = next
      ? "¿Hacer a este usuario entrenador suplente? Va a poder ver a tus clientes personalizados y cargarles pesos/reps al entrenarlos (no puede editar planes ni dietas)."
      : "¿Quitarle el rol de entrenador suplente?";
    if (!confirm(msg)) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/trainers", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ userId, isTrainer: next }),
    });
    if (res.ok) setIsTrainer(next);
    else alert((await res.json().catch(() => ({}))).error || "Error cambiando el rol");
    setSaving(false);
  };

  if (isTrainer === null) return null;

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`inline-flex items-center gap-2 font-semibold text-sm px-4 py-2 rounded-xl transition-colors disabled:opacity-50 ${
        isTrainer
          ? "bg-accent/15 text-accent hover:bg-accent/25"
          : "bg-white/5 text-muted hover:text-white hover:bg-white/10"
      }`}
    >
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />}
      {isTrainer ? "Entrenador suplente ✓" : "Hacer entrenador suplente"}
    </button>
  );
}
