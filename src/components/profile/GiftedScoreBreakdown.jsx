import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { db } from '../../firebase.js';
import Spinner from '../ui/Spinner.jsx';
import GiftedScoreDisplay from '../ui/GiftedScoreDisplay.jsx';

function formatPct01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return '—';
  return `${Math.round(n * 100)}%`;
}

export default function GiftedScoreBreakdown({ uid, publicScore }) {
  const ref = uid ? doc(db, 'users', uid, 'giftedScoreMeta', 'breakdown') : null;
  const [snap, loading] = useDocument(ref);

  const data = snap?.exists() ? snap.data() : null;

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold text-ink-primary">Your Gifted Score</div>
          <div className="text-xs text-ink-muted mt-1">
            This is private to you. It updates as you trade, review, and stay active.
          </div>
        </div>
        <GiftedScoreDisplay score={publicScore} />
      </div>

      {loading ? <Spinner label="Loading score details…" /> : null}

      {data ? (
        <div className="space-y-2 text-sm text-ink-secondary">
          <div className="grid grid-cols-2 gap-2">
            <div className="card-cream p-3 rounded-xl border border-border">
              <div className="text-xs text-ink-muted">Completed trades</div>
              <div className="font-semibold text-ink-primary">
                {formatPct01(data.components?.trades?.score)}
              </div>
            </div>
            <div className="card-cream p-3 rounded-xl border border-border">
              <div className="text-xs text-ink-muted">Avg star rating</div>
              <div className="font-semibold text-ink-primary">
                {data.components?.stars?.avgStars ? data.components.stars.avgStars.toFixed(2) : '—'}
              </div>
            </div>
            <div className="card-cream p-3 rounded-xl border border-border">
              <div className="text-xs text-ink-muted">Would trade again</div>
              <div className="font-semibold text-ink-primary">
                {formatPct01(data.components?.wouldTradeAgain?.score)}
              </div>
            </div>
            <div className="card-cream p-3 rounded-xl border border-border">
              <div className="text-xs text-ink-muted">48h response rate</div>
              <div className="font-semibold text-ink-primary">
                {formatPct01(data.components?.responseRate?.score)}
              </div>
            </div>
            <div className="card-cream p-3 rounded-xl border border-border">
              <div className="text-xs text-ink-muted">Profile completeness</div>
              <div className="font-semibold text-ink-primary">
                {formatPct01(data.components?.completeness?.score)}
              </div>
            </div>
            <div className="card-cream p-3 rounded-xl border border-border">
              <div className="text-xs text-ink-muted">Penalties</div>
              <div className="font-semibold text-ink-primary">
                −{Math.round(Number(data.penalties?.inactivityPenaltyPoints ?? 0) + Number(data.penalties?.disputePenaltyPoints ?? 0))} pts
              </div>
              <div className="text-[11px] text-ink-muted mt-1">
                {data.penalties?.openDisputes ? `${data.penalties.openDisputes} unresolved conflict(s)` : 'No unresolved conflicts'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-ink-muted">
          We’re generating your score details. Check back in a moment.
        </div>
      )}
    </div>
  );
}

