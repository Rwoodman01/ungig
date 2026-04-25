import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { createDeal } from './deals.js';

export function matchIdFor(a, b) {
  return [a, b].sort().join('_');
}

export async function recordSwipe({ uid, targetUid, direction, source = 'swipe' }) {
  if (!uid || !targetUid || uid === targetUid) {
    throw new Error('Invalid swipe target.');
  }
  if (!['left', 'right'].includes(direction)) {
    throw new Error('Invalid swipe direction.');
  }
  await setDoc(doc(db, 'users', uid, 'swipes', targetUid), {
    targetUid,
    direction,
    source,
    timestamp: serverTimestamp(),
  }, { merge: true });
}

export async function createDealFromMatch({ match, initiatorId }) {
  const receiverId = match.participantIds?.find((id) => id !== initiatorId);
  if (!receiverId) throw new Error('Could not find match partner.');
  return createDeal({ initiatorId, receiverId });
}

export const swipesCollection = (uid) => collection(db, 'users', uid, 'swipes');
