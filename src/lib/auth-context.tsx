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
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasPlans, setHasPlans] = useState(false);
  const [loading, setLoading] = useState(true);

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
          fetchSubscription(session.user.id);
          checkPlans(session.user.id);
        }
        setLoading(false);
      }).catch(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

      const { data } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null);
          if (session?.user) {
            fetchProfile(session.user.id);
            fetchSubscription(session.user.id);
            checkPlans(session.user.id);
          } else {
            setProfile(null);
            setSubscription(null);
            setHasPlans(false);
          }
        }
      );
      authSub = data.subscription;
    } catch {
      // In-app browsers may crash on auth calls - gracefully degrade
      clearTimeout(timeout);
      setLoading(false);
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
  const endDate = subscription ? new Date(subscription.end_date + "T23:59:59") : null;

  const hasActiveSubscription =
    hasPlans ||
    (!!subscription &&
    subscription.status === "active" &&
    !!endDate &&
    endDate >= today);

  const isExpired =
    !!subscription &&
    subscription.status === "active" &&
    !!endDate &&
    endDate < today;

  const isTrial =
    hasActiveSubscription &&
    !!subscription &&
    subscription.duration === "7-dias";

  const trialDaysLeft =
    isTrial && endDate
      ? Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  return (
    <AuthContext.Provider value={{ user, profile, subscription, loading, hasActiveSubscription, isExpired, isTrial, trialDaysLeft, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
