import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

// In-app browsers and SSR may not have localStorage available.
// Provide a memory fallback to prevent crashes.
const memoryStorage: Record<string, string> = {};
const fallbackStorage = {
  getItem: (key: string) => memoryStorage[key] ?? null,
  setItem: (key: string, value: string) => { memoryStorage[key] = value; },
  removeItem: (key: string) => { delete memoryStorage[key]; },
};

function getSafeStorage() {
  if (typeof window === "undefined") return fallbackStorage;
  try {
    const key = "__ls_test__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return undefined; // use default localStorage
  } catch {
    return fallbackStorage;
  }
}

const storage = getSafeStorage();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  ...(storage ? { auth: { storage } } : {}),
});
