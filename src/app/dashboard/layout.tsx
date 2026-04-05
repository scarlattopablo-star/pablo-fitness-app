"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Dumbbell, LayoutDashboard, ClipboardList, TrendingUp,
  User, BookOpen, LogOut, Menu, X, Download, Smartphone, Share, MessageCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { InstagramIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";
import { getPhotoUrl } from "@/lib/upload-photo";
import { syncPushSubscription, isPushSupported, requestPushPermission } from "@/lib/push-notifications";
import { supabase } from "@/lib/supabase";
import ChatNotificationToast, { triggerChatNotification } from "@/components/chat-notification-toast";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Resumen" },
  { href: "/dashboard/plan", icon: ClipboardList, label: "Mi Plan" },
  { href: "/dashboard/progreso", icon: TrendingUp, label: "Progreso" },
  { href: "/dashboard/ejercicios", icon: BookOpen, label: "Ejercicios" },
  { href: "/dashboard/chat", icon: MessageCircle, label: "Gym Bro" },
  { href: "/dashboard/perfil", icon: User, label: "Perfil" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, profile, loading, signOut, hasActiveSubscription } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showPushBanner, setShowPushBanner] = useState(false);

  // Redirect to login if no session (fixes iOS standalone PWA)
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [loading, user]);

  // Global realtime listener for chat notifications (toast + sound)
  const pathnameRef = useRef(pathname);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("layout-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as { sender_id: string; conversation_id: string; content: string };
          if (msg.sender_id === user.id) return;
          if (pathnameRef.current?.includes(msg.conversation_id)) return;

          const { data: p } = await supabase.from("profiles").select("full_name").eq("id", msg.sender_id).single();
          triggerChatNotification({
            senderName: p?.full_name || "Gym Bro",
            message: msg.content.substring(0, 80),
            url: `/dashboard/chat/${msg.conversation_id}`,
          });
        }
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "general_messages" },
        async (payload) => {
          const msg = payload.new as { sender_id: string; content: string };
          if (msg.sender_id === user.id) return;
          if (pathnameRef.current?.includes("/chat/general")) return;

          const { data: p } = await supabase.from("profiles").select("full_name").eq("id", msg.sender_id).single();
          triggerChatNotification({
            senderName: p?.full_name || "Gym Bro",
            message: msg.content.substring(0, 80),
            url: "/dashboard/chat/general",
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (profile?.avatar_url) {
      getPhotoUrl(profile.avatar_url).then(url => { if (url) setAvatarUrl(url); });
    }
  }, [profile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone);
    if (standalone) setIsInstalled(true);

    // Push notifications setup
    try {
      const notifAvailable = "Notification" in window;
      if (notifAvailable && Notification.permission === "granted") {
        syncPushSubscription();
      } else {
        // Always show banner unless dismissed
        if (!localStorage.getItem("push-banner-dismissed")) {
          setShowPushBanner(true);
        }
      }
    } catch {
      // If anything fails, still show banner
      if (!localStorage.getItem("push-banner-dismissed")) {
        setShowPushBanner(true);
      }
    }

    // Pick up prompt captured globally (fires before React mounts)
    const win = window as unknown as Record<string,unknown>;
    if (win.__pwaInstallPrompt) {
      setDeferredPrompt(win.__pwaInstallPrompt as Event);
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as unknown as Record<string,unknown>).__pwaInstallPrompt = e;
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Poll briefly in case the global event arrives slightly after mount
    const poll = setInterval(() => {
      const p = (window as unknown as Record<string,unknown>).__pwaInstallPrompt;
      if (p) { setDeferredPrompt(p as Event); clearInterval(poll); }
    }, 500);
    const stopPoll = setTimeout(() => clearInterval(poll), 5000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearInterval(poll);
      clearTimeout(stopPoll);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      (deferredPrompt as unknown as { prompt: () => Promise<void> }).prompt();
      const { outcome } = await (deferredPrompt as unknown as { userChoice: Promise<{ outcome: string }> }).userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(!showIOSGuide);
    } else {
      // Android: try to pick up the global prompt one more time
      const win = window as unknown as Record<string,unknown>;
      if (win.__pwaInstallPrompt) {
        const p = win.__pwaInstallPrompt as unknown as { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
        p.prompt();
        const { outcome } = await p.userChoice;
        if (outcome === "accepted") setIsInstalled(true);
        win.__pwaInstallPrompt = null;
        setDeferredPrompt(null);
      } else {
        // Last resort: reload to trigger beforeinstallprompt fresh
        window.location.reload();
      }
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
            <img src="/logo-pablo.jpg" alt="Pablo Scarlatto" className="h-28 w-auto" style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
          </Link>
        </div>

        <div className="line-accent mx-5" />

        {/* User */}
        {profile && (
          <div className="px-5 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center">
                  <span className="text-xs font-black text-black">{profile.full_name?.charAt(0) || "U"}</span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{profile.full_name}</p>
              <p className="text-[10px] text-muted truncate">{profile.email}</p>
            </div>
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
            <img src="/logo-pablo.jpg" alt="Pablo Scarlatto" className="h-16 w-auto" style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
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

      {/* Push notification permission banner (iOS PWA) */}
      {showPushBanner && (
        <div className="fixed bottom-20 left-2 right-2 z-50 md:left-auto md:right-4 md:max-w-sm md:bottom-4">
          <div className="glass-card rounded-2xl p-4 border border-primary/30 shadow-lg shadow-black/30">
            <p className="text-sm font-semibold mb-2">Activar notificaciones</p>
            <p className="text-xs text-muted mb-3">Recibí alertas de mensajes con sonido aunque no estés en la app</p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!("Notification" in window) || !("PushManager" in window)) {
                    // iOS Safari: can't do push, need PWA
                    alert("Para recibir notificaciones con la app cerrada, instalá la app: Compartir (⬆) > Agregar a pantalla de inicio. Después abrila desde ahí y tocá Activar.");
                    setShowPushBanner(false);
                    return;
                  }
                  const granted = await requestPushPermission();
                  if (granted) await syncPushSubscription();
                  setShowPushBanner(false);
                }}
                className="flex-1 gradient-primary text-black font-bold text-sm py-2.5 rounded-xl"
              >
                Activar
              </button>
              <button
                onClick={() => { setShowPushBanner(false); localStorage.setItem("push-banner-dismissed", "true"); }}
                className="px-4 py-2.5 text-sm text-muted hover:text-white rounded-xl"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">{children}</div>
      </main>

      {/* In-app chat notification toast */}
      <ChatNotificationToast />
    </div>
  );
}
