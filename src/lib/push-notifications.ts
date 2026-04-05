import { supabase } from "./supabase";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request push permission AND subscribe + save to DB.
 * Also re-syncs subscription if permission was already granted.
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!isPushSupported()) return false;
  if (!VAPID_PUBLIC_KEY) {
    console.warn("[Push] VAPID_PUBLIC_KEY not set");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  return syncPushSubscription();
}

/**
 * Ensure push subscription exists in DB.
 * Call this whenever the user has permission granted.
 */
export async function syncPushSubscription(): Promise<boolean> {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) return false;
  if (Notification.permission !== "granted") return false;

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription first
    let subscription = await registration.pushManager.getSubscription();

    // If no subscription, create one
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }

    await savePushSubscription(subscription);
    return true;
  } catch (err) {
    console.error("[Push] Failed to sync subscription:", err);
    return false;
  }
}

async function savePushSubscription(subscription: PushSubscription) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn("[Push] No session, cannot save subscription");
    return;
  }

  const subJson = subscription.toJSON();

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      p256dh: subJson.keys?.p256dh,
      auth: subJson.keys?.auth,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[Push] Failed to save subscription:", err);
  }
}

export async function sendPushNotification(recipientId: string, title: string, body: string, url: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn("[Push] No session, cannot send push");
    return;
  }

  const res = await fetch("/api/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ recipientId, title, body, url }),
  });

  const result = await res.json();
  console.log("[Push] Send result:", result);
}

export async function sendGeneralPushNotification(senderName: string, body: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn("[Push] No session, cannot send general push");
    return;
  }

  const res = await fetch("/api/push/send-general", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ title: `${senderName} en Chat General`, body }),
  });

  const result = await res.json();
  console.log("[Push] General send result:", result);
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

export function getPushPermissionState(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined") return "unsupported";
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}
