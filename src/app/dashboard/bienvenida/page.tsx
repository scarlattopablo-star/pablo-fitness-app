"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Camera, Check, Target, Trophy, Bell, Dumbbell, Loader2, PlayCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { uploadProgressPhoto } from "@/lib/upload-photo";
import { requestPushPermission, syncPushSubscription } from "@/lib/push-notifications";

type Step = "welcome" | "goal" | "photo" | "checklist";

const GOAL_PRESETS = [
  { id: "entrenar-3x", label: "Entrenar 3 veces esta semana", icon: Dumbbell },
  { id: "foto-dia-7", label: "Sacarme una foto el dia 7 para comparar", icon: Camera },
  { id: "registrar-comidas", label: "Registrar todas mis comidas del plan", icon: Check },
  { id: "romper-pr", label: "Romper un PR en un ejercicio clave", icon: Trophy },
];

export default function BienvenidaPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("welcome");
  const [goal, setGoal] = useState<string>("");
  const [customGoal, setCustomGoal] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // If already onboarded, bounce to plan
  useEffect(() => {
    if (authLoading || !user) return;
    supabase.from("profiles")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.onboarding_completed_at) router.replace("/dashboard/plan");
      });
  }, [authLoading, user, router]);

  // Check push permission state on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  const firstName = profile?.full_name?.split(" ")[0] || "Crack";

  const saveGoal = async () => {
    const finalGoal = goal === "custom" ? customGoal.trim() : GOAL_PRESETS.find(g => g.id === goal)?.label || "";
    if (!finalGoal || !user) return;
    setSavingGoal(true);
    await supabase.from("profiles").update({
      welcome_goal_7d: finalGoal,
      welcome_goal_set_at: new Date().toISOString(),
    }).eq("id", user.id);
    setSavingGoal(false);
    setStep("photo");
  };

  const uploadPhoto = async (file: File) => {
    if (!user) return;
    setUploadingPhoto(true);
    const path = await uploadProgressPhoto(file, user.id, "front");
    if (path) {
      // Find or create today's progress entry and attach photo
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("progress_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();
      if (existing) {
        await supabase.from("progress_entries").update({ photo_front: path }).eq("id", existing.id);
      } else {
        await supabase.from("progress_entries").insert({
          user_id: user.id,
          photo_front: path,
          notes: "Foto inicial — onboarding bienvenida",
        });
      }
      setPhotoUploaded(true);
    }
    setUploadingPhoto(false);
  };

  const enablePush = async () => {
    const granted = await requestPushPermission();
    if (granted) {
      await syncPushSubscription();
      setPushEnabled(true);
    }
  };

  const finishOnboarding = async () => {
    if (!user) return;
    setFinishing(true);
    await supabase.from("profiles").update({
      onboarding_completed_at: new Date().toISOString(),
    }).eq("id", user.id);
    router.push("/dashboard/plan");
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-2 py-4">
      <div className="w-full max-w-xl">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(["welcome", "goal", "photo", "checklist"] as Step[]).map((s, i) => {
            const currentIdx = ["welcome", "goal", "photo", "checklist"].indexOf(step);
            const done = i < currentIdx;
            const active = s === step;
            return (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  active ? "w-10 bg-primary" : done ? "w-6 bg-primary/60" : "w-2 bg-card-border"
                }`}
              />
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="relative w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden border-4 border-primary/30">
                <img src="/images/gym-bg-fullscreen.png" alt="Pablo Scarlatto" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black mb-3">
                Bienvenido, <span className="text-primary">{firstName}</span>
              </h1>
              <p className="text-muted mb-2">Soy Pablo, tu entrenador personal.</p>
              <p className="text-muted text-sm max-w-md mx-auto mb-8">
                Antes de empezar, vamos a hacer 3 cosas rapidas para que arranques con todo.
                Te llevan 2 minutos y cambian por completo tus resultados.
              </p>
              <button
                onClick={() => setStep("goal")}
                className="w-full sm:w-auto gradient-primary text-black font-bold px-8 py-4 rounded-xl inline-flex items-center justify-center gap-2 hover:opacity-90 transition"
              >
                Empezar <ArrowRight className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {step === "goal" && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-black">Tu meta de 7 dias</h2>
              </div>
              <p className="text-muted text-sm mb-6">
                Una meta concreta, chica, alcanzable en 7 dias. El cerebro necesita ganar rapido para engancharse.
              </p>

              <div className="space-y-2 mb-4">
                {GOAL_PRESETS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      goal === g.id
                        ? "border-primary bg-primary/10"
                        : "border-card-border hover:border-card-border/80"
                    }`}
                  >
                    <g.icon className={`h-5 w-5 shrink-0 ${goal === g.id ? "text-primary" : "text-muted"}`} />
                    <span className="font-medium">{g.label}</span>
                  </button>
                ))}

                <button
                  onClick={() => setGoal("custom")}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    goal === "custom"
                      ? "border-primary bg-primary/10"
                      : "border-card-border hover:border-card-border/80"
                  }`}
                >
                  <span className="font-medium text-sm">Escribir mi propia meta</span>
                </button>
                {goal === "custom" && (
                  <input
                    autoFocus
                    type="text"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="Ej: Bajar 1kg, hacer 10 flexiones seguidas..."
                    maxLength={120}
                    className="w-full p-4 rounded-xl bg-card-bg border border-card-border focus:border-primary outline-none"
                  />
                )}
              </div>

              <button
                onClick={saveGoal}
                disabled={!goal || (goal === "custom" && !customGoal.trim()) || savingGoal}
                className="w-full gradient-primary text-black font-bold py-4 rounded-xl inline-flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-40"
              >
                {savingGoal ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Guardar meta <ArrowRight className="h-5 w-5" /></>}
              </button>
            </motion.div>
          )}

          {step === "photo" && (
            <motion.div
              key="photo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Camera className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-black">Tu foto &ldquo;antes&rdquo;</h2>
              </div>
              <p className="text-muted text-sm mb-6">
                Una foto hoy. Una foto en 60 dias. La diferencia que vas a ver te va a shockear.
                Nadie la ve excepto vos y yo.
              </p>

              <label
                className={`block w-full aspect-[3/4] max-h-80 rounded-2xl border-2 border-dashed cursor-pointer transition-all flex items-center justify-center mb-4 ${
                  photoUploaded
                    ? "border-primary bg-primary/10"
                    : "border-card-border hover:border-primary/50"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(file);
                  }}
                />
                <div className="text-center p-6">
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-2" />
                      <p className="text-sm text-muted">Subiendo...</p>
                    </>
                  ) : photoUploaded ? (
                    <>
                      <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mx-auto mb-2">
                        <Check className="h-8 w-8 text-black" />
                      </div>
                      <p className="font-semibold">Listo! Foto guardada</p>
                    </>
                  ) : (
                    <>
                      <Camera className="h-12 w-12 mx-auto text-muted mb-2" />
                      <p className="font-semibold">Tocá para sacar o subir foto</p>
                      <p className="text-xs text-muted mt-1">Frente, ropa ajustada o interior, buena luz</p>
                    </>
                  )}
                </div>
              </label>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep("checklist")}
                  className="flex-1 py-4 rounded-xl text-muted border border-card-border hover:text-foreground transition"
                >
                  Omitir
                </button>
                <button
                  onClick={() => setStep("checklist")}
                  disabled={!photoUploaded}
                  className="flex-[2] gradient-primary text-black font-bold py-4 rounded-xl inline-flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-40"
                >
                  Continuar <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === "checklist" && (
            <motion.div
              key="checklist"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-black">Estas listo</h2>
              </div>
              <p className="text-muted text-sm mb-6">
                Esto es lo que va a pasar esta semana. Hace click en &ldquo;Empezar mi plan&rdquo; y arrancamos.
              </p>

              <div className="space-y-2 mb-6">
                <ChecklistItem done label="Meta de 7 dias definida" />
                <ChecklistItem done={photoUploaded} label="Foto inicial subida" optional />
                <button
                  onClick={enablePush}
                  disabled={pushEnabled}
                  className="w-full text-left"
                >
                  <ChecklistItem
                    done={pushEnabled}
                    label={pushEnabled ? "Notificaciones activas" : "Activar notificaciones (recomendado)"}
                    icon={Bell}
                    clickable={!pushEnabled}
                  />
                </button>
                <ChecklistItem label="Hacer tu primer entrenamiento" icon={Dumbbell} pending />
                <ChecklistItem label="Ver el video de bienvenida de Pablo" icon={PlayCircle} pending />
              </div>

              <button
                onClick={finishOnboarding}
                disabled={finishing}
                className="w-full gradient-primary text-black font-bold py-4 rounded-xl inline-flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-40"
              >
                {finishing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Empezar mi plan <ArrowRight className="h-5 w-5" /></>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ChecklistItem({
  done,
  label,
  icon: Icon = Check,
  optional,
  pending,
  clickable,
}: {
  done?: boolean;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  optional?: boolean;
  pending?: boolean;
  clickable?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-xl border flex items-center gap-3 ${
        done
          ? "border-primary/40 bg-primary/5"
          : clickable
            ? "border-primary/50 bg-primary/5 hover:bg-primary/10 cursor-pointer"
            : "border-card-border"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          done ? "bg-primary" : "bg-card-bg border border-card-border"
        }`}
      >
        {done ? <Check className="h-4 w-4 text-black" /> : <Icon className="h-4 w-4 text-muted" />}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${done ? "" : pending ? "text-muted" : ""}`}>{label}</p>
        {optional && !done && <p className="text-[10px] text-muted">Opcional pero super recomendado</p>}
      </div>
    </div>
  );
}
