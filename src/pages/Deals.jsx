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
  const uid = user?.uid ?? null;
  // Debug breadcrumbs — production-only crash investigation.
  // eslint-disable-next-line no-console
  console.error('[Deals] render start', { hasUser: Boolean(user), uid });
  const q = useMemo(
    () => {
      // eslint-disable-next-line no-console
      console.error('[Deals] building deals query', { uid });
      if (!uid) return null;
      return query(
        collection(db, 'deals'),
        where('participantIds', 'array-contains', uid),
        orderBy('updatedAt', 'desc'),
      );
    },
    [uid],
  );
  const [snap, loading, error] = useCollection(q);

  // Always define `deals` so hooks can run in a stable order.
  const deals = uid && snap
    ? (snap.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [])
    : [];
  // eslint-disable-next-line no-console
  console.error('[Deals] snapshot mapped', { docCount: snap?.docs?.length ?? 0, dealsCount: deals.length, loading });

  // IMPORTANT: keep hook order stable by declaring effects before any early returns.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line no-console
    console.error('[Deals] hydration effect start', { dealsCount: deals.length, uid });
    if (!uid || loading || error) return () => { cancelled = true; };
    try {
      const otherIds = Array.from(
        new Set(deals.flatMap((d) => [d.initiatorId, d.receiverId]).filter(Boolean)),
      ).filter((id) => id !== uid);
      // eslint-disable-next-line no-console
      console.error('[Deals] hydration otherIds computed', { otherIdsCount: otherIds.length, otherIds });
      if (!otherIds.length) return undefined;

      (async () => {
        try {
          const entries = await Promise.all(otherIds.map(async (uid) => {
            try {
              const s = await getDoc(doc(db, 'users', uid));
              const name = s.exists()
                ? (s.data()?.displayName ?? 'Unknown Member')
                : 'Unknown Member';
              return [uid, name];
            } catch {
              // eslint-disable-next-line no-console
              console.error('[Deals] hydration getDoc failed', { otherUid: uid });
              return [uid, 'Unknown Member'];
            }
          }));
          if (!cancelled) {
            // eslint-disable-next-line no-console
            console.error('[Deals] hydration success; setting namesById', { entriesCount: entries.length });
            setNamesById((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
          }
        } catch (e) {
          // ignore — deals page should still render even if hydration fails
          // eslint-disable-next-line no-console
          console.error('[Deals] hydration Promise.all failed', { message: e?.message, name: e?.name, stack: e?.stack });
        }
      })();
    } catch (e) {
      // ignore — deals page should still render even if hydration setup fails
      // eslint-disable-next-line no-console
      console.error('[Deals] hydration outer setup failed', { message: e?.message, name: e?.name, stack: e?.stack });
    }

    return () => { cancelled = true; };
  }, [deals, uid, loading, error]);

  if (!uid) {
    // eslint-disable-next-line no-console
    console.error('[Deals] missing user.uid at render, showing Spinner');
    return <Spinner />;
  }
  if (loading) {
    // eslint-disable-next-line no-console
    console.error('[Deals] useCollection loading');
    return <Spinner />;
  }
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[Deals] useCollection error', { message: error.message, name: error.name, stack: error.stack });
    return <p className="text-red-400 text-sm">Error: {error.message}</p>;
  }

  if (deals.length === 0) {
    // eslint-disable-next-line no-console
    console.error('[Deals] no deals; rendering EmptyState');
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
        try {
          const iAmInitiator = d.initiatorId === uid;
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
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[Deals] render row failed', {
            dealId: d?.id,
            message: e?.message,
            name: e?.name,
            stack: e?.stack,
          });
          throw e;
        }
      })}
    </div>
  );
}
