"use client";

import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth-context";
import { PWAInstallBanner } from "@/components/pwa-install";
import { VisitTracker } from "@/components/visit-tracker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        {children}
        <VisitTracker />
        <PWAInstallBanner />
      </AuthProvider>
    </I18nProvider>
  );
}
