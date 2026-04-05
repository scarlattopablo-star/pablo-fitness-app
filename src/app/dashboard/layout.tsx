"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Dumbbell, LayoutDashboard, ClipboardList, TrendingUp,
  User, BookOpen, LogOut, Menu, X, Download, Smartphone, Share,
} from "lucide-react";
import { useState, useEffect } from "react";
import { InstagramIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Resumen" },
  { href: "/dashboard/plan", icon: ClipboardList, label: "Mi Plan" },
  { href: "/dashboard/progreso", icon: TrendingUp, label: "Progreso" },
  { href: "/dashboard/ejercicios", icon: BookOpen, label: "Ejercicios" },
  { href: "/dashboard/perfil", icon: User, label: "Perfil" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { profile, signOut, hasActiveSubscription } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone);
    if (standalone) setIsInstalled(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      (deferredPrompt as unknown as { prompt: () => Promise<void> }).prompt();
      const { outcome } = await (deferredPrompt as unknown as { userChoice: Promise<{ outcome: string }> }).userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
    } else {
      // No native prompt available (iOS or unsupported browser) — show manual instructions
      setShowIOSGuide(!showIOSGuide);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
      <div className="min-h-screen flex">
        {/* SIDEBAR Desktop */}
        <aside className="hidden md:flex w-64 glass-card border-r border-card-border flex-col fixed h-screen">
          <div className="p-6 border-b border-card-border">
            <Link href="/" className="flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-primary" />
              <div>
                <p className="font-bold text-sm leading-tight">PABLO SCARLATTO</p>
                <p className="text-xs text-muted">ENTRENAMIENTOS</p>
              </div>
            </Link>
            {profile && (
              <div className="mt-4 p-3 bg-card-bg rounded-xl">
                <p className="text-sm font-medium truncate">{profile.full_name}</p>
                <p className="text-xs text-muted truncate">{profile.email}</p>
              </div>
            )}
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-card-border space-y-2">
            {hasActiveSubscription && !isInstalled && (
              <div>
                <button
                  onClick={handleInstallApp}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm w-full gradient-primary text-black font-semibold transition-all hover:opacity-90"
                >
                  <Download className="h-5 w-5" />
                  Descargar App
                </button>
                {showIOSGuide && (
                  <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-muted space-y-1">
                    <p className="font-bold text-primary flex items-center gap-1"><Share className="h-3 w-3" /> iPhone/iPad:</p>
                    <p>1. Toca <strong className="text-white">Compartir</strong> (⬆)</p>
                    <p>2. Toca <strong className="text-white">Agregar a pantalla de inicio</strong></p>
                    <p>3. Toca <strong className="text-white">Agregar</strong></p>
                  </div>
                )}
              </div>
            )}
            {isInstalled && (
              <div className="flex items-center gap-3 px-4 py-3 text-sm text-primary font-medium">
                <Smartphone className="h-5 w-5" />
                App instalada
              </div>
            )}
            <Link
              href="/manual"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted hover:text-white hover:bg-white/5 transition-all"
            >
              <Dumbbell className="h-5 w-5" />
              Manual de Uso
            </Link>
            <a
              href="https://instagram.com/pabloscarlattoentrenamientos"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted hover:text-white hover:bg-white/5 transition-all"
            >
              <InstagramIcon className="h-5 w-5" />
              Instagram
            </a>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted hover:text-danger hover:bg-danger/5 w-full transition-all"
            >
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* MOBILE NAV */}
        <div className="md:hidden fixed top-0 w-full z-50 glass-card border-b border-card-border">
          <div className="px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm">PS ENTRENAMIENTOS</span>
            </Link>
            <div className="flex items-center gap-3">
              {profile && (
                <span className="text-xs text-muted hidden sm:inline">{profile.full_name}</span>
              )}
              <button onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          {menuOpen && (
            <nav className="p-4 space-y-1 border-t border-card-border bg-background">
              {profile && (
                <div className="px-4 py-3 mb-2 bg-card-bg rounded-xl">
                  <p className="text-sm font-medium">{profile.full_name}</p>
                  <p className="text-xs text-muted">{profile.email}</p>
                </div>
              )}
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted hover:text-white"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              {hasActiveSubscription && !isInstalled && (
                <button
                  onClick={() => { handleInstallApp(); setMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm w-full gradient-primary text-black font-semibold"
                >
                  <Download className="h-5 w-5" />
                  Descargar App
                </button>
              )}
              {showIOSGuide && (
                <div className="mx-4 p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-muted space-y-1">
                  <p className="font-bold text-primary">iPhone/iPad:</p>
                  <p>1. Toca <strong className="text-white">Compartir</strong> (⬆) en Safari</p>
                  <p>2. Toca <strong className="text-white">Agregar a pantalla de inicio</strong></p>
                  <p>3. Toca <strong className="text-white">Agregar</strong></p>
                </div>
              )}
              <Link
                href="/manual"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted hover:text-white"
              >
                <Dumbbell className="h-5 w-5" />
                Manual de Uso
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted hover:text-danger w-full"
              >
                <LogOut className="h-5 w-5" />
                Cerrar Sesión
              </button>
            </nav>
          )}
        </div>

        {/* MAIN */}
        <main className="flex-1 md:ml-64 pt-14 md:pt-0">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
  );
}
