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
import { computeBadgesAfterCompletion } from './badges.js';
import { notify, NOTIFICATION_TYPES } from './notifications.js';
import { setReviewQueueEntry } from './reviewQueue.js';

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
    // Gifted Score fields (set/maintained by Cloud Functions).
    proposalFirstResponseAt: null,
    disputeStatus: 'none',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const [initSnap, recvSnap] = await Promise.all([
    getDoc(doc(db, 'users', initiatorId)),
    getDoc(doc(db, 'users', receiverId)),
  ]);
  const initiatorName = initSnap.data()?.displayName ?? 'Someone';
  await notify(receiverId, NOTIFICATION_TYPES.TRADE_PROPOSED, {
    otherName: initiatorName,
    dealId: ref.id,
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
  const dealRef = doc(db, 'deals', dealId);
  const snap = await getDoc(dealRef);
  const prev = snap.data()?.status;
  const deal = snap.data() ?? {};

  await updateDoc(dealRef, { status, updatedAt: serverTimestamp() });

  if (prev === DEAL_STATUS.REQUESTED && status === DEAL_STATUS.ACCEPTED) {
    const recvSnap = await getDoc(doc(db, 'users', deal.receiverId));
    const receiverName = recvSnap.data()?.displayName ?? 'Someone';
    await notify(deal.initiatorId, NOTIFICATION_TYPES.TRADE_ACCEPTED, {
      otherName: receiverName,
      dealId,
    });
  }
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
  let notifyPair = null;

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

    tx.update(dealRef, {
      completedBy,
      status: DEAL_STATUS.COMPLETED,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    tx.update(initiatorRef, {
      tradeCount: increment(1),
      connections: arrayUnion(deal.receiverId),
      badges: computeBadgesAfterCompletion({ existingBadges: iData.badges ?? [] }),
      updatedAt: serverTimestamp(),
    });
    tx.update(receiverRef, {
      tradeCount: increment(1),
      connections: arrayUnion(deal.initiatorId),
      badges: computeBadgesAfterCompletion({ existingBadges: rData.badges ?? [] }),
      updatedAt: serverTimestamp(),
    });

    notifyPair = {
      initiatorId: deal.initiatorId,
      receiverId: deal.receiverId,
      dealId,
    };
  });

  if (notifyPair) {
    const [iUser, rUser] = await Promise.all([
      getDoc(doc(db, 'users', notifyPair.initiatorId)),
      getDoc(doc(db, 'users', notifyPair.receiverId)),
    ]);
    const iName = iUser.data()?.displayName ?? 'Someone';
    const rName = rUser.data()?.displayName ?? 'Someone';
    await Promise.all([
      setReviewQueueEntry(notifyPair.initiatorId, notifyPair.dealId),
      setReviewQueueEntry(notifyPair.receiverId, notifyPair.dealId),
      notify(notifyPair.initiatorId, NOTIFICATION_TYPES.TRADE_COMPLETED, {
        otherName: rName,
        dealId: notifyPair.dealId,
      }),
      notify(notifyPair.receiverId, NOTIFICATION_TYPES.TRADE_COMPLETED, {
        otherName: iName,
        dealId: notifyPair.dealId,
      }),
    ]);
  }
}

// Convenience: fetch the other participant of a deal for the given userId.
export async function fetchOtherParticipant(deal, myUid) {
  const otherId = deal.participantIds.find((id) => id !== myUid);
  if (!otherId) return null;
  const snap = await getDoc(doc(db, 'users', otherId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
