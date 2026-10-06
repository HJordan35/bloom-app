import { supabase } from "./supabase";
import { unwrap } from "./unwrap";

export type PushState = "unsupported" | "denied" | "off" | "on";

// iOS Safari only has PushManager inside the Home Screen app
const supported = () => "serviceWorker" in navigator && "PushManager" in window;

async function currentSubscription() {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

async function save(broId: string, subscription: PushSubscription) {
  const { endpoint, keys } = subscription.toJSON();
  unwrap(
    await supabase
      .from("push_subscriptions")
      .upsert(
        { bro_id: broId, endpoint, p256dh: keys?.p256dh, auth: keys?.auth },
        { onConflict: "endpoint" },
      ),
  );
}

/** VAPID public key as bytes (Safari doesn't reliably accept the base64url string). */
function applicationServerKey() {
  const base64 = import.meta.env.VITE_VAPID_PUBLIC_KEY.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

export async function pushState(): Promise<PushState> {
  if (!supported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return (await currentSubscription()) ? "on" : "off";
}

/** Ask permission, subscribe this device and save it. Call from a tap. */
export async function enablePush(broId: string) {
  if ((await Notification.requestPermission()) !== "granted") return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey(),
  });
  await save(broId, subscription);
}

/** Forget this device and unsubscribe it. Must run while still signed in (RLS). */
export async function disablePush() {
  if (!supported()) return;
  const subscription = await currentSubscription();
  if (!subscription) return;
  unwrap(await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint));
  await subscription.unsubscribe();
}

/** Re-save this device's subscription in case the browser replaced it. */
export async function refreshPush(broId: string) {
  if (!supported() || Notification.permission !== "granted") return;
  const subscription = await currentSubscription();
  if (subscription) await save(broId, subscription);
}
