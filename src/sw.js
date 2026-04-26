// Gifted service worker — injectManifest strategy.
// The precache manifest is injected at build time at `self.__WB_MANIFEST`.

import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// Precache all build assets (JS/CSS/HTML/icons) listed by the plugin.
precacheAndRoute(self.__WB_MANIFEST ?? []);

// SPA navigation fallback: offline navigations render our offline page.
// Any other failure in the network-only handler falls through to offline.html.
const offlineHandler = createHandlerBoundToURL('/offline.html');
registerRoute(
  new NavigationRoute(async (args) => {
    try {
      return await fetch(args.request);
    } catch {
      return offlineHandler(args);
    }
  }, {
    denylist: [/^\/api\//],
  }),
);

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Firebase Cloud Messaging (background push) ────────────────────────────────
// Firebase config values are substituted at build time by Vite's define step.
// This initialises a separate Firebase app inside the SW global scope.
const fbApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

const messaging = getMessaging(fbApp);

// Handle push messages when the app is closed or backgrounded.
// Foreground messages are handled in the main app window; we only
// need to show a notification here when no page is focused.
onBackgroundMessage(messaging, (payload) => {
  const title = payload.notification?.title ?? 'Gifted';
  const body = payload.notification?.body ?? '';
  const link = payload.data?.link ?? '/';

  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.data?.notificationId,
    data: { link },
  });
});

// Navigate to the relevant page when the user taps a notification.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link ?? '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) =>
          c.url.startsWith(self.location.origin),
        );
        if (existing) {
          existing.focus();
          // navigate() is available on WindowClient in modern browsers.
          if ('navigate' in existing) {
            existing.navigate(self.location.origin + link);
          }
          return;
        }
        self.clients.openWindow(self.location.origin + link);
      }),
  );
});
