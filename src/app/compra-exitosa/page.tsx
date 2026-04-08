"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight, Dumbbell, Smartphone, Loader2 } from "lucide-react";
import { RatLoader } from "@/components/rat-loader";
import { supabase } from "@/lib/supabase";

export default function CompraExitosaPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // User is logged in - check if they need to complete survey
        const { data: survey } = await supabase
          .from("surveys")
          .select("id")
          .eq("user_id", session.user.id)
          .limit(1)
          .maybeSingle();

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", session.user.id)
          .single();

        setChecking(false);

        // Auto-redirect after countdown
        const destination = profile?.is_admin
          ? "/admin"
          : survey
            ? "/dashboard"
            : "/encuesta-directa";

        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              router.push(destination);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } else {
        // No session - show login link
        setChecking(false);
      }
    });
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-black" />
        </div>

        <h1 className="text-3xl font-black mb-3">¡Pago Exitoso!</h1>
        <p className="text-muted mb-8">
          Tu plan esta listo. {checking
            ? "Verificando tu sesion..."
            : countdown > 0
              ? `Te redirigimos en ${countdown} segundos...`
              : "Redirigiendo..."}
        </p>

        {checking ? (
          <div className="flex justify-center mb-4">
            <RatLoader size={48} />
          </div>
        ) : countdown > 0 ? (
          <button
            onClick={() => {
              setCountdown(0);
              supabase.auth.getSession().then(async ({ data: { session } }) => {
                if (session?.user) {
                  const { data: survey } = await supabase
                    .from("surveys")
                    .select("id")
                    .eq("user_id", session.user.id)
                    .limit(1)
                    .maybeSingle();
                  router.push(survey ? "/dashboard" : "/encuesta-directa");
                } else {
                  router.push("/login");
                }
              });
            }}
            className="block w-full gradient-primary text-black font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-4"
          >
            Ir a Mi Plan <ArrowRight className="h-5 w-5" />
          </button>
        ) : (
          <div className="flex justify-center mb-4">
            <RatLoader size={48} />
          </div>
        )}

        {!checking && (
          <Link
            href="/login"
            className="text-sm text-muted hover:text-primary transition-colors"
          >
            Tambien podes iniciar sesion manualmente
          </Link>
        )}

        {/* Install instructions */}
        <div className="glass-card rounded-2xl p-5 mb-6 text-left mt-6">
          <div className="flex items-center gap-3 mb-3">
            <Smartphone className="h-5 w-5 text-primary" />
            <p className="font-bold text-sm">Descarga la app en tu celular</p>
          </div>
          <p className="text-xs text-muted mb-3">Una vez dentro de tu plan, podras instalar la app:</p>
          <div className="space-y-2 text-sm text-muted">
            <div className="flex gap-2">
              <span className="text-primary font-bold">iPhone:</span>
              <span>Safari → Compartir (⬆) → Agregar a Inicio</span>
            </div>
            <div className="flex gap-2">
              <span className="text-primary font-bold">Android:</span>
              <span>Chrome → Menu (⋮) → Instalar app</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-muted">
          <Dumbbell className="h-4 w-4 text-primary" />
          <span className="text-xs">Pablo Scarlatto Entrenamientos</span>
        </div>
      </div>
    </main>
  );
}
