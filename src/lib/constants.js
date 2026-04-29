// Gifted app-wide constants.
// Keep enums and allowlists here so components don't invent their own strings.

export const APP_NAME = 'Gifted';
// Brand tagline — shown anywhere the logo appears.
export const APP_TAGLINE = 'GIVE • RECEIVE • GROW';
// Footer line on auth/onboarding surfaces.
export const AUTH_FOOTER_LINE = 'Give what you can. Receive what you need.';

// Brand values — used to inform microcopy.
// Give · Receive · Grow · Trust
export const BRAND_VALUES = Object.freeze([
  { key: 'give',    label: 'Give',    copy: 'Share your gifts and time.' },
  { key: 'receive', label: 'Receive', copy: 'Get help and support you need.' },
  { key: 'grow',    label: 'Grow',    copy: 'Build skills, confidence, and connections.' },
  { key: 'trust',   label: 'Trust',   copy: 'Safe, kind, and community-centered.' },
]);

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
  PROPOSED: 'proposed',
  REVIEW: 'review',
  COUNTERED: 'countered',
  CONFIRMING: 'confirming',
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  REVIEWED: 'reviewed',
  DECLINED: 'declined',
  /** @deprecated Legacy — still read from older documents */
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
});

export const MATCH_STATUS = Object.freeze({
  ACTIVE: 'active',
});

/** Skill tag chips for reviews (max 3 per review). */
export const SKILL_TAGS = Object.freeze([
  'Reliable',
  'Skilled',
  'Communicative',
  'Generous',
  'Went Above and Beyond',
  'Punctual',
  'Professional',
  'Friendly',
  'Creative',
  'Patient',
]);

export const REVIEW_LIMITS = Object.freeze({
  WRITTEN_MIN: 20,
  WRITTEN_MAX: 600,
  SKILL_TAGS_MAX: 3,
  REMINDER_HOURS: 72,
  AUTO_CLOSE_DAYS: 7,
  UNREVIEWED_WARNING_THRESHOLD: 3,
  FLAG_HIDE_THRESHOLD: 3,
});

export const BADGES = Object.freeze({
  TRADE_COMPLETE: 'trade_complete',
  FIRST_TRADE: 'first_trade',
  /** Legacy — no longer auto-awarded; kept for existing user docs. */
  FIVE_TRADES: 'five_trades',
  /** Legacy — no longer auto-awarded. */
  TEN_TRADES: 'ten_trades',
  COMMUNITY_BUILDER: 'community_builder',
  FIVE_STAR_GIVER: 'five_star_giver',
  MOST_RELIABLE: 'most_reliable',
  COMEBACK_KID: 'comeback_kid',
  COMMUNITY_PILLAR: 'community_pillar',
  GIFFS_PICK: 'giffs_pick',
});

export const BADGE_META = {
  [BADGES.TRADE_COMPLETE]: { label: 'Gift complete', emoji: '✓' },
  [BADGES.FIRST_TRADE]: { label: 'First gift', emoji: '1' },
  [BADGES.FIVE_TRADES]: { label: '5 gifts', emoji: '5' },
  [BADGES.TEN_TRADES]: { label: '10 gifts', emoji: '10' },
  [BADGES.COMMUNITY_BUILDER]: { label: 'Community Builder', emoji: '★' },
  [BADGES.FIVE_STAR_GIVER]: { label: '5-Star Giver', emoji: '⭐' },
  [BADGES.MOST_RELIABLE]: { label: 'Most Reliable', emoji: '🛡' },
  [BADGES.COMEBACK_KID]: { label: 'Comeback Kid', emoji: '↗' },
  [BADGES.COMMUNITY_PILLAR]: { label: 'Community Pillar', emoji: '🏛' },
  [BADGES.GIFFS_PICK]: { label: "Giff's Pick", emoji: '🐸' },
};

export const NOTIFICATION_TYPES = Object.freeze({
  TRADE_PROPOSED: 'trade_proposed',
  TRADE_ACCEPTED: 'trade_accepted',
  TRADE_SCHEDULE_SET: 'trade_schedule_set',
  TRADE_COMPLETED: 'trade_completed',
  TRADE_COUNTERED: 'trade_countered',
  TRADE_CONFIRM_WAITING: 'trade_confirm_waiting',
  TRADE_MARK_COMPLETE_PENDING: 'trade_mark_complete_pending',
  NEW_MESSAGE: 'new_message',
  REVIEW_RECEIVED: 'review_received',
  REVIEW_REMINDER: 'review_reminder',
  REVIEWS_CLOSED: 'reviews_closed',
  MATCH: 'match',
  BADGE_EARNED: 'badge_earned',
  POST_INTEREST: 'post_interest',
});

// Bulletin board.
export const POST_TYPES = Object.freeze({
  OFFERING: 'offering',
  LOOKING_FOR: 'looking_for',
  COMMUNITY: 'community',
});

export const POST_TYPE_META = {
  [POST_TYPES.OFFERING]: {
    label: 'Offering',
    accent: 'green',
    helper: 'Something you can give.',
  },
  [POST_TYPES.LOOKING_FOR]: {
    label: 'Looking For',
    accent: 'coral',
    helper: 'Something you need help with.',
  },
  [POST_TYPES.COMMUNITY]: {
    label: 'Community',
    accent: 'gold',
    helper: 'A note for the neighborhood.',
  },
};

export const POST_AVAILABILITY = Object.freeze({
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  FLEXIBLE: 'flexible',
});

export const POST_AVAILABILITY_LABEL = {
  [POST_AVAILABILITY.THIS_WEEK]: 'This Week',
  [POST_AVAILABILITY.THIS_MONTH]: 'This Month',
  [POST_AVAILABILITY.FLEXIBLE]: 'Flexible',
};

export const POST_LIMITS = Object.freeze({
  WHAT_MAX: 80,
  EXCHANGE_MAX: 80,
  DETAILS_MAX: 300,
  ACTIVE_DAYS: 30,
  AUTO_HIDE_FLAGS: 3,
  MAX_ACTIVE_POSTS_PER_USER: 5,
  MIN_TRADES_TO_POST: 1,
});

export const POST_STATUS = Object.freeze({
  ACTIVE: 'active',
  HIDDEN: 'hidden',
});

/**
 * Build notification message + deep link for UI.
 * @param {string} type — NOTIFICATION_TYPES value
 * @param {Record<string, string>} payload — e.g. otherName, dealId, badgeLabel
 */
export function getNotificationCopy(type, payload = {}) {
  const name = payload.otherName ?? 'Someone';
  const dealId = payload.dealId ?? '';
  const badgeLabel = payload.badgeLabel ?? 'a badge';

  switch (type) {
    case NOTIFICATION_TYPES.TRADE_PROPOSED:
      return {
        message: `${name} wants to exchange with you.`,
        link: dealId ? `/deals/${dealId}` : '/deals',
      };
    case NOTIFICATION_TYPES.TRADE_ACCEPTED:
      return {
        message: `${name} accepted your exchange.`,
        link: dealId ? `/deals/${dealId}` : '/deals',
      };
    case NOTIFICATION_TYPES.TRADE_SCHEDULE_SET:
      return {
        message: `${name} saved a meet time for your exchange.`,
        link: dealId ? `/deals/${dealId}` : '/deals',
      };
    case NOTIFICATION_TYPES.TRADE_COMPLETED:
      return {
        message: `Your exchange with ${name} is done! Leave your review so they can trade again.`,
        link: dealId ? `/deals/${dealId}` : '/deals',
      };
    case NOTIFICATION_TYPES.TRADE_COUNTERED:
      return {
        message: `${name} countered the exchange. Your turn to update your offer.`,
        link: dealId ? `/deals/${dealId}` : '/deals',
      };
    case NOTIFICATION_TYPES.TRADE_CONFIRM_WAITING:
      return {
        message: `${name} confirmed the agreed terms. Your turn to confirm so you can schedule.`,
        link: dealId ? `/deals/${dealId}` : '/deals',
      };
    case NOTIFICATION_TYPES.TRADE_MARK_COMPLETE_PENDING:
      return {
        message: `${name} marked the exchange complete. Mark yours when you're ready so reviews can open.`,
        link: dealId ? `/deals/${dealId}` : '/deals',
      };
    case NOTIFICATION_TYPES.NEW_MESSAGE:
      return {
        message: `${name} sent you a message.`,
        link: dealId ? `/deals/${dealId}` : '/deals',
      };
    case NOTIFICATION_TYPES.REVIEW_REMINDER:
      return {
        message: `Giff is waiting… ${name} already left their review. Your turn.`,
        link: dealId ? `/deals/${dealId}/review` : '/deals',
      };
    case NOTIFICATION_TYPES.REVIEW_RECEIVED:
      return {
        message: `Your review from ${name} is live. See what they said about you.`,
        link: payload.memberId ? `/members/${payload.memberId}` : '/me',
      };
    case NOTIFICATION_TYPES.REVIEWS_CLOSED:
      return {
        message: 'This exchange is complete. Reviews are now closed.',
        link: dealId ? `/deals/${dealId}` : '/deals',
      };
    case NOTIFICATION_TYPES.MATCH:
      return {
        message: `It's a match with ${name}! Giff thinks you two would trade well together.`,
        link: '/matches',
      };
    case NOTIFICATION_TYPES.BADGE_EARNED:
      return {
        message: `You earned ${badgeLabel}!`,
        link: '/me',
      };
    case NOTIFICATION_TYPES.POST_INTEREST: {
      const what = payload.postWhat ? `: "${payload.postWhat}"` : '';
      return {
        message: `${name} is interested in your post${what}`,
        link: payload.postId ? `/bulletin/${payload.postId}` : '/bulletin',
      };
    }
    default:
      return { message: 'You have a new notification.', link: '/' };
  }
}

// Copy limits (match the spec).
export const LIMITS = Object.freeze({
  BIO_MAX: 150,
  REVIEW_MAX: REVIEW_LIMITS.WRITTEN_MAX,
  TALENTS_MAX: 3,
  SERVICES_MAX: 3,
  PROOF_PHOTOS_MAX: 6,
});

export const SUBSCRIPTION_PRICE = { amount: 999, currency: 'USD', label: '$9.99/mo' };

// External link — users will bounce out to Checkr for the real background
// check (API integration is phase 2). For MVP we just record confirmation.
export const CHECKR_URL = 'https://checkr.com';
