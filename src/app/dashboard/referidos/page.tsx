"use client";

import { useState, useEffect } from "react";
import { Gift, Copy, Check, Share2, Users, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export default function ReferidosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [totalReferred, setTotalReferred] = useState(0);
  const [totalDaysEarned, setTotalDaysEarned] = useState(0);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const res = await fetch("/api/referral", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReferralCode(data.referralCode || "");
      setReferralLink(data.referralLink || "");
      setTotalReferred(data.totalReferred || 0);
      setTotalDaysEarned(data.totalDaysEarned || 0);
      setReferrals(data.referrals || []);
      setLoading(false);
    }

    load();
  }, [user]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Pablo Scarlatto Entrenamientos",
          text: `Usa mi codigo ${referralCode} y obtene 15% de descuento en tu plan de entrenamiento personalizado!`,
          url: referralLink,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black mb-2">Invita Amigos</h1>
      <p className="text-muted mb-6 text-sm">
        Compartí tu codigo y gana 7 dias gratis por cada amigo que se sume.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5 text-center">
          <Users className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-black">{totalReferred}</p>
          <p className="text-xs text-muted">Amigos invitados</p>
        </div>
        <div className="glass-card rounded-2xl p-5 text-center">
          <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-black">+{totalDaysEarned}</p>
          <p className="text-xs text-muted">Dias ganados</p>
        </div>
      </div>

      {/* Referral code card */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="h-5 w-5 text-primary" />
          <p className="font-bold">Tu Codigo de Referido</p>
        </div>

        {/* Code display */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-card-bg border-2 border-dashed border-primary/30 rounded-xl px-5 py-4 text-center">
            <p className="text-2xl font-black tracking-widest text-primary">{referralCode}</p>
          </div>
          <button
            onClick={handleCopyCode}
            className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors shrink-0"
          >
            {copied ? <Check className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5 text-primary" />}
          </button>
        </div>

        {/* Link */}
        <div className="flex items-center gap-2 mb-4">
          <input
            value={referralLink}
            readOnly
            className="flex-1 bg-card-bg border border-card-border rounded-xl px-3 py-2 text-xs text-muted truncate"
          />
          <button
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-card-bg border border-card-border text-xs hover:border-primary transition-colors shrink-0"
          >
            {copiedLink ? "Copiado!" : "Copiar"}
          </button>
        </div>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="w-full gradient-primary text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Share2 className="h-5 w-5" />
          Compartir con amigos
        </button>
      </div>

      {/* How it works */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <p className="font-bold mb-4">Como funciona</p>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-black font-bold text-sm shrink-0">1</div>
            <div>
              <p className="font-medium text-sm">Compartí tu codigo</p>
              <p className="text-xs text-muted">Envialo por WhatsApp, Instagram o como quieras</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-black font-bold text-sm shrink-0">2</div>
            <div>
              <p className="font-medium text-sm">Tu amigo obtiene 15% OFF</p>
              <p className="text-xs text-muted">El descuento se aplica en su primer plan</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-black font-bold text-sm shrink-0">3</div>
            <div>
              <p className="font-medium text-sm">Vos ganas 7 dias gratis</p>
              <p className="text-xs text-muted">Se suman automaticamente a tu suscripcion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals list */}
      {referrals.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <p className="font-bold mb-4">Tus Referidos</p>
          <div className="space-y-3">
            {referrals.map((ref: any) => (
              <div key={ref.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {(ref.profiles?.full_name || ref.referred_email || "?")[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{ref.profiles?.full_name || ref.referred_email || "Pendiente"}</p>
                    <p className="text-[10px] text-muted">
                      {new Date(ref.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                  ref.status === "completed"
                    ? "bg-primary/10 text-primary"
                    : "bg-yellow-500/10 text-yellow-500"
                }`}>
                  {ref.status === "completed" ? `+${ref.days_rewarded} dias` : "Pendiente"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
