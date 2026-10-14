"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserCog, Mail, Phone, MessageCircle, Clock, CheckCircle2, XCircle, Eye } from "lucide-react";
import { RatLoader } from "@/components/rat-loader";
import { supabase } from "@/lib/supabase";
import TrainerInviteButton from "@/components/trainer-invite-modal";

interface Trainer {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  since: string;
}

interface Invite {
  token: string;
  invitee_name: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

const fmt = (d: string) => new Date(d).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });

// Equipo: entrenadores suplentes activos + estado de las invitaciones.
export default function EquipoAdminPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { Authorization: `Bearer ${session?.access_token}` };
      const [tRes, iRes] = await Promise.all([
        fetch("/api/admin/trainers", { headers }),
        fetch("/api/admin/trainer-invites", { headers }),
      ]);
      if (cancelled) return;
      if (tRes.ok) setTrainers((await tRes.json()).trainers || []);
      if (iRes.ok) setInvites((await iRes.json()).invites || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const removeTrainer = async (t: Trainer) => {
    if (!confirm(`¿Quitarle el acceso de entrenador a ${t.full_name || t.email}? Su cuenta sigue existiendo, pero ya no ve a tus clientes.`)) return;
    setRemoving(t.id);
    const { data: { session } } = await supabase.auth.getSession();
    await fetch("/api/admin/trainers", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ userId: t.id, isTrainer: false }),
    });
    setRemoving(null);
    setReloadKey((k) => k + 1);
  };

  const now = new Date();
  const pending = invites.filter((i) => !i.used_at);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black mb-2">Equipo</h1>
          <p className="text-muted">Entrenadores que pueden ver y entrenar a tus clientes personalizados</p>
        </div>
        <TrainerInviteButton />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><RatLoader size={64} /></div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <UserCog className="h-5 w-5 text-accent" /> Activos
              <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold">{trainers.length}</span>
            </h2>
            {trainers.length === 0 ? (
              <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted">
                Todavia nadie acepto una invitacion. Cuando lo hagan, aparecen aca.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {trainers.map((t) => {
                  const digits = String(t.phone || "").replace(/[^0-9]/g, "");
                  return (
                    <div key={t.id} className="glass-card rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                          <span className="font-bold text-accent">{(t.full_name || t.email || "?")[0].toUpperCase()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold truncate">{t.full_name || "Sin nombre"}</p>
                          <p className="text-[11px] text-muted">En el equipo desde {fmt(t.since)}</p>
                        </div>
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Activa</span>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        {t.email && <a href={`mailto:${t.email}`} className="flex items-center gap-2 text-muted hover:text-white"><Mail className="h-4 w-4" /> {t.email}</a>}
                        {t.phone && <a href={`tel:${t.phone}`} className="flex items-center gap-2 text-muted hover:text-white"><Phone className="h-4 w-4" /> {t.phone}</a>}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Link href={`/admin/clientes/${t.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10">
                          <Eye className="h-3.5 w-3.5" /> Ver ficha
                        </Link>
                        {digits && (
                          <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
                            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                          </a>
                        )}
                        <button onClick={() => removeTrainer(t)} disabled={removing === t.id}
                          className="ml-auto text-xs font-semibold px-3 py-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 disabled:opacity-50">
                          {removing === t.id ? "Quitando..." : "Quitar acceso"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">Invitaciones</h2>
            {invites.length === 0 ? (
              <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted">No enviaste invitaciones todavia</div>
            ) : (
              <div className="glass-card rounded-2xl divide-y divide-card-border/50 overflow-hidden">
                {invites.map((i) => {
                  const expired = !i.used_at && new Date(i.expires_at) < now;
                  return (
                    <div key={i.token} className="flex items-center gap-3 p-4">
                      {i.used_at ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        : expired ? <XCircle className="h-5 w-5 text-muted shrink-0" />
                        : <Clock className="h-5 w-5 text-accent shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{i.invitee_name}</p>
                        <p className="text-[11px] text-muted">
                          {i.used_at ? `Aceptada el ${fmt(i.used_at)}`
                            : expired ? `Vencio el ${fmt(i.expires_at)}`
                            : `Enviada el ${fmt(i.created_at)} · vence el ${fmt(i.expires_at)}`}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        i.used_at ? "bg-primary/10 text-primary" : expired ? "bg-white/5 text-muted" : "bg-accent/10 text-accent"}`}>
                        {i.used_at ? "Aceptada" : expired ? "Vencida" : "Pendiente"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {pending.length > 0 && (
              <p className="text-[11px] text-muted mt-2">Las pendientes pasan a &quot;Activos&quot; apenas la persona crea su cuenta desde el link.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
