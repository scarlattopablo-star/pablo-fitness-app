"use client";

import { useState } from "react";
import { UserPlus, X, Copy, Check, Loader2, ExternalLink, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

/** Boton + modal del admin para generar un link de invitacion de entrenador suplente. */
export default function TrainerInviteButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const reset = () => { setName(""); setMessage(""); setLink(""); setError(""); setCopied(false); };

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/trainer-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ name, message: message.trim() || null }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Error generando la invitacion");
      setLink(`${window.location.origin}/equipo?t=${body.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setBusy(false); }
  };

  const firstName = name.trim().split(" ")[0];
  const waText = `Hola ${firstName}! Te preparé el acceso a mi app para que entrenes a mis clientes personalizados. Entrá desde acá y en un minuto estás adentro 👇\n\n${link}`;

  return (
    <>
      <button onClick={() => { reset(); setOpen(true); }}
        className="inline-flex items-center gap-2 bg-accent/15 text-accent font-semibold text-sm px-4 py-3 rounded-xl hover:bg-accent/25 transition-colors">
        <UserPlus className="h-4 w-4" /> Invitar entrenador
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="glass-card w-full max-w-md rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black">Invitar entrenador suplente</h2>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {!link ? (
              <form onSubmit={generate} className="space-y-3">
                <p className="text-xs text-muted">
                  Genera un link personal (vence en 14 dias, se usa una sola vez). Al aceptarlo, crea su cuenta y queda como entrenador:
                  ve a tus clientes personalizados y su progreso, y carga las sesiones. No ve dietas ni puede editar planes.
                </p>
                <div>
                  <label className="mb-1 block text-xs text-muted">Nombre</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Sofia Martinez"
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-3 focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Mensaje personal (opcional)</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={500}
                    placeholder="Lo va a ver en la pagina de bienvenida, firmado por vos"
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none" />
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <button type="submit" disabled={busy || !name.trim()}
                  className="gradient-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-black disabled:opacity-50">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generar invitacion"}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-sm">Listo. Mandale este link a <strong>{firstName}</strong>:</p>
                <div className="break-all rounded-xl border border-card-border bg-background px-4 py-3 text-xs text-muted">{link}</div>
                <a href={`https://wa.me/?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-bold text-black hover:opacity-90">
                  <MessageCircle className="h-4 w-4" /> Enviar por WhatsApp
                </a>
                <div className="flex gap-2">
                  <button onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-card-border py-2.5 text-sm font-semibold hover:bg-white/5">
                    {copied ? <><Check className="h-4 w-4 text-primary" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar link</>}
                  </button>
                  <a href={link} target="_blank" rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-card-border py-2.5 text-sm font-semibold hover:bg-white/5">
                    <ExternalLink className="h-4 w-4" /> Ver como la ve
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
