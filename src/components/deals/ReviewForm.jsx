import { useState } from 'react';
import clsx from 'clsx';
import { submitReview } from '../../lib/deals.js';
import { LIMITS } from '../../lib/constants.js';

export default function ReviewForm({ dealId, reviewerId, revieweeId, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await submitReview({ dealId, reviewerId, revieweeId, rating, comment });
      onDone?.();
    } catch (err) {
      setError(err.message ?? 'Could not submit review.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="card p-4 space-y-3">
      <h3 className="font-semibold text-ink-primary">Leave a review</h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setRating(n)}
            className={clsx(
              'text-2xl',
              n <= rating ? 'text-gold' : 'text-ink-muted',
            )}
            aria-label={`Rate ${n} star${n === 1 ? '' : 's'}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="input min-h-[5rem]"
        placeholder="A short note about your experience (public)."
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, LIMITS.REVIEW_MAX))}
      />
      <div className="text-xs text-ink-muted text-right">
        {comment.length}/{LIMITS.REVIEW_MAX}
      </div>
      {error ? <p className="text-red-400 text-sm">{error}</p> : null}
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
  );
}
