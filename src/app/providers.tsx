"use client";

import { useState, useEffect } from "react";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth-context";
import { VisitTracker } from "@/components/visit-tracker";
import { ErrorBoundary } from "@/components/error-boundary";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show nothing until client mounts to avoid hydration mismatch in in-app browsers
  if (!mounted) {
    return <div style={{ minHeight: "100vh" }} />;
  }

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
