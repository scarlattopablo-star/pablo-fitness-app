"use client";

import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth-context";
import { VisitTracker } from "@/components/visit-tracker";
import { ErrorBoundary } from "@/components/error-boundary";

// Renders children on the server too: the page paints before JS hydrates.
// Hydration safety is handled where the divergence lives (I18nProvider reads
// localStorage only after mount), not by blanking the whole app.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <AuthProvider>
          {children}
          <VisitTracker />
        </AuthProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
