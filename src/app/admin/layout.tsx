"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dumbbell, LayoutDashboard, Users, ClipboardList,
  CreditCard, BookOpen, LogOut, Menu, X, Gift, Download, Smartphone, Share, Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/clientes", icon: Users, label: "Clientes" },
  { href: "/admin/planes", icon: ClipboardList, label: "Planes" },
  { href: "/admin/ejercicios", icon: BookOpen, label: "Ejercicios" },
  { href: "/admin/pagos", icon: CreditCard, label: "Pagos" },
  { href: "/admin/acceso-gratis", icon: Gift, label: "Acceso Gratis" },
  { href: "/admin/papelera", icon: Trash2, label: "Papelera" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
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
    } else if (isIOS) {
      setShowIOSGuide(!showIOSGuide);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 glass-card border-r border-card-border flex-col fixed h-screen">
        <div className="p-6 border-b border-card-border">
          <Link href="/admin" className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <div>
              <p className="font-bold text-sm leading-tight">ADMIN PANEL</p>
              <p className="text-xs text-muted">Pablo Scarlatto</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
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
        <div className="p-4 border-t border-card-border space-y-1">
          <button
            onClick={handleInstallApp}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm w-full gradient-primary text-black font-semibold transition-all hover:opacity-90"
          >
            <Download className="h-5 w-5" />
            Descargar App
          </button>
          {showIOSGuide && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs space-y-2">
              <p className="font-bold text-primary text-sm">Instalar en iPhone/iPad</p>
              <div className="space-y-1.5 text-muted">
                <p>1. Toca el icono <strong className="text-white">Compartir</strong> <span className="text-primary text-lg">⬆</span> en la barra de Safari (abajo)</p>
                <p>2. Desplaza y toca <strong className="text-white">&quot;Agregar a pantalla de inicio&quot;</strong></p>
                <p>3. Toca <strong className="text-white">&quot;Agregar&quot;</strong> arriba a la derecha</p>
              </div>
              <p className="text-primary text-[10px]">La app aparecera en tu pantalla de inicio como cualquier otra app.</p>
            </div>
          )}
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut className="h-5 w-5" />
            Ir al Sitio
          </Link>
          <button
            onClick={async () => { await signOut(); window.location.href = "/login"; }}
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
          <Link href="/admin" className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">ADMIN</span>
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="p-4 space-y-1 border-t border-card-border bg-background">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                    isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            <div className="border-t border-card-border mt-2 pt-2">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted"
              >
                <LogOut className="h-5 w-5" />
                Ir al Sitio
              </Link>
              <button
                onClick={async () => { await signOut(); window.location.href = "/login"; }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted hover:text-danger w-full"
              >
                <LogOut className="h-5 w-5" />
                Cerrar Sesión
              </button>
            </div>
          </nav>
        )}
      </div>

      <main className="flex-1 md:ml-64 pt-14 md:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
