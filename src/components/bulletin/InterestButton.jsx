import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { expressInterest } from '../../lib/bulletin.js';
import LockedAction from '../ui/LockedAction.jsx';

export default function InterestButton({ post }) {
  const navigate = useNavigate();
  const {
    user,
    userDoc,
    canEngage,
    hasPendingReviews,
    firstPendingDealId,
  } = useAuth();
  const [existing, setExisting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid || !post?.id) return undefined;
    const ref = doc(db, 'posts', post.id, 'interests', user.uid);
    return onSnapshot(ref, (snap) => {
      setExisting(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
  }, [user?.uid, post?.id]);

  if (!user || !userDoc) return null;
  if (post.authorId === user.uid) return null;

  if (!canEngage) {
    return (
      <LockedAction>
        Available once your culture call is complete.
      </LockedAction>
    );
  }

  if (hasPendingReviews) {
    return (
      <LockedAction>
        Finish your pending review before starting a new exchange.{' '}
        {firstPendingDealId ? (
          <a
            href={`/deals/${firstPendingDealId}/review`}
            className="text-green font-semibold underline"
          >
            Leave it now
          </a>
        ) : null}
      </LockedAction>
    );
  }

  if (existing?.dealId) {
    return (
      <button
        type="button"
        onClick={() => navigate(`/deals/${existing.dealId}`)}
        className="btn-secondary w-full"
      >
        View your exchange
      </button>
    );
  }

  const tap = async () => {
    setBusy(true);
    setError('');
    try {
      const dealId = await expressInterest({ post, uid: user.uid, userDoc });
      navigate(`/deals/${dealId}`);
    } catch (err) {
      setError(err?.message ?? 'Could not send interest.');
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={tap}
        className="btn-primary w-full"
        disabled={busy}
      >
        {busy ? 'Sending…' : "I'm interested"}
      </button>
      {error ? <p className="text-xs text-coral text-center">{error}</p> : null}
      <p className="text-[11px] text-ink-muted text-center">
        Sends a notification to the poster and opens an exchange thread.
      </p>
    </div>
  );
}
