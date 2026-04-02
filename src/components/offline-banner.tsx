"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 mb-4 flex items-center gap-2">
      <WifiOff className="h-4 w-4 text-warning shrink-0" />
      <p className="text-xs text-warning font-medium">Sin conexion — mostrando datos guardados</p>
    </div>
  );
}
