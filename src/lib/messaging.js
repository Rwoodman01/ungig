// Push-notification helpers (FCM Web Push).
//
// Responsibilities:
//  - Request browser notification permission.
//  - Obtain an FCM registration token and persist it to Firestore so the
//    Cloud Function can fan out push messages to all user devices.
//  - Delete a token on sign-out so stale tokens don't accumulate.
//
// FCM tokens are stored at  users/{uid}/fcmTokens/{tokenId}
// where tokenId is the last 28 characters of the token string (stable, unique
// enough to avoid doc-ID collisions, and avoids Firestore path restrictions).

import { deleteToken, getToken } from 'firebase/messaging';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, messagingPromise } from '../firebase.js';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/** Derive a short, stable Firestore doc ID from a full FCM token. */
function tokenDocId(token) {
  return token.slice(-28);
}

/**
 * Ask for browser notification permission and, on grant, fetch an FCM
 * registration token tied to the current page's service worker.  The token is
 * written to Firestore so the backend can send push messages to this device.
 *
 * Returns the token string on success, or null if permission is denied /
 * the platform is unsupported.
 */
export async function requestPushToken(uid) {
  // eslint-disable-next-line no-console
  console.log('[Push] requestPushToken start', {
    uid: uid ? `${uid.slice(0, 6)}…` : null,
    hasNotification: 'Notification' in window,
    permission: 'Notification' in window ? Notification.permission : 'unsupported',
    hasServiceWorker: 'serviceWorker' in navigator,
    hasVapidKey: Boolean(VAPID_KEY),
  });
  if (!('Notification' in window)) return null;

  let messaging = null;
  try {
    messaging = await messagingPromise;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Push] messagingPromise rejected', e);
    return null;
  }
  if (!messaging) {
    // eslint-disable-next-line no-console
    console.warn('[Push] Firebase Messaging not supported on this device/browser');
    return null;
  }

  // eslint-disable-next-line no-console
  console.log('[Push] requesting Notification permission…');
  const permission = await Notification.requestPermission();
  // eslint-disable-next-line no-console
  console.log('[Push] permission result', { permission });
  if (permission !== 'granted') return null;

  // Ask permission first (so the user sees the browser prompt). If the VAPID
  // key is missing we can't register a token yet, but permission is still
  // persisted by the browser and token registration will work once configured.
  if (!VAPID_KEY) {
    // eslint-disable-next-line no-console
    console.warn(
      '[Gifted] VITE_FIREBASE_VAPID_KEY is not set — cannot register push token yet.',
    );
    return null;
  }

  // Use the VitePWA-managed SW rather than the default firebase-messaging-sw.js.
  let swReg = null;
  try {
    swReg = await navigator.serviceWorker.ready;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Push] serviceWorker.ready failed', e);
    return null;
  }
  // eslint-disable-next-line no-console
  console.log('[Push] service worker ready', { scope: swReg?.scope });

  let token = null;
  try {
    token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Push] getToken failed', e);
    return null;
  }
  // eslint-disable-next-line no-console
  console.log('[Push] getToken result', {
    hasToken: Boolean(token),
    tokenDocId: token ? tokenDocId(token) : null,
    tokenPreview: token ? `${token.slice(0, 10)}…${token.slice(-10)}` : null,
  });

  if (!token) return null;

  const tokenId = tokenDocId(token);
  const ref = doc(db, 'users', uid, 'fcmTokens', tokenId);
  try {
    await setDoc(
      ref,
      {
        token,
        createdAt: serverTimestamp(),
        userAgent: navigator.userAgent.slice(0, 120),
      },
      { merge: true },
    );
    // eslint-disable-next-line no-console
    console.log('[Push] token saved to Firestore', { path: ref.path, tokenId });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Push] token save failed', { path: ref.path, tokenId, error: e });
    return null;
  }

  return token;
}

/**
 * Revoke the current device's FCM token and delete it from Firestore.
 * Call this on sign-out so stale tokens don't linger.
 */
export async function removePushToken(uid) {
  const messaging = await messagingPromise;
  if (!messaging || !VAPID_KEY) return;

  try {
    const swReg = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
    if (token) {
      await deleteToken(messaging);
      await deleteDoc(doc(db, 'users', uid, 'fcmTokens', tokenDocId(token)));
    }
  } catch {
    // Token may already be revoked or the user is offline — safe to ignore.
  }
}

/**
 * Synchronously read the current browser notification permission state.
 * Returns 'default' | 'granted' | 'denied' | 'unsupported'.
 */
export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
