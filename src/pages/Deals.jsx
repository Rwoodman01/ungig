// "Exchanges" tab — every deal the current user is part of.
// Relies on denormalized `participantIds` for a single array-contains query.

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { collection, doc, getDoc, orderBy, query, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import SwipeableDealRow from '../components/deals/SwipeableDealRow.jsx';
import { DEAL_STATUS } from '../lib/constants.js';
import { timeAgo } from '../lib/format.js';
import { deleteDealWithSubcollections } from '../lib/deals.js';

const STATUS_LABEL = {
  [DEAL_STATUS.PROPOSED]: 'Proposed',
  [DEAL_STATUS.REVIEW]: 'In review',
  [DEAL_STATUS.COUNTERED]: 'Countered',
  [DEAL_STATUS.CONFIRMING]: 'Confirming',
  [DEAL_STATUS.REQUESTED]: 'Requested',
  [DEAL_STATUS.ACCEPTED]: 'Accepted',
  [DEAL_STATUS.SCHEDULED]: 'Scheduled',
  [DEAL_STATUS.COMPLETED]: 'Completed',
  [DEAL_STATUS.REVIEWED]: 'Reviewed',
  [DEAL_STATUS.DECLINED]: 'Declined',
};

const DELETABLE_STATUSES = new Set([
  DEAL_STATUS.DECLINED,
  DEAL_STATUS.COMPLETED,
  DEAL_STATUS.REVIEWED,
]);

export default function Deals() {
  const { user } = useAuth();
  const [namesById, setNamesById] = useState({});
  const [dealToDelete, setDealToDelete] = useState(null);
  const [removeError, setRemoveError] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const uid = user?.uid ?? null;

  const q = useMemo(
    () => {
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

  const deals = uid && snap
    ? (snap.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [])
    : [];

  useEffect(() => {
    let cancelled = false;
    if (!uid || loading || error) return () => { cancelled = true; };
    try {
      const otherIds = Array.from(
        new Set(deals.flatMap((d) => [d.initiatorId, d.receiverId]).filter(Boolean)),
      ).filter((id) => id !== uid);
      if (!otherIds.length) return undefined;

      (async () => {
        try {
          const entries = await Promise.all(otherIds.map(async (otherUid) => {
            try {
              const s = await getDoc(doc(db, 'users', otherUid));
              const name = s.exists()
                ? (s.data()?.displayName ?? 'Unknown Member')
                : 'Unknown Member';
              return [otherUid, name];
            } catch {
              return [otherUid, 'Unknown Member'];
            }
          }));
          if (!cancelled) {
            setNamesById((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
          }
        } catch {
          /* deals page should still render */
        }
      })();
    } catch {
      /* ignore */
    }

    return () => { cancelled = true; };
  }, [deals, uid, loading, error]);

  const confirmRemove = useCallback(async () => {
    if (!dealToDelete?.id || !uid) return;
    setRemoveError(null);
    setRemoveBusy(true);
    try {
      await deleteDealWithSubcollections(dealToDelete.id, uid);
      setDealToDelete(null);
    } catch (e) {
      setRemoveError(e?.message ?? 'Could not remove this exchange.');
    } finally {
      setRemoveBusy(false);
    }
  }, [dealToDelete, uid]);

  if (!uid) {
    return <Spinner />;
  }
  if (loading) {
    return <Spinner />;
  }
  if (error) {
    return <p className="text-red-400 text-sm">Error: {error.message}</p>;
  }

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
        const iAmInitiator = d.initiatorId === uid;
        const otherId = iAmInitiator ? d.receiverId : d.initiatorId;
        const otherName = namesById[otherId] ?? 'Unknown Member';
        const canDelete = DELETABLE_STATUSES.has(d.status);

        return (
          <SwipeableDealRow
            key={d.id}
            canDelete={canDelete}
            to={`/deals/${d.id}`}
            onDeletePress={() => setDealToDelete({ id: d.id })}
          >
            <div className="flex items-center justify-between gap-3">
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
            </div>
          </SwipeableDealRow>
        );
      })}

      {dealToDelete ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-surface rounded-[20px] w-full max-w-sm p-5 shadow-2xl border border-border">
            <p className="text-sm text-ink-muted leading-relaxed">
              Remove this exchange? This cannot be undone.
            </p>
            {removeError ? (
              <p className="text-sm text-red-400 mt-2">{removeError}</p>
            ) : null}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn-secondary"
                disabled={removeBusy}
                onClick={() => {
                  setDealToDelete(null);
                  setRemoveError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary bg-coral border-coral hover:bg-coral/90 disabled:opacity-50"
                disabled={removeBusy}
                onClick={confirmRemove}
              >
                {removeBusy ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
