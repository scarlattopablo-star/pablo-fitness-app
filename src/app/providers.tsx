"use client";

import { I18nProvider } from "@/lib/i18n";
import { PWAInstallBanner } from "@/components/pwa-install";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      {children}
      <PWAInstallBanner />
    </I18nProvider>
  );
}
