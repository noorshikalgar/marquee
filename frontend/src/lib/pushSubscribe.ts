import { api } from "./apiClient";

interface PublicConfig {
  vapidPublicKey: string | null;
  features: { aiSearchEnabled: boolean; tavilyEnabled: boolean; pushEnabled: boolean };
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const array = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) array[i] = rawData.charCodeAt(i);
  return array.buffer;
}

export async function isPushSupported(): Promise<boolean> {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!(await isPushSupported())) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function enablePushNotifications(): Promise<{ ok: boolean; reason?: string }> {
  if (!(await isPushSupported())) return { ok: false, reason: "Push notifications aren't supported in this browser." };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "Notification permission was not granted." };

  const config = await api.get<PublicConfig>("/config/public");
  if (!config.vapidPublicKey) return { ok: false, reason: "Push isn't configured on the server yet." };

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey),
    });
  }

  const json = subscription.toJSON();
  await api.post("/push/subscribe", {
    subscription: { endpoint: json.endpoint, keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth } },
  });

  return { ok: true };
}

export async function disablePushNotifications(): Promise<void> {
  const subscription = await getExistingSubscription();
  if (!subscription) return;
  await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/push/subscribe`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }).catch(() => undefined);
  await subscription.unsubscribe();
}
