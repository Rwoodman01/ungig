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
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { DEAL_STATUS } from './constants.js';
import { computeBadgesAfterCompletion } from './badges.js';
import { notify, NOTIFICATION_TYPES } from './notifications.js';
import { setReviewQueueEntry } from './reviewQueue.js';
import { isPairBlocked } from './blockMute.js';

export async function createDeal({ initiatorId, receiverId }) {
  if (!initiatorId || !receiverId || initiatorId === receiverId) {
    throw new Error('Invalid trade participants.');
  }
  if (await isPairBlocked(initiatorId, receiverId)) {
    throw new Error('You can\'t start an exchange with this member right now.');
  }
  const ref = await addDoc(collection(db, 'deals'), {
    initiatorId,
    receiverId,
    participantIds: [initiatorId, receiverId],
    initiatorService: '',
    receiverService: '',
    initiatorWant: '',
    initiatorWantOpen: false,
    receiverWant: '',
    receiverWantOpen: false,
    scheduledDate: '',
    scheduledTime: '',
    status: DEAL_STATUS.PROPOSED,
    pendingOfferBy: initiatorId,
    lastOfferAuthor: null,
    confirmations: {},
    completedBy: {},
    reviewedBy: {},
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

/** Step 1 — submit or update offer; moves to review for the other party. */
export async function submitTradeOffer(dealId, uid, { give, want, wantOpen }) {
  const giveTrim = String(give ?? '').trim();
  if (!giveTrim) throw new Error('Describe what you are offering.');
  if (!wantOpen) {
    const w = String(want ?? '').trim();
    if (!w) throw new Error('Describe what you want in return, or choose Open to suggestions.');
  }

  const ref = doc(db, 'deals', dealId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Exchange not found.');
  const deal = snap.data();
  if (!deal.participantIds?.includes(uid)) throw new Error('Not a participant.');
  const turnUid = deal.pendingOfferBy ?? deal.initiatorId;
  if (turnUid !== uid) throw new Error('It is not your turn to submit an offer.');
  if (
    deal.status !== DEAL_STATUS.PROPOSED
    && deal.status !== DEAL_STATUS.COUNTERED
    && deal.status !== DEAL_STATUS.REQUESTED
  ) {
    throw new Error('Offers cannot be edited in the current step.');
  }

  const isInitiator = uid === deal.initiatorId;
  const patch = {
    status: DEAL_STATUS.REVIEW,
    lastOfferAuthor: uid,
    pendingOfferBy: null,
    updatedAt: serverTimestamp(),
  };
  if (isInitiator) {
    patch.initiatorService = giveTrim;
    patch.initiatorWant = wantOpen ? '' : String(want ?? '').trim();
    patch.initiatorWantOpen = !!wantOpen;
  } else {
    patch.receiverService = giveTrim;
    patch.receiverWant = wantOpen ? '' : String(want ?? '').trim();
    patch.receiverWantOpen = !!wantOpen;
  }
  await updateDoc(ref, patch);
}

/** Step 2 — reviewing party accepts → mutual confirm. */
export async function acceptTradeReview(dealId, uid) {
  const ref = doc(db, 'deals', dealId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Exchange not found.');
  const deal = snap.data();
  if (deal.status !== DEAL_STATUS.REVIEW && deal.status !== DEAL_STATUS.REQUESTED) {
    throw new Error('This exchange is not waiting for a review.');
  }
  if (uid !== deal.receiverId) throw new Error('Only the reviewing member can accept here.');
  const prev = deal.status;
  await updateDoc(ref, {
    status: DEAL_STATUS.CONFIRMING,
    confirmations: {
      ...(deal.confirmations && typeof deal.confirmations === 'object' ? deal.confirmations : {}),
      terms: {},
    },
    updatedAt: serverTimestamp(),
  });
  if (prev === DEAL_STATUS.REVIEW || prev === DEAL_STATUS.REQUESTED) {
    const recvSnap = await getDoc(doc(db, 'users', uid));
    const receiverName = recvSnap.data()?.displayName ?? 'Someone';
    await notify(deal.initiatorId, NOTIFICATION_TYPES.TRADE_ACCEPTED, {
      otherName: receiverName,
      dealId,
    });
  }
}

/** Step 2 — send back to Step 1 for the offering party (initiator after receiver counters). */
export async function counterTradeReview(dealId, uid) {
  const ref = doc(db, 'deals', dealId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Exchange not found.');
  const deal = snap.data();
  if (deal.status !== DEAL_STATUS.REVIEW && deal.status !== DEAL_STATUS.REQUESTED) {
    throw new Error('Cannot counter right now.');
  }
  if (uid !== deal.receiverId) throw new Error('Only the reviewing member can counter.');
  await updateDoc(ref, {
    status: DEAL_STATUS.COUNTERED,
    pendingOfferBy: deal.initiatorId,
    updatedAt: serverTimestamp(),
  });

  const recvSnap = await getDoc(doc(db, 'users', uid));
  const receiverName = recvSnap.data()?.displayName ?? 'Someone';
  await notify(deal.initiatorId, NOTIFICATION_TYPES.TRADE_COUNTERED, {
    otherName: receiverName,
    dealId,
  });
}

export async function declineTradeReview(dealId, uid) {
  const ref = doc(db, 'deals', dealId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Exchange not found.');
  const deal = snap.data();
  if (uid !== deal.receiverId) throw new Error('Only the reviewing member can decline.');
  if (deal.status !== DEAL_STATUS.REVIEW && deal.status !== DEAL_STATUS.REQUESTED) {
    throw new Error('This exchange cannot be declined now.');
  }
  await updateDoc(ref, {
    status: DEAL_STATUS.DECLINED,
    updatedAt: serverTimestamp(),
  });
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

  const dealSnap = await getDoc(doc(db, 'deals', dealId));
  if (!dealSnap.exists()) return;
  const deal = dealSnap.data();
  const otherId = deal.participantIds?.find((id) => id !== senderId);
  if (!otherId) return;

  const senderSnap = await getDoc(doc(db, 'users', senderId));
  const senderName = senderSnap.data()?.displayName ?? 'Someone';
  await notify(otherId, NOTIFICATION_TYPES.NEW_MESSAGE, {
    otherName: senderName,
    dealId,
  });
}

/** Step 3 — each party confirms agreed terms; when both have, status → scheduled (date TBD). */
export async function confirmMutualTerms(dealId, uid) {
  const dealRef = doc(db, 'deals', dealId);
  const txResult = await runTransaction(db, async (tx) => {
    const dealSnap = await tx.get(dealRef);
    if (!dealSnap.exists()) throw new Error('Exchange not found.');
    const deal = dealSnap.data();
    if (deal.status !== DEAL_STATUS.CONFIRMING) {
      throw new Error('This exchange is not in the confirmation step.');
    }
    if (!deal.participantIds?.includes(uid)) throw new Error('Not a participant.');

    const prevConf = deal.confirmations && typeof deal.confirmations === 'object' ? deal.confirmations : {};
    const prevTerms = prevConf.terms && typeof prevConf.terms === 'object' ? prevConf.terms : {};
    const newlyConfirmed = !prevTerms[uid];
    const terms = { ...prevTerms, [uid]: true };
    const confirmations = { ...prevConf, terms };
    const both =
      !!terms[deal.initiatorId] && !!terms[deal.receiverId];

    tx.update(dealRef, {
      confirmations,
      ...(both
        ? {
            status: DEAL_STATUS.SCHEDULED,
            scheduledDate: deal.scheduledDate ?? '',
            scheduledTime: deal.scheduledTime ?? '',
          }
        : {}),
      updatedAt: serverTimestamp(),
    });

    if (!both && newlyConfirmed) {
      const otherUid = uid === deal.initiatorId ? deal.receiverId : deal.initiatorId;
      return { nudgeOtherUid: otherUid };
    }
    return { nudgeOtherUid: null };
  });

  if (txResult?.nudgeOtherUid) {
    const meSnap = await getDoc(doc(db, 'users', uid));
    const myName = meSnap.data()?.displayName ?? 'Someone';
    await notify(txResult.nudgeOtherUid, NOTIFICATION_TYPES.TRADE_CONFIRM_WAITING, {
      otherName: myName,
      dealId,
    });
  }
}

/** Step 4 — persist meet time (status stays scheduled). Notifies both parties. */
export async function saveTradeSchedule(dealId, uid, { scheduledDate, scheduledTime }) {
  const dealRef = doc(db, 'deals', dealId);
  const snap = await getDoc(dealRef);
  if (!snap.exists()) throw new Error('Exchange not found.');
  const deal = snap.data();
  if (!deal.participantIds?.includes(uid)) throw new Error('Not a participant.');
  if (deal.status !== DEAL_STATUS.SCHEDULED && deal.status !== DEAL_STATUS.ACCEPTED) {
    throw new Error('Schedule can only be saved during the scheduling step.');
  }
  const d = String(scheduledDate ?? '').trim();
  const t = String(scheduledTime ?? '').trim();
  if (!d || !t) throw new Error('Pick a date and time.');

  await updateDoc(dealRef, {
    scheduledDate: d,
    scheduledTime: t,
    status: DEAL_STATUS.SCHEDULED,
    updatedAt: serverTimestamp(),
  });

  const meSnap = await getDoc(doc(db, 'users', uid));
  const myName = meSnap.data()?.displayName ?? 'Someone';
  const otherId = deal.participantIds.find((id) => id !== uid);
  if (otherId) {
    await notify(otherId, NOTIFICATION_TYPES.TRADE_SCHEDULE_SET, {
      otherName: myName,
      dealId,
    });
  }
}

// Mark this user as having completed the trade. If both parties have marked
// complete, transition the deal to "completed" and award badges atomically.
export async function markDealComplete(dealId, userId) {
  const dealRef = doc(db, 'deals', dealId);

  const postTx = await runTransaction(db, async (tx) => {
    const dealSnap = await tx.get(dealRef);
    if (!dealSnap.exists()) throw new Error('Deal not found.');
    const deal = dealSnap.data();
    if (!deal.participantIds?.includes(userId)) {
      throw new Error('Not a participant of this deal.');
    }
    if (deal.status === DEAL_STATUS.COMPLETED || deal.status === DEAL_STATUS.REVIEWED) {
      throw new Error('This exchange is already complete.');
    }
    if (
      deal.status === DEAL_STATUS.SCHEDULED
      && !String(deal.scheduledDate ?? '').trim()
    ) {
      throw new Error('Pick a meet time before marking complete.');
    }
    if (
      ![DEAL_STATUS.SCHEDULED, DEAL_STATUS.ACCEPTED].includes(deal.status)
    ) {
      throw new Error('You cannot mark this exchange complete yet.');
    }

    if (deal.completedBy?.[userId]) {
      return { kind: 'noop' };
    }

    const completedBy = { ...(deal.completedBy ?? {}), [userId]: true };
    const bothDone =
      !!completedBy[deal.initiatorId] && !!completedBy[deal.receiverId];

    if (!bothDone) {
      tx.update(dealRef, {
        completedBy,
        updatedAt: serverTimestamp(),
      });
      const otherId = deal.participantIds.find((id) => id !== userId);
      return { kind: 'partial', otherId };
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

    return {
      kind: 'complete',
      notifyPair: {
        initiatorId: deal.initiatorId,
        receiverId: deal.receiverId,
        dealId,
      },
    };
  });

  if (postTx?.kind === 'noop') {
    return;
  }

  if (postTx?.kind === 'partial' && postTx.otherId) {
    const meSnap = await getDoc(doc(db, 'users', userId));
    const myName = meSnap.data()?.displayName ?? 'Someone';
    await notify(postTx.otherId, NOTIFICATION_TYPES.TRADE_MARK_COMPLETE_PENDING, {
      otherName: myName,
      dealId,
    });
    return;
  }

  const notifyPair = postTx?.kind === 'complete' ? postTx.notifyPair : null;
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

const DELETABLE_STATUSES = [
  DEAL_STATUS.DECLINED,
  DEAL_STATUS.COMPLETED,
  DEAL_STATUS.REVIEWED,
];
const SUBCOL_BATCH = 400;

/** Remove a terminal exchange and its deal-scoped subcollections (messages, in-deal reviews). */
export async function deleteDealWithSubcollections(dealId, userId) {
  const dealRef = doc(db, 'deals', dealId);
  const snap = await getDoc(dealRef);
  if (!snap.exists()) throw new Error('Exchange not found.');
  const deal = snap.data();
  if (!deal.participantIds?.includes(userId)) {
    throw new Error('You are not part of this exchange.');
  }
  const status = deal.status;
  if (!DELETABLE_STATUSES.includes(status)) {
    throw new Error('Only finished or declined exchanges can be removed.');
  }

  const drainSubcollection = async (sub) => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const qs = await getDocs(
        query(collection(db, 'deals', dealId, sub), limit(SUBCOL_BATCH)),
      );
      if (qs.empty) break;
      const batch = writeBatch(db);
      qs.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      if (qs.size < SUBCOL_BATCH) break;
    }
  };

  await drainSubcollection('messages');
  await drainSubcollection('reviews');
  await deleteDoc(dealRef);
}

// Convenience: fetch the other participant of a deal for the given userId.
export async function fetchOtherParticipant(deal, myUid) {
  const otherId = deal.participantIds.find((id) => id !== myUid);
  if (!otherId) return null;
  const snap = await getDoc(doc(db, 'users', otherId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
