"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, Dumbbell, LineChart, Sparkles, ArrowRight, Check, Loader2, Eye, EyeOff, ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PLANS } from "@/lib/plans-data";

type Step = "loading" | "invalid" | "welcome" | "account" | "objective" | "done";

const OBJECTIVES = ["quema-grasa", "ganancia-muscular", "tonificacion", "recomposicion-corporal", "fuerza-funcional", "rendimiento-deportivo"];

const ROLE_FEATURES = [
  { icon: Users, title: "Los clientes personalizados", text: "Su rutina, su contacto y su progreso, todo en un solo lugar." },
  { icon: Dumbbell, title: "Sesiones en vivo", text: "Cargás pesos y repeticiones mientras entrenan, con el timer de descanso." },
  { icon: LineChart, title: "Progreso real", text: "Cada sesión queda en la cuenta del cliente y suma a su evolución." },
  { icon: Sparkles, title: "Tu propio plan", text: "Rutina y dieta para vos, generadas a tu medida y editables cuando quieras." },
];

// Invitacion personal para sumarse como entrenador suplente: /equipo?t=TOKEN
export default function EquipoInvitePage() {
  const [token, setToken] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [invite, setInvite] = useState<{ name: string; message: string | null } | null>(null);
  const [invalidMsg, setInvalidMsg] = useState("");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [mode, setMode] = useState<"register" | "login">("register");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hasSurvey, setHasSurvey] = useState(false);
  const [objective, setObjective] = useState("");

  // Leer token sin useSearchParams (falla en el navegador de WhatsApp)
  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("t") || "");
  }, []);

  useEffect(() => {
    if (token === null) return;
    if (!token) { setInvalidMsg("El link de invitacion no es valido."); setStep("invalid"); return; }
    (async () => {
      try {
        const [res, { data: { session } }] = await Promise.all([
          fetch(`/api/trainer-invite?t=${encodeURIComponent(token)}`),
          supabase.auth.getSession(),
        ]);
        const body = await res.json();
        if (!res.ok) { setInvalidMsg(body.error || "Invitacion no valida"); setStep("invalid"); return; }
        if (body.expired && !body.used) { setInvalidMsg("Esta invitacion vencio. Pedile a Pablo un link nuevo."); setStep("invalid"); return; }
        setInvite({ name: body.name, message: body.message });
        setFullName(body.name || "");
        setSessionEmail(session?.user?.email ?? null);
        setStep("welcome");
      } catch {
        setInvalidMsg("No pudimos cargar la invitacion. Revisá tu conexion.");
        setStep("invalid");
      }
    })();
  }, [token]);

  const firstName = (invite?.name || "").split(" ")[0];

  const accept = async (accessToken: string) => {
    const res = await fetch("/api/trainer-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ token }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "No se pudo aceptar la invitacion");
    setHasSurvey(!!body.hasSurvey);
    setStep(body.hasSurvey ? "done" : "objective");
  };

  const acceptWithCurrentSession = async () => {
    setBusy(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setSessionEmail(null); setStep("account"); return; }
      await accept(session.access_token);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const handleAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const cleanEmail = email.trim().toLowerCase();
    try {
      if (mode === "login") {
        const { data, error: loginErr } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (loginErr || !data.session) throw new Error("Email o contraseña incorrectos");
        await accept(data.session.access_token);
        return;
      }

      if (password.length < 6) throw new Error("La contraseña tiene que tener al menos 6 caracteres");

      // Si la cuenta habia sido eliminada, restaurarla
      await fetch("/api/restore-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      }).catch(() => {});

      const { data, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name: fullName, phone } },
      });

      // Supabase devuelve un usuario "falso" (identities = []) si el email ya existe
      const alreadyExists =
        (authError && authError.message.toLowerCase().includes("already registered")) ||
        (!authError && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0);
      if (alreadyExists) {
        const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (loginErr || !loginData.session) {
          setMode("login");
          throw new Error("Ese email ya tiene cuenta. Ingresá con tu contraseña.");
        }
        await accept(loginData.session.access_token);
        return;
      }
      if (authError || !data.user) throw new Error(authError?.message || "No se pudo crear la cuenta");

      // Confirmar email (bypass SMTP) e iniciar sesion
      await fetch("/api/confirm-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id }),
      }).catch(() => {});
      let accessToken = data.session?.access_token;
      for (let attempt = 0; attempt < 3 && !accessToken; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 1000));
        const { data: signInData } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        accessToken = signInData?.session?.access_token;
      }
      if (!accessToken) throw new Error("Cuenta creada, pero no pudimos iniciar sesion. Probá ingresar.");

      await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", data.user.id);
      await accept(accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-white">
      <style>{`
        @keyframes eq-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes eq-float { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-20px) scale(1.08); } }
        @keyframes eq-pop { 0% { transform: scale(.4); opacity: 0; } 60% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); } }
        .eq-rise { animation: eq-rise .7s cubic-bezier(.2,.8,.2,1) both; }
        .eq-pop { animation: eq-pop .6s cubic-bezier(.2,.8,.2,1) both; }
      `}</style>

      {/* Fondo: halos de luz */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-[120px]" style={{ animation: "eq-float 14s ease-in-out infinite" }} />
        <div className="absolute top-1/3 -right-40 h-[26rem] w-[26rem] rounded-full bg-accent/15 blur-[120px]" style={{ animation: "eq-float 18s ease-in-out infinite reverse" }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-xl flex-col px-5 pt-10 pb-44">
        {/* Sin animacion: el transform crea un stacking context y rompe el mix-blend del logo */}
        <div className="mb-10 flex items-center justify-between">
          <img src="/logo-pablo.jpg" alt="Pablo Scarlatto" className="h-14 w-auto" style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
          <span className="badge-gold text-[10px] uppercase tracking-[0.2em]">Equipo</span>
        </div>

        {step === "loading" && (
          <div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        )}

        {step === "invalid" && (
          <div className="eq-rise glass-card rounded-3xl p-8 text-center">
            <p className="text-lg font-bold mb-2">Invitacion no disponible</p>
            <p className="text-sm text-muted">{invalidMsg}</p>
          </div>
        )}

        {step === "welcome" && invite && (
          <div className="flex flex-1 flex-col">
            <p className="eq-rise text-sm font-semibold uppercase tracking-[0.25em] text-primary" style={{ animationDelay: ".05s" }}>
              Invitacion personal
            </p>
            <h1 className="eq-rise mt-3 font-[family-name:var(--font-outfit)] text-4xl font-black leading-[1.05] sm:text-5xl" style={{ animationDelay: ".12s" }}>
              {firstName}, te quiero <span className="text-gradient">en mi equipo.</span>
            </h1>

            <div className="eq-rise mt-6 glass-card rounded-2xl p-5" style={{ animationDelay: ".2s" }}>
              <p className="text-[15px] leading-relaxed text-white/85">
                {invite.message || `Durante este tiempo vas a acompañar a mis clientes personalizados. Te preparé todo para que trabajes como yo: cada rutina, cada cliente y cada sesión, desde tu celular.`}
              </p>
              <p className="mt-4 text-sm font-bold">— Pablo Scarlatto</p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ROLE_FEATURES.map((f, i) => (
                <div key={f.title} className="eq-rise card-premium rounded-2xl p-4" style={{ animationDelay: `${0.28 + i * 0.08}s` }}>
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-[18px] w-[18px] text-primary" />
                  </div>
                  <p className="text-sm font-bold">{f.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{f.text}</p>
                </div>
              ))}
            </div>

            <div className="eq-rise mt-8 space-y-3" style={{ animationDelay: ".65s" }}>
              {sessionEmail ? (
                <>
                  <button onClick={acceptWithCurrentSession} disabled={busy}
                    className="btn-shimmer flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-black disabled:opacity-60">
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Aceptar como {sessionEmail} <ArrowRight className="h-5 w-5" /></>}
                  </button>
                  <button onClick={async () => { await supabase.auth.signOut(); setSessionEmail(null); setStep("account"); }}
                    className="w-full text-center text-xs text-muted hover:text-white">
                    Usar otra cuenta
                  </button>
                </>
              ) : (
                <button onClick={() => setStep("account")}
                  className="btn-shimmer flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-black">
                  Aceptar invitacion <ArrowRight className="h-5 w-5" />
                </button>
              )}
              {error && <p className="text-center text-sm text-danger">{error}</p>}
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
                <ShieldCheck className="h-3.5 w-3.5" /> Link personal e intransferible
              </p>
            </div>
          </div>
        )}

        {step === "account" && (
          <div className="eq-rise">
            <h2 className="font-[family-name:var(--font-outfit)] text-3xl font-black">
              {mode === "register" ? "Creá tu cuenta" : "Ingresá a tu cuenta"}
            </h2>
            <p className="mt-2 mb-6 text-sm text-muted">
              {mode === "register" ? "Un minuto y estás adentro." : "Usá el email y la contraseña con los que ya te registraste."}
            </p>
            <form onSubmit={handleAccount} className="glass-card space-y-3 rounded-3xl p-5">
              {mode === "register" && (
                <>
                  <Field label="Nombre completo" value={fullName} onChange={setFullName} autoComplete="name" required />
                  <Field label="Telefono" type="tel" value={phone} onChange={setPhone} autoComplete="tel" placeholder="09X XXX XXX" />
                </>
              )}
              <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
              <div>
                <label className="mb-1 block text-xs text-muted">Contraseña</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-3 pr-11 focus:border-primary focus:outline-none" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <button type="submit" disabled={busy}
                className="btn-shimmer mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-black disabled:opacity-60">
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{mode === "register" ? "Crear cuenta y unirme" : "Ingresar y unirme"} <ArrowRight className="h-5 w-5" /></>}
              </button>
            </form>
            <button onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }}
              className="mt-4 w-full text-center text-sm text-muted hover:text-white">
              {mode === "register" ? "¿Ya tenés cuenta? Ingresá" : "¿No tenés cuenta? Creala"}
            </button>
          </div>
        )}

        {step === "objective" && (
          <div className="eq-rise">
            <div className="eq-pop mb-5 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
              <Check className="h-7 w-7 text-black" />
            </div>
            <h2 className="font-[family-name:var(--font-outfit)] text-3xl font-black">Ya sos parte del equipo.</h2>
            <p className="mt-2 mb-6 text-sm text-muted">Ahora armemos tu plan. ¿Qué querés lograr vos?</p>
            <div className="grid grid-cols-2 gap-3">
              {PLANS.filter((p) => OBJECTIVES.includes(p.slug)).map((p) => (
                <button key={p.slug} onClick={() => setObjective(p.slug)}
                  className={`rounded-2xl border p-4 text-left transition-all ${objective === p.slug ? "border-primary bg-primary/10" : "border-card-border bg-card-bg hover:border-primary/40"}`}>
                  <span className="mb-2 block h-1.5 w-8 rounded-full" style={{ background: p.color }} />
                  <p className="text-sm font-bold">{p.name}</p>
                  <p className="mt-1 text-[11px] leading-snug text-muted">{p.shortDescription}</p>
                </button>
              ))}
            </div>
            <Link href={objective ? `/encuesta-directa?plan=${objective}` : "#"}
              aria-disabled={!objective}
              className={`btn-shimmer mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-black ${objective ? "" : "pointer-events-none opacity-40"}`}>
              Armar mi plan <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/entrenador" className="mt-4 block text-center text-xs text-muted hover:text-white">
              Lo hago despues — ver los clientes
            </Link>
          </div>
        )}

        {step === "done" && (
          <div className="eq-rise flex flex-1 flex-col items-center justify-center text-center">
            <div className="eq-pop mb-6 flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary shadow-[0_0_60px_rgba(34,197,94,.35)]">
              <Check className="h-10 w-10 text-black" />
            </div>
            <h2 className="font-[family-name:var(--font-outfit)] text-4xl font-black">Te damos la bienvenida, {firstName}.</h2>
            <p className="mt-3 max-w-sm text-sm text-muted">
              {hasSurvey ? "Tu cuenta ya tiene acceso al panel de entrenador. Tus clientes te están esperando." : "Ya tenés acceso al panel de entrenador."}
            </p>
            <Link href="/entrenador" className="btn-shimmer mt-8 flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl py-4 font-bold text-black">
              Ver mis clientes <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", ...rest }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
  autoComplete?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} {...rest}
        className="w-full rounded-xl border border-card-border bg-background px-4 py-3 focus:border-primary focus:outline-none" />
    </div>
  );
}
