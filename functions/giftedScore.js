const { FieldValue } = require('firebase-admin/firestore');

const DAY_MS = 24 * 60 * 60 * 1000;

function clamp(min, value, max) {
  return Math.max(min, Math.min(max, value));
}

function toMs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts._seconds === 'number') return ts._seconds * 1000;
  return 0;
}

function normalizeString(value) {
  return String(value ?? '').trim();
}

function profileCompleteness01(user) {
  const hasPhoto = Boolean(normalizeString(user?.photoURL) || normalizeString(user?.profilePhotoPath));
  const hasBio = normalizeString(user?.bio).length > 0;
  const hasLocation = normalizeString(user?.location).length > 0;
  const hasOffered = (user?.talentsOffered?.length ?? 0) >= 2;
  const hasNeeded = (user?.servicesNeeded?.length ?? 0) >= 1;
  const items = [hasPhoto, hasBio, hasLocation, hasOffered, hasNeeded];
  const score = items.filter(Boolean).length / items.length;
  return { score, items: { hasPhoto, hasBio, hasLocation, hasOffered, hasNeeded } };
}

// Time decay weight for completed trades: recent matters more.
// - Full weight at <= 90 days
// - Exponential tail after 90 days with half-life of 180 days
function tradeDecayWeight(ageDays) {
  if (ageDays <= 90) return 1;
  const tailDays = ageDays - 90;
  const halfLifeDays = 180;
  return Math.pow(0.5, tailDays / halfLifeDays);
}

function completedTrades01(completedDeals, nowMs) {
  const weights = completedDeals
    .map((d) => {
      const t = toMs(d.completedAt) || toMs(d.updatedAt);
      if (!t) return 0;
      const ageDays = (nowMs - t) / DAY_MS;
      return tradeDecayWeight(ageDays);
    })
    .filter((w) => w > 0);

  const weightedCount = weights.reduce((a, b) => a + b, 0);
  // Map weighted trade volume into 0..1 with diminishing returns.
  // 0 trades => 0, ~10 effective trades => ~0.63, ~25 => ~0.92
  const scale = 10;
  const score = 1 - Math.exp(-weightedCount / scale);
  return { score: clamp(0, score, 1), weightedCount, count: completedDeals.length };
}

function weightedStarRating01(visibleReviews, reviewerScoresById) {
  if (!visibleReviews.length) return { score: 0.5, avgStars: null, n: 0, weightedN: 0 };

  let wSum = 0;
  let rSum = 0;
  visibleReviews.forEach((r) => {
    const stars = Number(r.starRating ?? 0);
    if (!stars) return;
    const reviewerId = r.reviewerId;
    const reviewerScore = Number(reviewerScoresById[reviewerId] ?? 50);
    // Weight reviewers by their score (1..100) but keep a floor so one
    // low-score reviewer does not get weight ~0.
    const w = clamp(10, reviewerScore, 100) / 100;
    wSum += w;
    rSum += w * stars;
  });

  if (!wSum) return { score: 0.5, avgStars: null, n: visibleReviews.length, weightedN: 0 };
  const avgStars = rSum / wSum; // 1..5
  const score = clamp(0, (avgStars - 1) / 4, 1);
  return { score, avgStars, n: visibleReviews.length, weightedN: wSum };
}

function wouldTradeAgain01(visibleReviews) {
  if (!visibleReviews.length) return { score: 0.5, yes: 0, n: 0 };
  const n = visibleReviews.length;
  const yes = visibleReviews.filter((r) => r.wouldTradeAgain === true).length;
  return { score: yes / n, yes, n };
}

function responseRate01(receivedDeals) {
  const eligible = receivedDeals.filter((d) => d.createdAt && d.proposalFirstResponseAt);
  if (!eligible.length) return { score: 0.5, within48h: 0, n: 0 };
  const within48h = eligible.filter((d) => (toMs(d.proposalFirstResponseAt) - toMs(d.createdAt)) <= 48 * 60 * 60 * 1000).length;
  return { score: within48h / eligible.length, within48h, n: eligible.length };
}

function inactivityPenaltyPoints(lastCompletedAtMs, nowMs) {
  if (!lastCompletedAtMs) return 5;
  const ageDays = (nowMs - lastCompletedAtMs) / DAY_MS;
  if (ageDays <= 90) return 0;
  if (ageDays <= 180) {
    // 0..3 points between 90 and 180.
    return ((ageDays - 90) / 90) * 3;
  }
  // 3..5 points after 180 days, reaching 5 at 365 days.
  const extra = clamp(0, (ageDays - 180) / 185, 1);
  return 3 + extra * 2;
}

function pickVisibleReviews(reviews) {
  return reviews.filter((r) =>
    r.visibleAt != null
      && !r.suppressed
      && r.moderationStatus !== 'removed');
}

async function getUserGiftedScoreOrDefault(db, uid) {
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists) return 50;
  const v = snap.data()?.giftedScore;
  const n = Number(v);
  return Number.isFinite(n) ? n : 50;
}

async function getReviewerScores(db, reviewerIds) {
  const uniq = Array.from(new Set(reviewerIds.filter(Boolean)));
  if (!uniq.length) return {};
  const snaps = await db.getAll(...uniq.map((id) => db.doc(`users/${id}`)));
  const map = {};
  snaps.forEach((s) => {
    if (!s.exists) return;
    const uid = s.id;
    const v = Number(s.data()?.giftedScore);
    map[uid] = Number.isFinite(v) ? v : 50;
  });
  return map;
}

async function fetchParticipantDeals(db, uid) {
  const snap = await db.collection('deals')
    .where('participantIds', 'array-contains', uid)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function fetchReceivedDeals(db, uid) {
  const snap = await db.collection('deals')
    .where('receiverId', '==', uid)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function fetchReviewsAbout(db, uid) {
  const snap = await db.collection('reviews')
    .where('revieweeId', '==', uid)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function fetchUserDoc(db, uid) {
  const snap = await db.doc(`users/${uid}`).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Recalculate a user's Gifted Score and write:
 * - users/{uid}.giftedScore
 * - users/{uid}/giftedScoreMeta/breakdown (private)
 */
async function recalculateGiftedScore(db, uid) {
  const now = Date.now();

  const user = await fetchUserDoc(db, uid);
  if (!user) return null;

  const [participantDeals, receivedDeals, rawReviews] = await Promise.all([
    fetchParticipantDeals(db, uid),
    fetchReceivedDeals(db, uid),
    fetchReviewsAbout(db, uid),
  ]);

  const completedDeals = participantDeals.filter((d) => d.status === 'completed' || d.status === 'reviewed');
  const lastCompletedAtMs = completedDeals
    .map((d) => toMs(d.completedAt) || 0)
    .reduce((a, b) => Math.max(a, b), 0);

  const openDisputes = participantDeals.filter((d) => d.disputeStatus === 'open').length;

  const visibleReviews = pickVisibleReviews(rawReviews);
  const reviewerIds = visibleReviews.map((r) => r.reviewerId);
  const reviewerScoresById = await getReviewerScores(db, reviewerIds);

  const trades = completedTrades01(completedDeals, now);
  const stars = weightedStarRating01(visibleReviews, reviewerScoresById);
  const wta = wouldTradeAgain01(visibleReviews);
  const resp = responseRate01(receivedDeals);
  const completeness = profileCompleteness01(user);
  const inactivityPenalty = inactivityPenaltyPoints(lastCompletedAtMs, now);

  const weights = {
    trades: 0.35,
    stars: 0.25,
    wouldTradeAgain: 0.15,
    responseRate: 0.10,
    completeness: 0.10,
  };

  const base01 =
    trades.score * weights.trades
    + stars.score * weights.stars
    + wta.score * weights.wouldTradeAgain
    + resp.score * weights.responseRate
    + completeness.score * weights.completeness;

  // Convert to points (0..100), then apply penalties.
  let points = base01 * 100;
  points -= inactivityPenalty; // up to 5 points
  points -= openDisputes * 10;

  // New members should start at ~50 if they have no signals.
  // When there are no trades and no reviews, we anchor at 50.
  const hasSignals = completedDeals.length > 0 || visibleReviews.length > 0;
  if (!hasSignals) {
    points = 50;
  }

  const finalScore = clamp(1, Math.round(points), 100);

  const breakdown = {
    uid,
    computedAt: FieldValue.serverTimestamp(),
    finalScore,
    weights,
    components: {
      trades,
      stars,
      wouldTradeAgain: wta,
      responseRate: resp,
      completeness,
    },
    penalties: {
      inactivityPenaltyPoints: inactivityPenalty,
      openDisputes,
      disputePenaltyPoints: openDisputes * 10,
    },
    meta: {
      lastCompletedAtMs,
      reviewerScoresDefault: 50,
    },
  };

  await Promise.all([
    db.doc(`users/${uid}`).set(
      {
        giftedScore: finalScore,
        giftedScoreUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    ),
    db.doc(`users/${uid}/giftedScoreMeta/breakdown`).set(breakdown, { merge: true }),
  ]);

  return finalScore;
}

module.exports = {
  recalculateGiftedScore,
  // Exposed for testing/debugging if needed later.
  _internals: {
    clamp,
    tradeDecayWeight,
    completedTrades01,
    weightedStarRating01,
    wouldTradeAgain01,
    responseRate01,
    inactivityPenaltyPoints,
    profileCompleteness01,
    pickVisibleReviews,
    getUserGiftedScoreOrDefault,
  },
};

