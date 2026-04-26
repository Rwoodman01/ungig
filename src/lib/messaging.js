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
  if (!('Notification' in window)) return null;

  if (!VAPID_KEY) {
    // eslint-disable-next-line no-console
    console.warn(
      '[Gifted] VITE_FIREBASE_VAPID_KEY is not set — push notifications disabled.',
    );
    return null;
  }

  const messaging = await messagingPromise;
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  // Use the VitePWA-managed SW rather than the default firebase-messaging-sw.js.
  const swReg = await navigator.serviceWorker.ready;

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: swReg,
  });

  if (!token) return null;

  await setDoc(
    doc(db, 'users', uid, 'fcmTokens', tokenDocId(token)),
    {
      token,
      createdAt: serverTimestamp(),
      userAgent: navigator.userAgent.slice(0, 120),
    },
    { merge: true },
  );

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
