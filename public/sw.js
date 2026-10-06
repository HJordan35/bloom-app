// Bloom service worker: push notifications only (no offline cache).

self.addEventListener("push", (event) => {
  const { title, body, url } = event.data.json();
  // iOS requires every push to show a notification
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      data: { url },
    }),
  );
});

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
