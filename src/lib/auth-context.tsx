"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  is_admin: boolean;
  deleted_at?: string | null;
  avatar_url?: string | null;
}

interface Subscription {
  id: string;
  plan_slug: string;
  plan_name: string;
  duration: string;
  status: string;
  start_date: string;
  end_date: string;
  amount_paid: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
  loading: boolean;
  hasActiveSubscription: boolean;
  isExpired: boolean;
  isTrial: boolean;
  trialDaysLeft: number;
  isDirectClient: boolean;
  /** true hasta que terminaron de cargar suscripcion/codigos/planes del usuario */
  accessLoading: boolean;
  /** Cliente viejo sin acceso vigente que entra por el periodo de gracia */
  inGracePeriod: boolean;
  graceDaysLeft: number;
  signOut: () => Promise<void>;
}

// Ultimo dia de acceso para clientes viejos sin suscripcion vigente.
export const LEGACY_GRACE_UNTIL = "2026-10-23";

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  subscription: null,
  loading: true,
  hasActiveSubscription: false,
  isExpired: false,
  isTrial: false,
  trialDaysLeft: 0,
  isDirectClient: false,
  accessLoading: true,
  inGracePeriod: false,
  graceDaysLeft: 0,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasPlans, setHasPlans] = useState(false);
  const [isDirectClient, setIsDirectClient] = useState(false);
  const [hasFreeCode, setHasFreeCode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(true);

  // Carga todo lo que define si el usuario tiene acceso (suscripcion, codigo, planes)
  async function loadAccess(userId: string) {
    setAccessLoading(true);
    try {
      await Promise.all([fetchSubscription(userId), checkPlans(userId), checkDirectClient(userId)]);
    } catch {
      // Si falla la red, no bloqueamos la UI indefinidamente
    } finally {
      setAccessLoading(false);
    }
  }

  useEffect(() => {
    // Timeout: if getSession takes too long or fails, stop loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    let authSub: { unsubscribe: () => void } | null = null;

    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        clearTimeout(timeout);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
          loadAccess(session.user.id);
        } else {
          setAccessLoading(false);
        }
        setLoading(false);
      }).catch(() => {
        clearTimeout(timeout);
        setLoading(false);
        setAccessLoading(false);
      });

      const { data } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null);
          if (session?.user) {
            fetchProfile(session.user.id);
            loadAccess(session.user.id);
          } else {
            setProfile(null);
            setSubscription(null);
            setHasPlans(false);
            setIsDirectClient(false);
            setHasFreeCode(false);
            setAccessLoading(false);
          }
        }
      );
      authSub = data.subscription;
    } catch {
      // In-app browsers may crash on auth calls - gracefully degrade
      clearTimeout(timeout);
      setLoading(false);
      setAccessLoading(false);
    }

    return () => { if (authSub) authSub.unsubscribe(); };
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) {
      // If account was soft-deleted, sign out immediately
      if (data.deleted_at) {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSubscription(null);
        return;
      }
      setProfile(data);
    }
  }

  async function checkPlans(userId: string) {
    const { count } = await supabase
      .from("training_plans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (count && count > 0) { setHasPlans(true); return; }
    const { count: nCount } = await supabase
      .from("nutrition_plans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (nCount && nCount > 0) { setHasPlans(true); return; }
  }

  async function checkDirectClient(userId: string) {
    // Codigos de acceso gratis que Pablo genero desde el admin y este usuario canjeo
    const { data: codes } = await supabase
      .from("free_access_codes")
      .select("plan_slug")
      .eq("used_by", userId);
    if (codes && codes.length > 0) setHasFreeCode(true);
    if (codes?.some((c) => c.plan_slug === "direct-client")) { setIsDirectClient(true); return; }

    // Also check subscription (clients converted via admin panel)
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("plan_slug", "direct-client")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (sub) setIsDirectClient(true);
  }

  async function fetchSubscription(userId: string) {
    const { data } = await supabase
      .from("subscriptions")
      .select("*, plans(slug, name)")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setSubscription({
        id: data.id,
        plan_slug: data.plans?.slug || "",
        plan_name: data.plans?.name || "",
        duration: data.duration,
        status: data.status,
        start_date: data.start_date,
        end_date: data.end_date,
        amount_paid: data.amount_paid || 0,
      });
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore signOut errors
    }
    setUser(null);
    setProfile(null);
    setSubscription(null);
  };

  // Compare dates without time to avoid timezone issues (end_date is DATE, not TIMESTAMPTZ)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Suscripcion $0 que NO viene de un codigo de Pablo (prueba gratis vieja de la web): 30 dias.
  // Las que vienen de un codigo respetan el end_date que definio Pablo.
  const isFreeSubscription = !!subscription && subscription.amount_paid === 0 && !isDirectClient && !hasFreeCode;

  let effectiveEndDate: Date | null = null;
  if (subscription) {
    if (isFreeSubscription) {
      // All free users get 30 days (primer mes gratis)
      const trialDays = 30;
      const trialEnd = new Date(subscription.start_date + "T23:59:59");
      trialEnd.setDate(trialEnd.getDate() + trialDays);
      effectiveEndDate = trialEnd;
    } else {
      effectiveEndDate = new Date(subscription.end_date + "T23:59:59");
    }
  }

  const hasValidSubscription =
    !!subscription &&
    subscription.status === "active" &&
    !!effectiveEndDate &&
    effectiveEndDate >= today;

  // Periodo de gracia: clientes que ya tenian plan pero sin acceso vigente
  // siguen entrando hasta esta fecha; despues tienen que pagar (o Pablo les da acceso).
  const graceEnd = new Date(LEGACY_GRACE_UNTIL + "T23:59:59");
  const inGracePeriod = !hasValidSubscription && hasPlans && graceEnd >= today;
  const graceDaysLeft = inGracePeriod
    ? Math.max(0, Math.ceil((graceEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const hasActiveSubscription = hasValidSubscription || inGracePeriod;

  const isExpired =
    !!subscription &&
    subscription.status === "active" &&
    !!effectiveEndDate &&
    effectiveEndDate < today;

  const isTrial =
    hasActiveSubscription &&
    !!subscription &&
    (subscription.duration === "7-dias" || isFreeSubscription);

  const trialDaysLeft =
    isTrial && effectiveEndDate
      ? Math.max(0, Math.ceil((effectiveEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  return (
    <AuthContext.Provider value={{ user, profile, subscription, loading, hasActiveSubscription, isExpired, isTrial, trialDaysLeft, isDirectClient, accessLoading, inGracePeriod, graceDaysLeft, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
