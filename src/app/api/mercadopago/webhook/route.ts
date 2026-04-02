import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPaymentInfo } from "@/lib/mercadopago";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || "";

function verifySignature(request: NextRequest, body: string): boolean {
  if (!WEBHOOK_SECRET) return true; // Skip if not configured yet
  const xSignature = request.headers.get("x-signature") || "";
  const xRequestId = request.headers.get("x-request-id") || "";
  const dataId = new URL(request.url).searchParams.get("data.id") || "";

  const parts = xSignature.split(",").reduce((acc: Record<string, string>, part) => {
    const [key, value] = part.split("=");
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});

  const ts = parts["ts"];
  const hash = parts["v1"];
  if (!ts || !hash) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const computed = crypto.createHmac("sha256", WEBHOOK_SECRET).update(manifest).digest("hex");
  return computed === hash;
}

function calculateEndDate(duration: string): string {
  const end = new Date();
  if (duration === "1-mes") end.setMonth(end.getMonth() + 1);
  else if (duration === "3-meses") end.setMonth(end.getMonth() + 3);
  else if (duration === "6-meses") end.setMonth(end.getMonth() + 6);
  else end.setFullYear(end.getFullYear() + 1);
  return end.toISOString().split("T")[0];
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);

    // Verify webhook signature
    if (!verifySignature(request, bodyText)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (body.type === "payment") {
      const paymentId = body.data?.id;
      if (!paymentId) {
        return NextResponse.json({ error: "No payment ID" }, { status: 400 });
      }

      const payment = await getPaymentInfo(String(paymentId));

      if (payment.status === "approved") {
        const adminClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Parse external_reference: "planSlug_duration_timestamp"
        const ref = payment.external_reference || "";
        const parts = ref.split("_");
        const planSlug = parts[0] || "";
        const duration = parts[1] || "1-mes";

        // Find user by payer email
        const payerEmail = payment.payer?.email;
        if (!payerEmail) {
          return NextResponse.json({ error: "No payer email" }, { status: 400 });
        }

        const { data: user } = await adminClient
          .from("profiles")
          .select("id")
          .eq("email", payerEmail)
          .single();

        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check for duplicate payment (idempotency)
        const { data: existingPayment } = await adminClient
          .from("payments")
          .select("id")
          .eq("mercadopago_id", String(payment.id))
          .single();

        if (existingPayment) {
          return NextResponse.json({ received: true, note: "Already processed" });
        }

        // Get plan info
        const { data: plan } = await adminClient
          .from("plans")
          .select("id, name")
          .eq("slug", planSlug)
          .single();

        // Create subscription
        const startDate = new Date().toISOString().split("T")[0];
        const endDate = calculateEndDate(duration);

        const { data: subscription } = await adminClient
          .from("subscriptions")
          .insert({
            user_id: user.id,
            plan_id: plan?.id || null,
            plan_slug: planSlug,
            plan_name: plan?.name || planSlug,
            duration,
            amount_paid: payment.transaction_amount,
            start_date: startDate,
            end_date: endDate,
            status: "active",
            mercadopago_payment_id: String(payment.id),
          })
          .select("id")
          .single();

        // Record payment
        await adminClient.from("payments").insert({
          user_id: user.id,
          subscription_id: subscription?.id || null,
          mercadopago_id: String(payment.id),
          amount: payment.transaction_amount,
          status: "approved",
          payment_method: payment.payment_method_id || null,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
