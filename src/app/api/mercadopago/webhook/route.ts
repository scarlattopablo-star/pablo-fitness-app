import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPaymentInfo } from "@/lib/mercadopago";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || "";

function log(level: "INFO" | "WARN" | "ERROR", message: string, data?: Record<string, unknown>) {
  const entry = { timestamp: new Date().toISOString(), level, message, ...data };
  if (level === "ERROR") console.error("[MP-WEBHOOK]", JSON.stringify(entry));
  else console.log("[MP-WEBHOOK]", JSON.stringify(entry));
}

function verifySignature(request: NextRequest): boolean {
  if (!WEBHOOK_SECRET) {
    log("WARN", "MP_WEBHOOK_SECRET not configured, skipping signature verification");
    return true;
  }
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

// Parse external_reference: "planSlug|duration|userId|timestamp"
// Also supports legacy format: "planSlug_duration_timestamp"
function parseExternalReference(ref: string) {
  if (ref.includes("|")) {
    const [planSlug, duration, userId] = ref.split("|");
    return { planSlug: planSlug || "", duration: duration || "1-mes", userId: userId || "" };
  }
  // Legacy format: planSlug_duration_timestamp
  const parts = ref.split("_");
  return { planSlug: parts[0] || "", duration: parts[1] || "1-mes", userId: "" };
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE env vars (URL or SERVICE_ROLE_KEY)");
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);

    log("INFO", "Webhook received", { type: body.type, action: body.action, dataId: body.data?.id });

    // Verify webhook signature
    if (!verifySignature(request)) {
      log("ERROR", "Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Only process payment events
    if (body.type !== "payment") {
      log("INFO", "Ignoring non-payment event", { type: body.type });
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      log("ERROR", "No payment ID in webhook body");
      return NextResponse.json({ error: "No payment ID" }, { status: 400 });
    }

    // Fetch payment details from MercadoPago API
    const payment = await getPaymentInfo(String(paymentId));
    log("INFO", "Payment info fetched", {
      paymentId: payment.id,
      status: payment.status,
      amount: payment.transaction_amount,
      payerEmail: payment.payer?.email,
      externalRef: payment.external_reference,
    });

    if (payment.status !== "approved") {
      log("INFO", "Payment not approved, skipping", { status: payment.status });
      return NextResponse.json({ received: true, note: `Status: ${payment.status}` });
    }

    const adminClient = getAdminClient();

    // Check for duplicate payment (idempotency)
    const { data: existingPayment } = await adminClient
      .from("payments")
      .select("id")
      .eq("mercadopago_id", String(payment.id))
      .single();

    if (existingPayment) {
      log("INFO", "Payment already processed (idempotency)", { mercadopagoId: payment.id });
      return NextResponse.json({ received: true, note: "Already processed" });
    }

    // Parse external_reference
    const ref = payment.external_reference || "";
    const { planSlug, duration, userId: refUserId } = parseExternalReference(ref);
    log("INFO", "Parsed external_reference", { ref, planSlug, duration, refUserId });

    // Find user - try by userId first (most reliable), then by email
    let userId: string | null = null;

    if (refUserId) {
      const { data: userById } = await adminClient
        .from("profiles")
        .select("id")
        .eq("id", refUserId)
        .single();
      if (userById) {
        userId = userById.id;
        log("INFO", "User found by ID from external_reference", { userId });
      }
    }

    if (!userId) {
      const payerEmail = payment.payer?.email;
      if (payerEmail) {
        const { data: userByEmail } = await adminClient
          .from("profiles")
          .select("id")
          .eq("email", payerEmail)
          .single();
        if (userByEmail) {
          userId = userByEmail.id;
          log("INFO", "User found by payer email", { userId, payerEmail });
        } else {
          // Try case-insensitive match
          const { data: userByEmailLower } = await adminClient
            .from("profiles")
            .select("id")
            .ilike("email", payerEmail)
            .single();
          if (userByEmailLower) {
            userId = userByEmailLower.id;
            log("INFO", "User found by email (case-insensitive)", { userId, payerEmail });
          }
        }
      }
    }

    if (!userId) {
      log("ERROR", "User not found by any method", {
        refUserId,
        payerEmail: payment.payer?.email,
        externalRef: ref,
      });
      // Return 200 so MercadoPago doesn't retry infinitely - but log the error
      return NextResponse.json({ received: true, error: "User not found" });
    }

    // Get plan info
    const { data: plan } = await adminClient
      .from("plans")
      .select("id, name")
      .eq("slug", planSlug)
      .single();

    if (!plan) {
      log("WARN", "Plan not found by slug, will use slug as name", { planSlug });
    }

    // Create subscription
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = calculateEndDate(duration);

    const { data: subscription, error: subError } = await adminClient
      .from("subscriptions")
      .insert({
        user_id: userId,
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

    if (subError) {
      log("ERROR", "Failed to create subscription", { error: subError.message, userId, planSlug });
      return NextResponse.json({ error: "Subscription creation failed" }, { status: 500 });
    }

    log("INFO", "Subscription created", {
      subscriptionId: subscription?.id,
      userId,
      planSlug,
      duration,
      startDate,
      endDate,
    });

    // Record payment
    const { error: payError } = await adminClient.from("payments").insert({
      user_id: userId,
      subscription_id: subscription?.id || null,
      mercadopago_id: String(payment.id),
      amount: payment.transaction_amount,
      status: "approved",
      payment_method: payment.payment_method_id || null,
    });

    if (payError) {
      log("ERROR", "Failed to record payment (subscription was created)", {
        error: payError.message,
        subscriptionId: subscription?.id,
      });
    } else {
      log("INFO", "Payment recorded successfully", {
        mercadopagoId: payment.id,
        amount: payment.transaction_amount,
      });
    }

    return NextResponse.json({ received: true, subscriptionId: subscription?.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log("ERROR", "Webhook processing failed", { error: message });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
