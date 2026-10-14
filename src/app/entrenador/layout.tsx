"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, UserCog } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { RatLoader } from "@/components/rat-loader";

// Area del entrenador suplente: solo ver clientes personalizados y entrenarlos.
export default function EntrenadorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile, isTrainer, loading, accessLoading } = useAuth();
  const ready = !loading && !accessLoading;
  const allowed = isTrainer || !!profile?.is_admin;

  useEffect(() => {
    if (!ready) return;
    if (!user) router.push("/login");
    else if (profile && !allowed) router.push("/dashboard");
  }, [ready, user, profile, allowed, router]);

  if (!ready || !allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RatLoader size={64} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-card-border/50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Mi app
          </Link>
          <Link href="/entrenador" className="flex items-center gap-2 text-sm font-bold">
            <UserCog className="h-4 w-4 text-accent" /> Entrenador
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
