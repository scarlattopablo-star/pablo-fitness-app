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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  subscription: null,
  loading: true,
  hasActiveSubscription: false,
  isExpired: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchSubscription(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
          fetchSubscription(session.user.id);
        } else {
          setProfile(null);
          setSubscription(null);
        }
      }
    );

    return () => authSub.unsubscribe();
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

  async function fetchSubscription(userId: string) {
    const { data } = await supabase
      .from("subscriptions")
      .select("*, plans(slug, name)")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

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
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSubscription(null);
  };

  // Compare dates without time to avoid timezone issues (end_date is DATE, not TIMESTAMPTZ)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = subscription ? new Date(subscription.end_date + "T23:59:59") : null;

  const hasActiveSubscription =
    !!subscription &&
    subscription.status === "active" &&
    !!endDate &&
    endDate >= today;

  const isExpired =
    !!subscription &&
    subscription.status === "active" &&
    !!endDate &&
    endDate < today;

  return (
    <AuthContext.Provider value={{ user, profile, subscription, loading, hasActiveSubscription, isExpired, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
