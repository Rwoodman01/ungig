import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { REVIEW_LIMITS } from './constants.js';
import { notify, NOTIFICATION_TYPES } from './notifications.js';

function ms(ts) {
  if (!ts) return 0;
  return typeof ts.toMillis === 'function' ? ts.toMillis() : 0;
}

/**
 * Idempotent in-app reminders: 72h nudge when partner already reviewed,
 * and 7d auto-close copy once per deal.
 */
export async function runReviewReminders(userId, reviewQueueItems) {
  if (!userId || !reviewQueueItems?.length) return;

  const now = Date.now();
  const maxClose = REVIEW_LIMITS.AUTO_CLOSE_DAYS * 24 * 60 * 60 * 1000;
  const maxRemind = REVIEW_LIMITS.REMINDER_HOURS * 60 * 60 * 1000;

  for (const item of reviewQueueItems) {
    const dealId = item.id;
    const dealSnap = await getDoc(doc(db, 'deals', dealId));
    if (!dealSnap.exists()) continue;
    const deal = dealSnap.data();
    const completedMs = ms(deal.completedAt);
    if (!completedMs) continue;

    const otherId = deal.initiatorId === userId ? deal.receiverId : deal.initiatorId;
    const partnerReviewed = !!deal.reviewedBy?.[otherId];
    const iReviewed = !!deal.reviewedBy?.[userId];

    if (now - completedMs > maxClose && !iReviewed) {
      const nref = doc(db, 'users', userId, 'notifications', `reviews-closed-${dealId}`);
      const nSnap = await getDoc(nref);
      if (!nSnap.exists()) {
        await notify(userId, NOTIFICATION_TYPES.REVIEWS_CLOSED, { dealId }, { notificationId: `reviews-closed-${dealId}` });
      }
    }

    if (!iReviewed && partnerReviewed && now - completedMs > maxRemind) {
      const nref = doc(db, 'users', userId, 'notifications', `review-reminder-${dealId}`);
      const nSnap = await getDoc(nref);
      if (!nSnap.exists()) {
        const otherSnap = await getDoc(doc(db, 'users', otherId));
        const otherName = otherSnap.data()?.displayName ?? 'Someone';
        await notify(userId, NOTIFICATION_TYPES.REVIEW_REMINDER, { otherName, dealId }, { notificationId: `review-reminder-${dealId}` });
      }
    }
  }
}
