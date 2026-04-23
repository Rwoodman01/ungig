// Deal data-access helpers.
//
// Keeping all Firestore writes for deals in one module gives us a single
// place to:
//   - keep denormalized `participantIds[]` in sync so members can query
//     "my deals" with a single `array-contains` query.
//   - enforce legal status transitions.
//   - apply badge/tradeCount/connections updates atomically on completion.

import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { DEAL_STATUS } from './constants.js';
import { computeBadgesAfterTrade } from './badges.js';

export async function createDeal({ initiatorId, receiverId }) {
  if (!initiatorId || !receiverId || initiatorId === receiverId) {
    throw new Error('Invalid trade participants.');
  }
  const ref = await addDoc(collection(db, 'deals'), {
    initiatorId,
    receiverId,
    participantIds: [initiatorId, receiverId],
    initiatorService: '',
    receiverService: '',
    scheduledDate: '',
    scheduledTime: '',
    status: DEAL_STATUS.REQUESTED,
    completedBy: {},
    reviewedBy: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDealFields(dealId, fields) {
  await updateDoc(doc(db, 'deals', dealId), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

export async function setDealStatus(dealId, status) {
  await updateDealFields(dealId, { status });
}

export async function sendDealMessage(dealId, senderId, text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await addDoc(collection(db, 'deals', dealId, 'messages'), {
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
  });
  await updateDealFields(dealId, { lastMessageAt: serverTimestamp() });
}

// Mark this user as having completed the trade. If both parties have marked
// complete, transition the deal to "completed" and award badges atomically.
export async function markDealComplete(dealId, userId) {
  const dealRef = doc(db, 'deals', dealId);
  await runTransaction(db, async (tx) => {
    const dealSnap = await tx.get(dealRef);
    if (!dealSnap.exists()) throw new Error('Deal not found.');
    const deal = dealSnap.data();
    if (!deal.participantIds?.includes(userId)) {
      throw new Error('Not a participant of this deal.');
    }

    const completedBy = { ...(deal.completedBy ?? {}), [userId]: true };
    const bothDone =
      !!completedBy[deal.initiatorId] && !!completedBy[deal.receiverId];

    if (!bothDone) {
      tx.update(dealRef, {
        completedBy,
        status: DEAL_STATUS.ACCEPTED, // stays accepted/scheduled until both tap complete
        updatedAt: serverTimestamp(),
      });
      return;
    }

    // Both parties marked complete — flip to completed and award badges.
    const initiatorRef = doc(db, 'users', deal.initiatorId);
    const receiverRef = doc(db, 'users', deal.receiverId);
    const [iSnap, rSnap] = await Promise.all([tx.get(initiatorRef), tx.get(receiverRef)]);
    const iData = iSnap.data() ?? {};
    const rData = rSnap.data() ?? {};

    const iNewCount = (iData.tradeCount ?? 0) + 1;
    const rNewCount = (rData.tradeCount ?? 0) + 1;

    tx.update(dealRef, {
      completedBy,
      status: DEAL_STATUS.COMPLETED,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    tx.update(initiatorRef, {
      tradeCount: increment(1),
      connections: arrayUnion(deal.receiverId),
      badges: computeBadgesAfterTrade({
        existingBadges: iData.badges ?? [],
        newTradeCount: iNewCount,
      }),
      updatedAt: serverTimestamp(),
    });
    tx.update(receiverRef, {
      tradeCount: increment(1),
      connections: arrayUnion(deal.initiatorId),
      badges: computeBadgesAfterTrade({
        existingBadges: rData.badges ?? [],
        newTradeCount: rNewCount,
      }),
      updatedAt: serverTimestamp(),
    });
  });
}

// Submit a review. We write to a top-level `reviews` collection (for easy
// aggregation by revieweeId) AND inside the deal for provenance.
// When both parties have reviewed, flip the deal status to "reviewed".
export async function submitReview({ dealId, reviewerId, revieweeId, rating, comment }) {
  const dealRef = doc(db, 'deals', dealId);
  const reviewInDeal = doc(db, 'deals', dealId, 'reviews', reviewerId);
  const reviewTopLevel = doc(collection(db, 'reviews'));

  await runTransaction(db, async (tx) => {
    const dealSnap = await tx.get(dealRef);
    if (!dealSnap.exists()) throw new Error('Deal not found.');
    const deal = dealSnap.data();
    if (deal.status !== 'completed' && deal.status !== 'reviewed') {
      throw new Error('Deal must be completed before reviewing.');
    }

    const payload = {
      dealId,
      reviewerId,
      revieweeId,
      rating,
      comment: (comment ?? '').slice(0, 200),
      createdAt: serverTimestamp(),
    };
    tx.set(reviewTopLevel, payload);
    tx.set(reviewInDeal, payload);

    const reviewedBy = { ...(deal.reviewedBy ?? {}), [reviewerId]: true };
    const bothReviewed =
      !!reviewedBy[deal.initiatorId] && !!reviewedBy[deal.receiverId];

    tx.update(dealRef, {
      reviewedBy,
      status: bothReviewed ? DEAL_STATUS.REVIEWED : deal.status,
      updatedAt: serverTimestamp(),
    });
  });
}

// Convenience: fetch the other participant of a deal for the given userId.
export async function fetchOtherParticipant(deal, myUid) {
  const otherId = deal.participantIds.find((id) => id !== myUid);
  if (!otherId) return null;
  const snap = await getDoc(doc(db, 'users', otherId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
