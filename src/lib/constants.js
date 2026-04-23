// Ungig app-wide constants.
// Keep enums and allowlists here so components don't invent their own strings.

export const APP_NAME = 'Ungig';
export const APP_TAGLINE = 'Escape the 9 to 5.';

// Admins are bootstrapped by email. This list is mirrored in firestore.rules.
// Swap to Firebase custom claims in phase 2 when the auth flow matures.
export const ADMIN_EMAILS = [
  'rwoodman01@gmail.com',
  'michael.whitaker1490@gmail.com',
];

export const MEMBER_STATUS = Object.freeze({
  UNPAID: 'unpaid',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

export const DEAL_STATUS = Object.freeze({
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  REVIEWED: 'reviewed',
  DECLINED: 'declined',
});

export const BADGES = Object.freeze({
  TRADE_COMPLETE: 'trade_complete',
  FIRST_TRADE: 'first_trade',
  FIVE_TRADES: 'five_trades',
  TEN_TRADES: 'ten_trades',
  COMMUNITY_BUILDER: 'community_builder',
});

export const BADGE_META = {
  [BADGES.TRADE_COMPLETE]: { label: 'Trade Complete', emoji: '✓' },
  [BADGES.FIRST_TRADE]: { label: 'First Trade', emoji: '1' },
  [BADGES.FIVE_TRADES]: { label: '5 Trades', emoji: '5' },
  [BADGES.TEN_TRADES]: { label: '10 Trades', emoji: '10' },
  [BADGES.COMMUNITY_BUILDER]: { label: 'Community Builder', emoji: '★' },
};

// Copy limits (match the spec).
export const LIMITS = Object.freeze({
  BIO_MAX: 150,
  REVIEW_MAX: 200,
  TALENTS_MAX: 3,
  SERVICES_MAX: 3,
  PROOF_PHOTOS_MAX: 6,
});

export const SUBSCRIPTION_PRICE = { amount: 999, currency: 'USD', label: '$9.99/mo' };

// External link — users will bounce out to Checkr for the real background
// check (API integration is phase 2). For MVP we just record confirmation.
export const CHECKR_URL = 'https://checkr.com';
