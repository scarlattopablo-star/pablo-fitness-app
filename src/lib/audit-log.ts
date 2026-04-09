import { createClient } from "@supabase/supabase-js";

interface AuditEntry {
  admin_id: string;
  action: string;
  target_id?: string;
  details?: string;
}

export async function logAdminAction(entry: AuditEntry) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    await supabase.from("audit_logs").insert({
      admin_id: entry.admin_id,
      action: entry.action,
      target_id: entry.target_id || null,
      details: entry.details || null,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Audit log failed:", e);
    // Don't throw — audit failure shouldn't block operations
  }
}
