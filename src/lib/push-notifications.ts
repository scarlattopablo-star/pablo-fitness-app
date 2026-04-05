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

export async function requestPushPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!VAPID_PUBLIC_KEY) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });

    await savePushSubscription(subscription);
    return true;
  } catch {
    return false;
  }
}

async function savePushSubscription(subscription: PushSubscription) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const subJson = subscription.toJSON();

  await fetch("/api/push/subscribe", {
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
}

export async function sendPushNotification(recipientId: string, title: string, body: string, url: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await fetch("/api/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ recipientId, title, body, url }),
  });
}

export async function sendGeneralPushNotification(senderName: string, body: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await fetch("/api/push/send-general", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ title: `${senderName} en Chat General`, body }),
  });
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
