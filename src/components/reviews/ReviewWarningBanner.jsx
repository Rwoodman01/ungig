import { REVIEW_LIMITS } from '../../lib/constants.js';

export default function ReviewWarningBanner({ unreviewedCount }) {
  if (unreviewedCount < REVIEW_LIMITS.UNREVIEWED_WARNING_THRESHOLD) return null;
  return (
    <div className="rounded-2xl border border-gold/50 bg-gold/10 px-4 py-3 text-sm text-ink-primary">
      <strong className="text-gold">Heads up:</strong>{' '}
      This member has a pattern of not completing reviews after exchanges close.
    </div>
  );
}
