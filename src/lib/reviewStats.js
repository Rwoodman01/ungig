import { REVIEW_LIMITS, SKILL_TAGS } from './constants.js';

/** Queue entries past auto-close window with no review submitted (still in queue). */
export function countStaleReviewQueueItems(items = []) {
  const maxMs = REVIEW_LIMITS.AUTO_CLOSE_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return items.filter((item) => {
    const t = item.completedAt?.toMillis?.() ?? 0;
    return t > 0 && now - t > maxMs;
  }).length;
}

/** @param {Array<{ starRating?: number, showedUp?: boolean, wouldTradeAgain?: boolean, skillTags?: string[] }>} visibleReviews */
export function aggregateReviewStats(visibleReviews = []) {
  const list = visibleReviews.filter((r) => r.visibleAt != null);
  const n = list.length;
  if (n === 0) {
    return {
      count: 0,
      average: null,
      wouldAgainPct: null,
      showedUpPct: null,
      tagCounts: {},
      topTag: null,
    };
  }

  const sumStars = list.reduce((s, r) => s + Number(r.starRating ?? r.rating ?? 0), 0);
  const wouldAgain = list.filter((r) => r.wouldTradeAgain === true).length;
  const showed = list.filter((r) => r.showedUp === true).length;

  const tagCounts = {};
  for (const r of list) {
    for (const t of r.skillTags ?? []) {
      if (!SKILL_TAGS.includes(t)) continue;
      tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }
  }
  let topTag = null;
  let topN = 0;
  for (const [t, c] of Object.entries(tagCounts)) {
    if (c > topN) {
      topN = c;
      topTag = t;
    }
  }

  return {
    count: n,
    average: Math.round((sumStars / n) * 10) / 10,
    wouldAgainPct: Math.round((wouldAgain / n) * 100),
    showedUpPct: Math.round((showed / n) * 100),
    tagCounts,
    topTag,
  };
}

export function tagSizeClass(count, max) {
  if (!max || !count) return 'text-sm';
  const r = count / max;
  if (r >= 0.85) return 'text-xl font-semibold';
  if (r >= 0.5) return 'text-lg font-medium';
  if (r >= 0.25) return 'text-base';
  return 'text-sm';
}
