"use client";

import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth-context";
import { VisitTracker } from "@/components/visit-tracker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        {children}
        <VisitTracker />
      </AuthProvider>
    </I18nProvider>
  );
}
