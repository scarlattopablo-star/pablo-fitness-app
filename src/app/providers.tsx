"use client";

import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth-context";
import { PWAInstallBanner } from "@/components/pwa-install";
import { VisitTracker } from "@/components/visit-tracker";
import { RegisterSW } from "@/components/register-sw";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        {children}
        <VisitTracker />
        <RegisterSW />
        <PWAInstallBanner />
      </AuthProvider>
    </I18nProvider>
  );
}
