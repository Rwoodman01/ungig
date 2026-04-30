import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import Avatar from '../ui/Avatar.jsx';
import { formatDate } from '../../lib/format.js';
import { flagReview } from '../../lib/reviews.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

function exchangeLine(review) {
  const a = review.exchangeOfferInitiator?.trim() || 'their offer';
  const b = review.exchangeOfferReceiver?.trim() || 'their offer';
  return `After exchanging ${a} for ${b}`;
}

function firstName(displayName) {
  if (!displayName) return 'Member';
  return displayName.split(/\s+/)[0];
}

export default function ReviewCard({ review }) {
  const { user } = useAuth();
  const [reviewer, setReviewer] = useState(null);
  const [flagBusy, setFlagBusy] = useState(false);
  const [flagMsg, setFlagMsg] = useState('');

  const canFlag = user && review.reviewerId !== user.uid && review.visibleAt;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', review.reviewerId));
        if (!cancelled && snap.exists()) setReviewer({ id: snap.id, ...snap.data() });
      } catch {
        if (!cancelled) setReviewer(null);
      }
    })();
    return () => { cancelled = true; };
  }, [review.reviewerId]);

  const onFlag = async () => {
    if (!user || !canFlag) return;
    setFlagBusy(true);
    setFlagMsg('');
    try {
      await flagReview(review.id, user.uid);
      setFlagMsg('Thanks — we recorded your flag.');
    } catch (e) {
      setFlagMsg(e.message ?? 'Could not flag.');
    } finally {
      setFlagBusy(false);
    }
  };

  return (
    <article className="card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Avatar src={reviewer?.photoURL} name={reviewer?.displayName} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-ink-primary truncate">
              {firstName(reviewer?.displayName)}
            </span>
            <span className="text-gold text-sm shrink-0" aria-label={`${review.starRating ?? review.rating} stars`}>
              {'★'.repeat(Number(review.starRating ?? review.rating) || 0)}
              <span className="text-ink-muted">
                {'★'.repeat(Math.max(0, 5 - (Number(review.starRating ?? review.rating) || 0)))}
              </span>
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">{formatDate(review.submittedAt ?? review.createdAt)}</p>
        </div>
      </div>
      <p className="text-sm text-ink-secondary leading-relaxed">{review.writtenReview ?? review.comment}</p>
      {review.skillTags?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {review.skillTags.map((t) => (
            <span key={t} className="rounded-full bg-sage/15 text-sage text-xs px-2 py-0.5 border border-sage/30">
              {t}
            </span>
          ))}
        </div>
      ) : null}
      <p className="text-xs text-ink-muted italic border-t border-border pt-2">
        {exchangeLine(review)}
      </p>
      {canFlag ? (
        <div className="flex items-center justify-between gap-2 pt-1">
          <button type="button" className="text-xs text-coral font-medium" onClick={onFlag} disabled={flagBusy}>
            {flagBusy ? '…' : 'Flag as inappropriate'}
          </button>
          {flagMsg ? <span className="text-xs text-ink-muted">{flagMsg}</span> : null}
        </div>
      ) : null}
      <Link to={`/deals/${review.dealId}`} className="text-xs text-green font-medium inline-block">
        View exchange
      </Link>
    </article>
  );
}
