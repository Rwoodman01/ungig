// Pure functions for computing badge state from a user doc.
// Keeping these pure makes it trivial to move into a Cloud Function later.

import { BADGES, SKILL_TAGS } from './constants.js';

const RELIABLE = SKILL_TAGS[0]; // 'Reliable'

/**
 * After both parties mark an exchange complete — only universal completion badge.
 * Count-based badges moved to review-driven logic (`computeReviewBadges`).
 */
export function computeBadgesAfterCompletion({ existingBadges = [] }) {
  const set = new Set(existingBadges);
  set.add(BADGES.TRADE_COMPLETE);
  return Array.from(set);
}

/**
 * Derive review-based badges from all **visible** reviews about this user
 * (revieweeId === user, visibleAt set), sorted ascending by submittedAt.
 */
export function computeReviewBadges(reviewsAboutUser = []) {
  const sorted = [...reviewsAboutUser].sort((a, b) => {
    const ta = a.submittedAt?.toMillis?.() ?? a.submittedAt ?? 0;
    const tb = b.submittedAt?.toMillis?.() ?? b.submittedAt ?? 0;
    return ta - tb;
  });

  const derived = new Set();

  if (sorted.length >= 1) {
    derived.add(BADGES.FIRST_TRADE);
  }

  if (sorted.length >= 25) {
    derived.add(BADGES.COMMUNITY_PILLAR);
  }

  const lastFive = sorted.slice(-5);
  if (lastFive.length === 5 && lastFive.every((r) => Number(r.starRating ?? r.rating) === 5)) {
    derived.add(BADGES.FIVE_STAR_GIVER);
  }

  if (sorted.length >= 10) {
    const withReliable = sorted.filter(
      (r) => Array.isArray(r.skillTags) && r.skillTags.includes(RELIABLE),
    ).length;
    if (withReliable / sorted.length >= 0.8) {
      derived.add(BADGES.MOST_RELIABLE);
    }
  }

  for (let i = 0; i < sorted.length; i += 1) {
    const r = sorted[i];
    if (Number(r.starRating ?? r.rating) <= 3) {
      const laterFive = sorted.slice(i + 1).some((x) => Number(x.starRating ?? x.rating) === 5);
      if (laterFive) {
        derived.add(BADGES.COMEBACK_KID);
        break;
      }
    }
  }

  return Array.from(derived);
}

/**
 * Rebuild `users.badges` from completion/referral/admin picks + visible reviews.
 */
export function rebuildUserBadges({
  existingBadges = [],
  visibleReviewsAboutUser = [],
  referralCount = 0,
}) {
  const out = new Set();
  if (existingBadges.includes(BADGES.TRADE_COMPLETE)) {
    out.add(BADGES.TRADE_COMPLETE);
  }
  if (referralCount >= 1 || existingBadges.includes(BADGES.COMMUNITY_BUILDER)) {
    out.add(BADGES.COMMUNITY_BUILDER);
  }
  if (existingBadges.includes(BADGES.GIFFS_PICK)) {
    out.add(BADGES.GIFFS_PICK);
  }
  computeReviewBadges(visibleReviewsAboutUser).forEach((b) => out.add(b));
  return Array.from(out);
}

/** @deprecated Prefer computeBadgesAfterCompletion + rebuildUserBadges */
export function computeBadgesAfterTrade({ existingBadges = [], newTradeCount, referralCount = 0 }) {
  let next = computeBadgesAfterCompletion({ existingBadges });
  const set = new Set(next);
  if (newTradeCount >= 1) set.add(BADGES.FIRST_TRADE);
  if (newTradeCount >= 5) set.add(BADGES.FIVE_TRADES);
  if (newTradeCount >= 10) set.add(BADGES.TEN_TRADES);
  if (referralCount >= 1) set.add(BADGES.COMMUNITY_BUILDER);
  return Array.from(set);
}
