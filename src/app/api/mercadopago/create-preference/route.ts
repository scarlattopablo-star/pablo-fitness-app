import { NextRequest, NextResponse } from "next/server";
import { createPreference } from "@/lib/mercadopago";
import { DURATION_LABELS, getPlanBySlug } from "@/lib/plans-data";

// Upsell "Plan Personalizado" del dashboard (src/app/dashboard/page.tsx)
const CUSTOM_PLAN_PRICES: Record<string, number> = { "1-mes": 3200, "3-meses": 4700 };

// El precio nunca se confia al navegador: solo se aceptan precios de lista.
function getListPrices(planSlug: string, duration: string): number[] {
  if (planSlug === "plan-personalizado") {
    return CUSTOM_PLAN_PRICES[duration] ? [CUSTOM_PLAN_PRICES[duration]] : [];
  }
  const plan = getPlanBySlug(planSlug);
  if (!plan) return [];
  const key = duration as keyof typeof plan.prices;
  return [plan.prices[key], plan.couplePrices?.[key]].filter((p): p is number => !!p && p > 0);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planName, planSlug, duration, price, email, name, userId, referralCode } = body;

    if (!planName || !planSlug || !duration || !price || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const listPrices = getListPrices(planSlug, duration);
    if (!listPrices.includes(Number(price))) {
      return NextResponse.json({ error: "Precio invalido" }, { status: 400 });
    }

    const durationLabel = DURATION_LABELS[duration] || duration;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Apply 15% referral discount if valid code
    let finalPrice = Number(price);
    if (referralCode) {
      finalPrice = Math.round(finalPrice * 0.85);
    }

    const preference = await createPreference({
      items: [
        {
          title: `Plan ${planName} - ${durationLabel}${referralCode ? " (15% OFF referido)" : ""}`,
          description: `Plan de entrenamiento y nutrición personalizado - Pablo Scarlatto Entrenamientos`,
          quantity: 1,
          unit_price: finalPrice,
          currency_id: "UYU",
        },
      ],
      payer: { email, name },
      backUrls: {
        success: `${appUrl}/compra-exitosa?plan=${planSlug}&duration=${duration}`,
        failure: `${appUrl}/planes/${planSlug}?error=payment_failed`,
        pending: `${appUrl}/planes/${planSlug}?status=pending`,
      },
      // Include referral code in external reference for webhook processing
      externalReference: `${planSlug}|${duration}|${userId || ""}|${Date.now()}${referralCode ? `|ref:${referralCode}` : ""}`,
      notificationUrl: `${appUrl}/api/mercadopago/webhook`,
    });

    return NextResponse.json({
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create payment preference" },
      { status: 500 }
    );
  }
}
