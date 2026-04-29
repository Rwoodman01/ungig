import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { REPORT_REASON_VALUES } from './constants.js';
import { notify, NOTIFICATION_TYPES } from './notifications.js';

/**
 * @param {{ reporterId: string, reportedUserId: string, reason: string, details?: string }} input
 */
export async function submitMemberReport({ reporterId, reportedUserId, reason, details = '' }) {
  if (!reporterId || !reportedUserId || reporterId === reportedUserId) {
    throw new Error('Invalid report.');
  }
  if (!REPORT_REASON_VALUES.includes(reason)) {
    throw new Error('Pick a reason for this report.');
  }
  const detailsTrim = String(details ?? '').trim().slice(0, 2000);
  await addDoc(collection(db, 'reports'), {
    reporterId,
    reportedUserId,
    reason,
    details: detailsTrim,
    status: 'open',
    createdAt: serverTimestamp(),
  });
  await notify(reporterId, NOTIFICATION_TYPES.REPORT_SUBMITTED, {});
}
