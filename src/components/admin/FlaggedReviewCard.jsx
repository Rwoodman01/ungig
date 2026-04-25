import { useEffect, useState } from 'react';
import { adminResolveFlag, countFlaggedReviewsForReviewee } from '../../lib/reviews.js';
import { fetchReviewQueue } from '../../lib/reviewQueue.js';
import { countStaleReviewQueueItems } from '../../lib/reviewStats.js';

export default function FlaggedReviewCard({ review }) {
  const [busy, setBusy] = useState('');
  const [staleQueue, setStaleQueue] = useState(0);
  const [flagHistory, setFlagHistory] = useState(0);

  useEffect(() => {
    let c = false;
    (async () => {
      const [q, fh] = await Promise.all([
        fetchReviewQueue(review.revieweeId),
        countFlaggedReviewsForReviewee(review.revieweeId),
      ]);
      if (!c) {
        setStaleQueue(countStaleReviewQueueItems(q));
        setFlagHistory(fh);
      }
    })();
    return () => { c = true; };
  }, [review.revieweeId]);

  const doResolve = async (action) => {
    setBusy(action);
    try {
      await adminResolveFlag(review.id, action);
    } finally {
      setBusy('');
    }
  };

  const flagCount = review.flags?.length ?? 0;

  return (
    <article className="card p-4 space-y-3 border-coral/30">
      <div className="flex flex-wrap justify-between gap-2 text-xs text-ink-muted">
        <span>Review <strong className="text-ink-primary">{review.id}</strong></span>
        <span className="text-coral font-semibold">{flagCount} flag{flagCount === 1 ? '' : 's'}</span>
      </div>
      <p className="text-sm text-ink-secondary whitespace-pre-wrap">{review.writtenReview}</p>
      <div className="text-xs text-ink-muted space-y-1 border-t border-border pt-2">
        <div>Reviewer: <code className="text-ink-primary">{review.reviewerId}</code></div>
        <div>Reviewee: <code className="text-ink-primary">{review.revieweeId}</code></div>
        <div>Deal: <code className="text-ink-primary">{review.dealId}</code></div>
        <div>Unreviewed (7d+ closed): {staleQueue}</div>
        <div>Reviews ever flagged toward reviewee: {flagHistory}</div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-secondary flex-1"
          disabled={!!busy}
          onClick={() => doResolve('keep')}
        >
          {busy === 'keep' ? '…' : 'Approve (clear flags)'}
        </button>
        <button
          type="button"
          className="btn-primary flex-1 bg-coral border-coral hover:opacity-90"
          disabled={!!busy}
          onClick={() => doResolve('remove')}
        >
          {busy === 'remove' ? '…' : 'Remove'}
        </button>
      </div>
    </article>
  );
}
