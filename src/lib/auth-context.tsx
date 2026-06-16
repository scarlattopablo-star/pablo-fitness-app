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
  signOut: () => Promise<void>;
}

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
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasPlans, setHasPlans] = useState(false);
  const [isDirectClient, setIsDirectClient] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    // Tracks which user we've already loaded data for, so the initial
    // INITIAL_SESSION event and any later token refresh don't re-run the
    // four profile/subscription queries for the same user.
    let loadedUserId: string | null = null;

    // Safety net: if onAuthStateChange never emits (rare in-app browser
    // failure), stop blocking the UI after 2s.
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 2000);

    // Run all per-user lookups concurrently instead of one after another.
    function loadUserData(userId: string) {
      void Promise.all([
        fetchProfile(userId),
        fetchSubscription(userId),
        checkPlans(userId),
        checkDirectClient(userId),
      ]);
    }

    let authSub: { unsubscribe: () => void } | null = null;

    try {
      // onAuthStateChange fires an INITIAL_SESSION event right after
      // registration, so we no longer need a separate getSession() call
      // (which previously doubled every query on first load).
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        const sessionUser = session?.user ?? null;
        if (!mounted) return;

        setUser(sessionUser);

        if (sessionUser) {
          if (loadedUserId !== sessionUser.id) {
            loadedUserId = sessionUser.id;
            // IMPORTANT: defer Supabase calls out of this callback.
            // supabase-js holds an internal lock while it runs, and calling
            // queries or auth methods synchronously here can deadlock and
            // hang the app on login/token refresh.
            setTimeout(() => { if (mounted) loadUserData(sessionUser.id); }, 0);
          }
        } else {
          loadedUserId = null;
          setProfile(null);
          setSubscription(null);
          setHasPlans(false);
          setIsDirectClient(false);
        }

        clearTimeout(timeout);
        setLoading(false);
      });
      authSub = data.subscription;
    } catch {
      // In-app browsers may crash on auth calls - gracefully degrade
      clearTimeout(timeout);
      setLoading(false);
    }

    return () => {
      mounted = false;
      clearTimeout(timeout);
      if (authSub) authSub.unsubscribe();
    };
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
    // Check free_access_codes (clients who entered via direct-client code)
    const { data } = await supabase
      .from("free_access_codes")
      .select("id")
      .eq("used_by", userId)
      .eq("plan_slug", "direct-client")
      .limit(1)
      .maybeSingle();
    if (data) { setIsDirectClient(true); return; }

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

  // For free ($0) non-direct-client subscriptions: enforce 30-day trial limit
  const isFreeSubscription = !!subscription && subscription.amount_paid === 0 && !isDirectClient;

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

  const hasActiveSubscription =
    hasPlans ||
    (!!subscription &&
    subscription.status === "active" &&
    !!effectiveEndDate &&
    effectiveEndDate >= today);

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
    <AuthContext.Provider value={{ user, profile, subscription, loading, hasActiveSubscription, isExpired, isTrial, trialDaysLeft, isDirectClient, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
