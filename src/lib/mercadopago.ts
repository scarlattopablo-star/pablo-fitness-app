const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;
const MP_API_URL = "https://api.mercadopago.com";

export interface MPPreferenceItem {
  title: string;
  description: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
}

export async function createPreference({
  items,
  payer,
  backUrls,
  externalReference,
  notificationUrl,
}: {
  items: MPPreferenceItem[];
  payer: { email: string; name: string };
  backUrls: { success: string; failure: string; pending: string };
  externalReference: string;
  notificationUrl?: string;
}) {
  const response = await fetch(`${MP_API_URL}/checkout/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items,
      payer: {
        email: payer.email,
        name: payer.name,
      },
      back_urls: backUrls,
      auto_return: "approved",
      external_reference: externalReference,
      notification_url: notificationUrl || `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/mercadopago/webhook`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MercadoPago error: ${error}`);
  }

  return response.json();
}

export async function getPaymentInfo(paymentId: string) {
  const response = await fetch(`${MP_API_URL}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get payment info");
  }

  return response.json();
}
