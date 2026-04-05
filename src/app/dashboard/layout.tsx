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

    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
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
      setShowIOSGuide(!showIOSGuide);
    }
  };

  const handleSignOut = async () => { await signOut(); router.push("/"); };

  return (
    <div className="min-h-screen flex">
      {/* SIDEBAR Desktop — slim, elegant */}
      <aside className="hidden md:flex w-60 flex-col fixed h-screen border-r border-card-border/50 bg-background">
        {/* Logo */}
        <div className="p-5 pb-4">
          <Link href="/" className="flex items-center">
            <img src="/logo-pablo.jpg" alt="Pablo Scarlatto" className="h-12 w-auto" style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
          </Link>
        </div>

        <div className="line-accent mx-5" />

        {/* User */}
        {profile && (
          <div className="px-5 py-3">
            <p className="text-sm font-medium truncate">{profile.full_name}</p>
            <p className="text-[10px] text-muted truncate">{profile.email}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? "text-primary font-semibold nav-active"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 space-y-0.5">
          <div className="line-accent mb-2" />
          {hasActiveSubscription && !isInstalled && (
            <>
              <button onClick={handleInstallApp}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-primary font-semibold hover:bg-primary/5 transition-all">
                <Download className="h-[18px] w-[18px]" /> Descargar App
              </button>
              {showIOSGuide && (
                <div className="ml-3 p-3 bg-primary/5 border border-primary/15 rounded-lg text-[10px] text-muted space-y-1 mb-1">
                  <p className="font-bold text-primary"><Share className="h-3 w-3 inline" /> iPhone/iPad:</p>
                  <p>1. Compartir (⬆) en Safari</p>
                  <p>2. Agregar a pantalla de inicio</p>
                </div>
              )}
            </>
          )}
          {isInstalled && (
            <div className="flex items-center gap-3 px-3 py-2.5 text-xs text-primary/60">
              <Smartphone className="h-4 w-4" /> App instalada
            </div>
          )}
          <Link href="/manual" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:text-foreground transition-all">
            <BookOpen className="h-[18px] w-[18px]" /> Manual
          </Link>
          <a href="https://instagram.com/pabloscarlattoentrenamientos" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:text-foreground transition-all">
            <InstagramIcon className="h-[18px] w-[18px]" /> Instagram
          </a>
          <button onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:text-danger w-full transition-all">
            <LogOut className="h-[18px] w-[18px]" /> Salir
          </button>
        </div>
      </aside>

      {/* MOBILE NAV — clean */}
      <div className="md:hidden fixed top-0 w-full z-50 backdrop-blur-md bg-background/80 border-b border-card-border/50">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo-pablo.jpg" alt="Pablo Scarlatto" className="h-9 w-auto" style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="p-3 space-y-0.5 border-t border-card-border/50 bg-background">
            {profile && (
              <div className="px-3 py-2.5 mb-2">
                <p className="text-sm font-medium">{profile.full_name}</p>
                <p className="text-[10px] text-muted">{profile.email}</p>
              </div>
            )}
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${isActive ? "text-primary font-semibold" : "text-muted"}`}>
                  <item.icon className="h-[18px] w-[18px]" /> {item.label}
                </Link>
              );
            })}
            <div className="line-accent my-2" />
            {hasActiveSubscription && !isInstalled && (
              <button onClick={() => { handleInstallApp(); setMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-primary font-semibold">
                <Download className="h-[18px] w-[18px]" /> Descargar App
              </button>
            )}
            <Link href="/manual" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted">
              <BookOpen className="h-[18px] w-[18px]" /> Manual
            </Link>
            <button onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:text-danger w-full">
              <LogOut className="h-[18px] w-[18px]" /> Salir
            </button>
          </nav>
        )}
      </div>

      {/* MAIN */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
