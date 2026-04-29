import { onMessage } from 'firebase/messaging';
import { messagingPromise } from '../firebase.js';

let started = false;

/**
 * When the app tab/PWA is in the foreground, FCM does not fire `onBackgroundMessage`
 * in the service worker — messages go to `onMessage` here instead. Without this,
 * users only see in-app Firestore notifications and no OS-level push while the app is open.
 */
export function startForegroundFcmListener() {
  if (typeof window === 'undefined' || started) return;
  started = true;

  messagingPromise
    .then((messaging) => {
      if (!messaging) return;
      onMessage(messaging, (payload) => {
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
          return;
        }
        const title = payload.notification?.title ?? 'Gifted';
        const body = payload.notification?.body ?? '';
        const tag = payload.data?.notificationId ?? 'gifted-fg';
        const link = payload.data?.link ?? '/';
        const opts = {
          body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: String(tag),
          data: { link },
        };
        navigator.serviceWorker.ready
          .then((reg) => reg.showNotification(title, opts))
          .catch(() => {
            try {
              // eslint-disable-next-line no-new
              new Notification(title, { body, tag: String(tag) });
            } catch {
              /* ignore */
            }
          });
      });
    })
    .catch(() => {});
}

