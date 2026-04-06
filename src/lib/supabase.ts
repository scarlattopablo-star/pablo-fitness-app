import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

// In-app browsers (e.g. iPhone Camera) may block localStorage.
// Provide a memory fallback to prevent crashes.
function isLocalStorageAvailable() {
  try {
    const key = "__test__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

const memoryStorage: Record<string, string> = {};
const safeStorage = isLocalStorageAvailable()
  ? undefined // use default localStorage
  : {
      getItem: (key: string) => memoryStorage[key] ?? null,
      setItem: (key: string, value: string) => { memoryStorage[key] = value; },
      removeItem: (key: string) => { delete memoryStorage[key]; },
    };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  ...(safeStorage ? { auth: { storage: safeStorage } } : {}),
});
