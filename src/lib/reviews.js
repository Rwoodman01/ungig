import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import {
  BADGES,
  BADGE_META,
  DEAL_STATUS,
  REVIEW_LIMITS,
} from './constants.js';
import { rebuildUserBadges } from './badges.js';
import { notify, NOTIFICATION_TYPES } from './notifications.js';
import { clearReviewQueueEntry } from './reviewQueue.js';

function msFromTimestamp(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  return 0;
}

function nowMs() {
  return Date.now();
}

function isWithinReviewWindow(completedAt) {
  const t = msFromTimestamp(completedAt);
  if (!t) return true;
  const maxMs = REVIEW_LIMITS.AUTO_CLOSE_DAYS * 24 * 60 * 60 * 1000;
  return nowMs() - t <= maxMs;
}

/**
 * Submit a blind review. When both parties have submitted, sets `visibleAt`
 * on both top-level review documents in the same transaction.
 */
export async function submitReview({
  dealId,
  reviewerId,
  revieweeId,
  starRating,
  showedUp,
  wouldTradeAgain,
  writtenReview,
  skillTags = [],
}) {
  const trimmed = (writtenReview ?? '').trim();
  if (trimmed.length < REVIEW_LIMITS.WRITTEN_MIN) {
    throw new Error(`Please write at least ${REVIEW_LIMITS.WRITTEN_MIN} characters.`);
  }
  if (trimmed.length > REVIEW_LIMITS.WRITTEN_MAX) {
    throw new Error('Review is too long.');
  }

  const dealRef = doc(db, 'deals', dealId);
  const reviewTopRef = doc(collection(db, 'reviews'));
  const reviewInDealRef = doc(db, 'deals', dealId, 'reviews', reviewerId);

  let bothVisible = false;
  let initiatorId = '';
  let receiverId = '';

  await runTransaction(db, async (tx) => {
    const dealSnap = await tx.get(dealRef);
    if (!dealSnap.exists()) throw new Error('Exchange not found.');
    const deal = dealSnap.data();
    initiatorId = deal.initiatorId;
    receiverId = deal.receiverId;

    if (!deal.participantIds?.includes(reviewerId)) {
      throw new Error('You are not a participant in this exchange.');
    }
    if (deal.status !== DEAL_STATUS.COMPLETED && deal.status !== DEAL_STATUS.REVIEWED) {
      throw new Error('Reviews are only available after the exchange is complete.');
    }
    if (!isWithinReviewWindow(deal.completedAt)) {
      throw new Error('The review window for this exchange has closed.');
    }
    if (deal.reviewedBy?.[reviewerId]) {
      throw new Error('You have already submitted a review for this exchange.');
    }

    const reviewedBy = { ...(deal.reviewedBy ?? {}), [reviewerId]: true };
    const bothReviewed = !!reviewedBy[initiatorId] && !!reviewedBy[receiverId];

    // Firestore requires every tx.get() before any tx.set/update/delete.
    // When both parties have now reviewed, we must read the partner's in-deal
    // review stub (for topLevelReviewId) before writing our new review docs.
    let otherTopRef = null;
    if (bothReviewed) {
      const otherId = reviewerId === initiatorId ? receiverId : initiatorId;
      const otherDealReviewRef = doc(db, 'deals', dealId, 'reviews', otherId);
      const otherSnap = await tx.get(otherDealReviewRef);
      if (!otherSnap.exists()) throw new Error('Partner review record missing.');
      const otherTopId = otherSnap.data().topLevelReviewId;
      if (!otherTopId) throw new Error('Partner review reference missing.');
      otherTopRef = doc(db, 'reviews', otherTopId);
    }

    const payload = {
      dealId,
      reviewerId,
      revieweeId,
      starRating: Number(starRating),
      showedUp: !!showedUp,
      wouldTradeAgain: !!wouldTradeAgain,
      writtenReview: trimmed,
      skillTags: (skillTags ?? []).slice(0, REVIEW_LIMITS.SKILL_TAGS_MAX),
      submittedAt: serverTimestamp(),
      visibleAt: null,
      flagged: false,
      flags: [],
      suppressed: false,
      exchangeOfferInitiator: (deal.initiatorService ?? '').trim().slice(0, 120),
      exchangeOfferReceiver: (deal.receiverService ?? '').trim().slice(0, 120),
    };

    tx.set(reviewTopRef, payload);
    tx.set(reviewInDealRef, {
      ...payload,
      topLevelReviewId: reviewTopRef.id,
    });

    if (bothReviewed) {
      const vis = serverTimestamp();
      tx.update(reviewTopRef, { visibleAt: vis });
      tx.update(otherTopRef, { visibleAt: vis });
      tx.update(dealRef, {
        reviewedBy,
        status: DEAL_STATUS.REVIEWED,
        updatedAt: serverTimestamp(),
      });
      bothVisible = true;
    } else {
      tx.update(dealRef, {
        reviewedBy,
        updatedAt: serverTimestamp(),
      });
    }
  });

  await clearReviewQueueEntry(reviewerId, dealId);

  if (bothVisible) {
    await Promise.all([
      refreshBadgesAndNotify(initiatorId),
      refreshBadgesAndNotify(receiverId),
    ]);
    await notifyReviewLivePair(initiatorId, receiverId);
  }

  return { reviewId: reviewTopRef.id, bothVisible };
}

async function fetchVisibleReviewsForReviewee(revieweeId) {
  const q = query(collection(db, 'reviews'), where('revieweeId', '==', revieweeId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((r) => r.visibleAt != null && !r.suppressed && r.moderationStatus !== 'removed');
}

async function refreshBadgesAndNotify(uid) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  const prevBadges = snap.data().badges ?? [];
  const referralCount = snap.data().referredBy ? 1 : 0;
  const visible = await fetchVisibleReviewsForReviewee(uid);
  const nextBadges = rebuildUserBadges({
    existingBadges: prevBadges,
    visibleReviewsAboutUser: visible,
    referralCount,
  });

  const same =
    prevBadges.length === nextBadges.length
    && prevBadges.every((b) => nextBadges.includes(b));

  if (!same) {
    await updateDoc(userRef, { badges: nextBadges, updatedAt: serverTimestamp() });
    const added = nextBadges.filter((b) => !prevBadges.includes(b));
    for (const b of added) {
      if (b === BADGES.TRADE_COMPLETE) continue;
      const meta = BADGE_META[b];
      const label = meta?.label ?? b;
      await notify(uid, NOTIFICATION_TYPES.BADGE_EARNED, { badgeLabel: label });
    }
  }
}

async function notifyReviewLivePair(initiatorId, receiverId) {
  const [iSnap, rSnap] = await Promise.all([
    getDoc(doc(db, 'users', initiatorId)),
    getDoc(doc(db, 'users', receiverId)),
  ]);
  const iName = iSnap.data()?.displayName ?? 'Someone';
  const rName = rSnap.data()?.displayName ?? 'Someone';

  await notify(initiatorId, NOTIFICATION_TYPES.REVIEW_RECEIVED, {
    otherName: rName,
    memberId: receiverId,
  });
  await notify(receiverId, NOTIFICATION_TYPES.REVIEW_RECEIVED, {
    otherName: iName,
    memberId: initiatorId,
  });
}

export async function flagReview(reviewId, flaggerId) {
  const ref = doc(db, 'reviews', reviewId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Review not found.');
    const data = snap.data();
    const flags = Array.isArray(data.flags) ? [...data.flags] : [];
    if (flags.includes(flaggerId)) {
      return;
    }
    flags.push(flaggerId);
    const suppressed = flags.length >= REVIEW_LIMITS.FLAG_HIDE_THRESHOLD;
    tx.update(ref, {
      flags,
      flagged: suppressed,
      suppressed: suppressed || !!data.suppressed,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function adminResolveFlag(reviewId, action) {
  const ref = doc(db, 'reviews', reviewId);
  if (action === 'remove') {
    await updateDoc(ref, {
      moderationStatus: 'removed',
      suppressed: true,
      flagged: false,
      flags: [],
      updatedAt: serverTimestamp(),
    });
    return;
  }
  if (action === 'keep') {
    await updateDoc(ref, {
      moderationStatus: 'approved',
      suppressed: false,
      flagged: false,
      flags: [],
      updatedAt: serverTimestamp(),
    });
    return;
  }
  throw new Error('Invalid action.');
}

export async function awardGiffsPick(uid) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    badges: arrayUnion(BADGES.GIFFS_PICK),
    updatedAt: serverTimestamp(),
  });
  await notify(uid, NOTIFICATION_TYPES.BADGE_EARNED, {
    badgeLabel: BADGE_META[BADGES.GIFFS_PICK]?.label ?? "Giff's Pick",
  });
}

/** Lifetime flagged count for admin context (client-side aggregate). */
export async function countFlaggedReviewsForReviewee(revieweeId) {
  const q = query(collection(db, 'reviews'), where('revieweeId', '==', revieweeId));
  const snap = await getDocs(q);
  return snap.docs.filter((d) => {
    const x = d.data();
    return (x.flags?.length ?? 0) > 0 || x.flagged;
  }).length;
}
