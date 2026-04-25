// Gifted service worker — injectManifest strategy.
// The precache manifest is injected at build time at `self.__WB_MANIFEST`.

import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

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
