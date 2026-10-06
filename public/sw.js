// Bloom service worker: push notifications only (no offline cache).

// Nothing is cached, so a new version can take over straight away
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("push", (event) => {
  const { title, body, url } = event.data.json();
  // iOS requires every push to show a notification
  event.waitUntil(
    self.registration
      .showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-96.png", // Android status bar
        data: { url },
      })
      .then(updateBadge),
  );
});

// App icon count = Bloom notifications still in the tray (the app clears both on open)
async function updateBadge() {
  if (!("setAppBadge" in navigator)) return;
  const waiting = await self.registration.getNotifications();
  await navigator.setAppBadge(waiting.length);
}

// Focus an open Bloom window and ask it to show the page (AppShell navigates),
// or open a new window there
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows[0];
      if (!open) return self.clients.openWindow(url);
      open.postMessage({ url });
      return open.focus();
    }),
  );
});
