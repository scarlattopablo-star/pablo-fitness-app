// Send push notification to all clients with push enabled (except direct clients and admin)
// Usage: node scripts/send-push-offer.mjs

import "dotenv/config";
import webpush from "web-push";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ADMIN_ID = "fbc38340-5d8f-4f5f-91e0-46e3a8cb8d2f";

const VAPID_PUBLIC = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").replace(/[=\s]+$/g, "").trim();
const VAPID_PRIVATE = (process.env.VAPID_PRIVATE_KEY || "").replace(/[=\s]+$/g, "").trim();

webpush.setVapidDetails("mailto:scarlattopablo@gmail.com", VAPID_PUBLIC, VAPID_PRIVATE);

async function supabaseGet(table, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  return res.json();
}

async function main() {
  console.log("Fetching push subscriptions...\n");

  const subs = await supabaseGet("push_subscriptions", "select=user_id,endpoint,p256dh,auth");
  const directCodes = await supabaseGet("free_access_codes", "used=eq.true&plan_slug=eq.direct-client&select=used_by");
  const directIds = new Set(directCodes.filter(c => c.used_by).map(c => c.used_by));

  // Exclude admin and direct clients
  const targets = subs.filter(s => s.user_id !== ADMIN_ID && !directIds.has(s.user_id));

  console.log(`Total push subscriptions: ${subs.length}`);
  console.log(`Targets (excl admin + direct): ${targets.length}`);
  console.log("---\n");

  const payload = JSON.stringify({
    title: "30% OFF tu plan personalizado",
    body: "Oferta exclusiva: $4.700 el trimestre (antes $6.720). Solo esta semana. Activa tu plan ahora.",
    url: "/dashboard",
  });

  let sent = 0, failed = 0;

  for (const sub of targets) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
      console.log(`✓ Push sent to ${sub.user_id}`);
    } catch (err) {
      failed++;
      console.log(`✗ Push failed for ${sub.user_id}: ${err.statusCode || err.message}`);
    }
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n--- Done! Sent: ${sent}, Failed: ${failed}`);
}

main().catch(console.error);
