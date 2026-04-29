import { Link } from 'react-router-dom';
import DealCompletionPhotoManager from '../photos/DealCompletionPhotoManager.jsx';

export default function StepExchangeDone({
  kind,
  deal,
  user,
  other,
  canReview,
  reviewLink,
}) {
  if (kind === 'declined') {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-3 text-center px-2 py-10">
        <p className="text-lg font-semibold text-ink-primary">This exchange was declined.</p>
        <p className="text-sm text-ink-muted">You can start a new one anytime from Browse or Matches.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="card-cream p-4 text-sm text-ink-secondary flex items-center gap-3">
        <img src="/giff/gift.png" alt="" className="h-10 w-10 shrink-0" />
        <div>
          <div className="font-semibold text-ink-primary">Exchange complete</div>
          <div className="text-ink-muted">Small acts. Big impact.</div>
        </div>
      </div>
      <DealCompletionPhotoManager deal={deal} uid={user.uid} otherName={other?.displayName} />
      {canReview && other ? (
        <div className="card p-4 space-y-3 border-green/20 bg-green/5">
          <div className="text-sm font-semibold text-ink-primary">Your turn — leave a review</div>
          <p className="text-xs text-ink-muted">
            Reviews are blind until you both submit. Honest feedback helps everyone trade with confidence.
          </p>
          <Link to={reviewLink} className="btn-primary w-full text-center block">
            Leave your review
          </Link>
        </div>
      ) : null}
    </div>
  );
}
