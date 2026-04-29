import { DEAL_STATUS } from './constants.js';

const NEW_FLOW = new Set([
  DEAL_STATUS.PROPOSED,
  DEAL_STATUS.REVIEW,
  DEAL_STATUS.COUNTERED,
  DEAL_STATUS.CONFIRMING,
  DEAL_STATUS.SCHEDULED,
  DEAL_STATUS.COMPLETED,
  DEAL_STATUS.REVIEWED,
  DEAL_STATUS.DECLINED,
]);

/**
 * Map legacy deal.status values onto the exchange flow vocabulary.
 */
export function normalizeFlowStatus(deal) {
  const s = deal?.status;
  if (!s) return DEAL_STATUS.PROPOSED;
  if (NEW_FLOW.has(s)) return s;
  if (s === DEAL_STATUS.REQUESTED) {
    const hasInit = String(deal.initiatorService ?? '').trim().length > 0;
    return hasInit ? DEAL_STATUS.REVIEW : DEAL_STATUS.PROPOSED;
  }
  if (s === DEAL_STATUS.ACCEPTED) {
    return DEAL_STATUS.SCHEDULED;
  }
  return s;
}

/**
 * UI step index 1–6 and screen kind (drives one screen at a time).
 */
export function getExchangeUiStep(deal) {
  const s = normalizeFlowStatus(deal);
  if (s === DEAL_STATUS.DECLINED) {
    return { step: 0, kind: 'declined', totalDots: 6 };
  }
  if (s === DEAL_STATUS.REVIEWED) {
    return { step: 6, kind: 'reviewed', totalDots: 6 };
  }
  if (s === DEAL_STATUS.COMPLETED) {
    return { step: 6, kind: 'completed', totalDots: 6 };
  }
  if (s === DEAL_STATUS.SCHEDULED) {
    const hasDate = String(deal.scheduledDate ?? '').trim().length > 0;
    if (!hasDate) return { step: 4, kind: 'schedule', totalDots: 6 };
    return { step: 5, kind: 'markComplete', totalDots: 6 };
  }
  if (s === DEAL_STATUS.CONFIRMING) {
    return { step: 3, kind: 'mutualConfirm', totalDots: 6 };
  }
  if (s === DEAL_STATUS.REVIEW) {
    return { step: 2, kind: 'review', totalDots: 6 };
  }
  if (s === DEAL_STATUS.PROPOSED || s === DEAL_STATUS.COUNTERED) {
    return { step: 1, kind: 'offer', totalDots: 6 };
  }
  return { step: 1, kind: 'offer', totalDots: 6 };
}

/** Giff pose folder base name (variant 1–3 appended in hook). */
export function getGiffPoseBaseForUiStep(step) {
  if (step <= 0) return 'giff-thinking';
  if (step <= 2) return 'giff-thinking';
  if (step === 3) return 'giff-celebrate';
  if (step === 4) return 'giff-confirm';
  if (step === 5) return 'giff-schedule';
  return 'giff-complete';
}

export const EXCHANGE_STEP_LABELS = Object.freeze({
  0: 'Declined',
  1: 'Your offer',
  2: 'Review offer',
  3: 'Mutual confirm',
  4: 'Schedule',
  5: 'Mark complete',
  6: 'Complete',
});

export const FOREST_GREEN = '#1F4B33';
