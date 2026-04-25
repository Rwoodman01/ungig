import { Link } from 'react-router-dom';
import { MEMBER_STATUS, POST_LIMITS } from '../../lib/constants.js';

export default function LockedPosting({ userDoc }) {
  const isApproved = userDoc?.status === MEMBER_STATUS.APPROVED;
  const trades = userDoc?.tradeCount ?? 0;

  return (
    <div className="card-cream p-5 text-center">
      <div className="text-2xl mb-2" aria-hidden>📌</div>
      <h2 className="text-base font-bold text-ink-primary">
        Posting unlocks after your first gift.
      </h2>
      <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
        {!isApproved ? (
          <>Once your culture call is complete you can browse, propose, and post.</>
        ) : (
          <>
            Trade once with the community
            {` (${trades}/${POST_LIMITS.MIN_TRADES_TO_POST})`}{' '}
            and you'll be able to pin notes to the local board.
          </>
        )}
      </p>
      <p className="mt-3 text-sm text-ink-secondary">
        You can still read every post and tap{' '}
        <strong className="text-ink-primary">I'm interested</strong>.
      </p>
      <Link to="/browse" className="btn-secondary mt-4 inline-flex">
        Find your match
      </Link>
    </div>
  );
}
