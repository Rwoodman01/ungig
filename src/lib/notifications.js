import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import { getNotificationCopy, NOTIFICATION_TYPES } from './constants.js';

/**
 * @param {string} recipientId
 * @param {string} type — NOTIFICATION_TYPES
 * @param {Record<string, string>} payload
 * @param {{ notificationId?: string }} opts — stable id for idempotent writes (e.g. review reminder)
 */
export async function notify(recipientId, type, payload = {}, opts = {}) {
  const { message, link } = getNotificationCopy(type, payload);
  const notifRef = opts.notificationId
    ? doc(db, 'users', recipientId, 'notifications', opts.notificationId)
    : doc(collection(db, 'users', recipientId, 'notifications'));

  const fromUid = auth.currentUser?.uid ?? '';
  await setDoc(notifRef, {
    type,
    message,
    link: link ?? '/',
    recipientId,
    fromUid,
    readAt: null,
    createdAt: serverTimestamp(),
  });
}

/** Mark every notification as read (used when opening the notifications screen). */
export async function markAllNotificationsRead(userId) {
  const q = query(
    collection(db, 'users', userId, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(200),
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  let n = 0;
  snap.forEach((d) => {
    const data = d.data();
    if (data.readAt == null) {
      batch.update(d.ref, { readAt: serverTimestamp() });
      n += 1;
    }
  });
  if (n > 0) await batch.commit();
}

export { NOTIFICATION_TYPES };
