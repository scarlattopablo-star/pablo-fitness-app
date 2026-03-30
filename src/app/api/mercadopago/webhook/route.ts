import { NextRequest, NextResponse } from "next/server";
import { getPaymentInfo } from "@/lib/mercadopago";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.type === "payment") {
      const paymentId = body.data?.id;
      if (!paymentId) {
        return NextResponse.json({ error: "No payment ID" }, { status: 400 });
      }

      const payment = await getPaymentInfo(String(paymentId));

      if (payment.status === "approved") {
        // TODO: Activate subscription in Supabase
        // 1. Find user by payment email
        // 2. Create subscription record
        // 3. Generate training + nutrition plan
        console.log("Payment approved:", {
          id: payment.id,
          amount: payment.transaction_amount,
          email: payment.payer?.email,
          reference: payment.external_reference,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
