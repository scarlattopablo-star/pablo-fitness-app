import { NextRequest, NextResponse } from "next/server";
import { createPreference } from "@/lib/mercadopago";
import { DURATION_LABELS } from "@/lib/plans-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planName, planSlug, duration, price, email, name, userId } = body;

    if (!planName || !duration || !price || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const durationLabel = DURATION_LABELS[duration] || duration;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    const preference = await createPreference({
      items: [
        {
          title: `Plan ${planName} - ${durationLabel}`,
          description: `Plan de entrenamiento y nutrición personalizado - Pablo Scarlatto Entrenamientos`,
          quantity: 1,
          unit_price: Number(price),
          currency_id: "UYU",
        },
      ],
      payer: { email, name },
      backUrls: {
        success: `${appUrl}/compra-exitosa?plan=${planSlug}&duration=${duration}`,
        failure: `${appUrl}/planes/${planSlug}?error=payment_failed`,
        pending: `${appUrl}/planes/${planSlug}?status=pending`,
      },
      externalReference: `${planSlug}|${duration}|${userId || ""}|${Date.now()}`,
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
