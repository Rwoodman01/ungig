// "Exchanges" tab — every deal the current user is part of.
// Relies on denormalized `participantIds` for a single array-contains query.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, doc, getDoc, orderBy, query, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { DEAL_STATUS } from '../lib/constants.js';
import { timeAgo } from '../lib/format.js';

const STATUS_LABEL = {
  [DEAL_STATUS.REQUESTED]: 'Requested',
  [DEAL_STATUS.ACCEPTED]: 'Accepted',
  [DEAL_STATUS.SCHEDULED]: 'Scheduled',
  [DEAL_STATUS.COMPLETED]: 'Completed',
  [DEAL_STATUS.REVIEWED]: 'Reviewed',
  [DEAL_STATUS.DECLINED]: 'Declined',
};

export default function Deals() {
  const { user } = useAuth();
  const [namesById, setNamesById] = useState({});
  const q = useMemo(
    () => query(
      collection(db, 'deals'),
      where('participantIds', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc'),
    ),
    [user.uid],
  );
  const [snap, loading, error] = useCollection(q);

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-400 text-sm">Error: {error.message}</p>;

  const deals = snap?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [];

  useEffect(() => {
    let cancelled = false;
    const otherIds = Array.from(new Set(deals.flatMap((d) => [d.initiatorId, d.receiverId]).filter(Boolean)))
      .filter((id) => id !== user.uid);
    if (!otherIds.length) return undefined;

    (async () => {
      const entries = await Promise.all(otherIds.map(async (uid) => {
        try {
          const s = await getDoc(doc(db, 'users', uid));
          const name = s.exists() ? (s.data()?.displayName ?? 'Unknown Member') : 'Unknown Member';
          return [uid, name];
        } catch {
          return [uid, 'Unknown Member'];
        }
      }));
      if (!cancelled) {
        setNamesById((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      }
    })();

    return () => { cancelled = true; };
  }, [deals, user.uid]);

  if (deals.length === 0) {
    return (
      <EmptyState
        title="No exchanges yet"
        description="Find your match and propose your first exchange to get started."
        action={
          <Link to="/browse" className="btn-primary inline-flex">
            Find your match
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-display font-bold text-ink-primary">Exchanges</h1>
      {deals.map((d) => {
        const iAmInitiator = d.initiatorId === user.uid;
        const otherId = iAmInitiator ? d.receiverId : d.initiatorId;
        const otherName = namesById[otherId] ?? 'Unknown Member';
        return (
          <Link
            key={d.id}
            to={`/deals/${d.id}`}
            className="card p-4 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="text-sm text-ink-muted">
                With <span className="text-ink-primary">{otherName}</span>
                {iAmInitiator ? ' (you requested)' : ' (they requested)'}
              </div>
              <div className="text-xs text-ink-muted mt-1">
                Updated {timeAgo(d.updatedAt)}
              </div>
            </div>
            <span className="chip-gold text-[10px]">
              {STATUS_LABEL[d.status] ?? d.status}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
