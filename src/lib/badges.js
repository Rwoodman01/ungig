// Pure functions for computing badge state from a user doc.
// Keeping these pure makes them trivial to move into a Cloud Function later.

import { BADGES } from './constants.js';

export function computeBadgesAfterTrade({ existingBadges = [], newTradeCount, referralCount = 0 }) {
  const set = new Set(existingBadges);
  set.add(BADGES.TRADE_COMPLETE);
  if (newTradeCount >= 1) set.add(BADGES.FIRST_TRADE);
  if (newTradeCount >= 5) set.add(BADGES.FIVE_TRADES);
  if (newTradeCount >= 10) set.add(BADGES.TEN_TRADES);
  if (referralCount >= 1) set.add(BADGES.COMMUNITY_BUILDER);
  return Array.from(set);
}
