"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Lock, AlertTriangle } from "lucide-react";

export default function AdminVerify2FA() {
  const router = useRouter();
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // If already verified in last 24h, redirect to admin
    const lastVerified = localStorage.getItem("admin-2fa-verified");
    if (lastVerified && Date.now() - Number(lastVerified) < 24 * 60 * 60 * 1000) {
      router.push("/admin");
    }
  }, [router]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError("");

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newPin.every((d) => d !== "")) {
      handleSubmit(newPin.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newPin = pasted.split("");
      setPin(newPin);
      handleSubmit(pasted);
    }
  };

  const handleSubmit = async (pinStr?: string) => {
    const fullPin = pinStr || pin.join("");
    if (fullPin.length !== 6) {
      setError("Ingresa los 6 digitos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: fullPin }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("admin-2fa-verified", String(Date.now()));
        router.push("/admin");
      } else {
        setError(data.error || "PIN incorrecto");
        setPin(["", "", "", "", "", ""]);
        inputsRef.current[0]?.focus();

        if (res.status === 429) {
          setLocked(true);
        }
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-black">Verificacion Admin</h1>
          </div>
          <p className="text-muted text-sm mb-8">
            Ingresa el PIN de 6 digitos para acceder al panel de administracion
          </p>

          {locked ? (
            <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 justify-center">
                <AlertTriangle className="h-5 w-5 text-danger" />
                <p className="text-danger font-bold text-sm">Acceso bloqueado</p>
              </div>
              <p className="text-muted text-xs mt-2">
                Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputsRef.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-card-border rounded-xl focus:border-primary focus:outline-none transition-colors"
                    disabled={loading}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && (
                <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 mb-4">
                  <p className="text-danger text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={() => handleSubmit()}
                disabled={loading || pin.some((d) => d === "")}
                className="w-full py-3 rounded-xl font-bold text-sm gradient-primary text-black disabled:opacity-50 transition-opacity"
              >
                {loading ? "Verificando..." : "Verificar"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
