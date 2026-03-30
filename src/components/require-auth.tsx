"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Dumbbell } from "lucide-react";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Dumbbell className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

export function RequireSubscription({ children }: { children: React.ReactNode }) {
  const { user, hasActiveSubscription, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && !hasActiveSubscription) {
      router.push("/sin-plan");
    }
  }, [user, hasActiveSubscription, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Dumbbell className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (!user || !hasActiveSubscription) return null;

  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && profile && !profile.is_admin) {
      router.push("/dashboard");
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Dumbbell className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (!user || !profile?.is_admin) return null;

  return <>{children}</>;
}
