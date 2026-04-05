"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function getDeviceInfo() {
  if (typeof navigator === "undefined") return { isIOS: false, isAndroid: false, isStandalone: false };
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    || ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone);
  return { isIOS, isAndroid, isStandalone: !!isStandalone };
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("pwa-dismissed") === "true") return;

    const { isStandalone } = getDeviceInfo();
    if (isStandalone) return;

    // Pick up prompt captured globally (fires before React mounts)
    const win = window as unknown as Record<string,unknown>;
    if (win.__pwaInstallPrompt) {
      setDeferredPrompt(win.__pwaInstallPrompt as BeforeInstallPromptEvent);
      setShowBanner(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // En iOS no se dispara beforeinstallprompt, mostrar banner igualmente
    const { isIOS } = getDeviceInfo();
    if (isIOS) {
      setTimeout(() => setShowBanner(true), 2000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem("pwa-dismissed", "true");
  };

  if (!showBanner || dismissed) return null;

  const { isIOS } = getDeviceInfo();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-md mx-auto glass-card rounded-2xl p-4 border border-primary/30 shadow-lg shadow-primary/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <Smartphone className="h-5 w-5 text-black" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Instala la App</p>
            <p className="text-xs text-muted mt-0.5">
              {isIOS
                ? "Toca Compartir (⬆) y luego \"Agregar a Inicio\""
                : "Accede a tu plan desde el celular sin abrir el navegador"}
            </p>
          </div>
          <button onClick={handleDismiss} className="text-muted hover:text-white shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="w-full mt-3 gradient-primary text-black font-semibold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Download className="h-4 w-4" />
            Instalar App
          </button>
        )}
      </div>
    </div>
  );
}

export function PWAInstallButton({ label }: { label?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ isIOS: false, isAndroid: false, isStandalone: false });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const info = getDeviceInfo();
    setDeviceInfo(info);

    if (info.isStandalone) {
      setInstalled(true);
      return;
    }

    // Pick up prompt captured globally (fires before React mounts)
    const win = window as unknown as Record<string,unknown>;
    if (win.__pwaInstallPrompt) {
      setDeferredPrompt(win.__pwaInstallPrompt as BeforeInstallPromptEvent);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (deviceInfo.isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (installed) {
    return (
      <div className="flex items-center justify-center gap-2 text-primary text-sm font-medium py-4">
        <Smartphone className="h-4 w-4" />
        App instalada
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleInstall}
        className="gradient-primary text-black font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity w-full"
      >
        <Download className="h-5 w-5" />
        {label || "Instalar App en tu Celular"}
      </button>

      {showIOSGuide && (
        <div className="mt-4 bg-primary/5 border border-primary/20 rounded-xl p-4 animate-fade-in-up">
          <p className="font-bold text-sm mb-3 flex items-center gap-2">
            <Share className="h-4 w-4 text-primary" />
            Como instalar en iPhone/iPad
          </p>
          <ol className="space-y-2 text-sm text-muted">
            <li className="flex gap-2">
              <span className="text-primary font-bold shrink-0">1.</span>
              <span>Toca el boton <strong className="text-white">Compartir</strong> (⬆) en la barra de Safari</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold shrink-0">2.</span>
              <span>Desplaza hacia abajo y toca <strong className="text-white">&quot;Agregar a pantalla de inicio&quot;</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold shrink-0">3.</span>
              <span>Toca <strong className="text-white">&quot;Agregar&quot;</strong> para confirmar</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
