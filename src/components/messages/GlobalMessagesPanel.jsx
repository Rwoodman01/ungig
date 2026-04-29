import { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import clsx from 'clsx';
import { db } from '../../firebase.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useMessagesPanel } from '../../contexts/MessagesPanelContext.jsx';
import MessageThread from '../deals/MessageThread.jsx';
import Avatar from '../ui/Avatar.jsx';

function groupConnections(deals, myUid) {
  const byOther = new Map();
  for (const d of deals) {
    const otherId = d.participantIds?.find((id) => id !== myUid);
    if (!otherId) continue;
    const sortMs = d.updatedAt?.toMillis?.() ?? d.createdAt?.toMillis?.() ?? 0;
    const prev = byOther.get(otherId);
    if (!prev || sortMs > prev.sortMs) {
      byOther.set(otherId, { otherId, dealId: d.id, sortMs });
    }
  }
  return Array.from(byOther.values()).sort((a, b) => b.sortMs - a.sortMs);
}

export default function GlobalMessagesPanel() {
  const { user } = useAuth();
  const uid = user?.uid;
  const {
    open,
    closePanel,
    deals,
    markDealRead,
    dealThreadId,
    hiddenMemberIds,
  } = useMessagesPanel();
  const [view, setView] = useState('list');
  const [activeDealId, setActiveDealId] = useState(null);
  const [activeOtherId, setActiveOtherId] = useState(null);
  const [namesById, setNamesById] = useState({});
  const [dealPanelOtherName, setDealPanelOtherName] = useState('Member');

  const rows = useMemo(() => {
    const raw = uid ? groupConnections(deals, uid) : [];
    return raw.filter((r) => !hiddenMemberIds.has(r.otherId));
  }, [deals, uid, hiddenMemberIds]);

  const threadDeal = dealThreadId ? deals.find((x) => x.id === dealThreadId) : null;
  const threadOtherId = threadDeal?.participantIds?.find((id) => id !== uid);
  const threadMessagingLocked = Boolean(threadOtherId && hiddenMemberIds.has(threadOtherId));
  const activeMessagingLocked = Boolean(activeOtherId && hiddenMemberIds.has(activeOtherId));

  useEffect(() => {
    if (!open) {
      setView('list');
      setActiveDealId(null);
      setActiveOtherId(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !dealThreadId || !uid) return;
    markDealRead(dealThreadId, Date.now());
    const d = deals.find((x) => x.id === dealThreadId);
    const otherId = d?.participantIds?.find((id) => id !== uid);
    if (!otherId) {
      setDealPanelOtherName('Member');
      return;
    }
    let cancelled = false;
    getDoc(doc(db, 'users', otherId))
      .then((s) => {
        if (cancelled) return;
        setDealPanelOtherName(s.exists() ? (s.data()?.displayName ?? 'Member') : 'Member');
      })
      .catch(() => {
        if (!cancelled) setDealPanelOtherName('Member');
      });
    return () => { cancelled = true; };
  }, [open, dealThreadId, uid, deals, markDealRead]);

  useEffect(() => {
    const ids = rows.map((r) => r.otherId);
    if (!ids.length) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const s = await getDoc(doc(db, 'users', id));
            const name = s.exists()
              ? (s.data()?.displayName ?? 'Member')
              : 'Member';
            return [id, name];
          } catch {
            return [id, 'Member'];
          }
        }),
      );
      if (!cancelled) {
        setNamesById((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      }
    })();
    return () => { cancelled = true; };
  }, [rows]);

  const openThread = useCallback(
    (dealId, otherId) => {
      setActiveDealId(dealId);
      setActiveOtherId(otherId);
      setView('thread');
      markDealRead(dealId, Date.now());
    },
    [markDealRead],
  );

  const handleMarkRead = useCallback(
    (dealId, atMs) => {
      markDealRead(dealId, atMs);
    },
    [markDealRead],
  );

  const backToList = useCallback(() => {
    setView('list');
    setActiveDealId(null);
    setActiveOtherId(null);
  }, []);

  if (!open) return null;

  if (dealThreadId) {
    return (
      <div className="fixed inset-0 z-[45] flex flex-col justify-end">
        <button
          type="button"
          aria-label="Close messages"
          className="absolute inset-0 bg-ink-primary/40 backdrop-blur-[1px]"
          onClick={closePanel}
        />
        <div
          className={clsx(
            'relative bg-surface rounded-t-2xl shadow-2xl border border-border',
            'max-h-[min(88dvh,640px)] w-full max-w-app mx-auto flex flex-col',
          )}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex justify-center pt-2 pb-1">
            <div className="h-1 w-10 rounded-full bg-border" aria-hidden />
          </div>
          <div className="flex items-center justify-between px-4 pb-2 border-b border-border shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar name={dealPanelOtherName} size="sm" />
              <h2 className="font-display font-bold text-lg text-ink-primary truncate">Messages</h2>
            </div>
            <button type="button" className="btn-ghost text-sm shrink-0" onClick={closePanel}>
              Close
            </button>
          </div>
          <div className="flex-1 min-h-0 flex flex-col px-2 pb-3 pt-2 overflow-hidden">
            <MessageThread
              dealId={dealThreadId}
              embedded
              messagingLocked={threadMessagingLocked}
              onMarkRead={handleMarkRead}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[45] flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close messages"
        className="absolute inset-0 bg-ink-primary/40 backdrop-blur-[1px]"
        onClick={closePanel}
      />
      <div
        className={clsx(
          'relative bg-surface rounded-t-2xl shadow-2xl border border-border',
          'max-h-[min(88dvh,640px)] w-full max-w-app mx-auto flex flex-col',
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" aria-hidden />
        </div>

        {view === 'list' ? (
          <>
            <div className="flex items-center justify-between px-4 pb-2 border-b border-border">
              <h2 className="font-display font-bold text-lg text-ink-primary">Messages</h2>
              <button type="button" className="btn-ghost text-sm" onClick={closePanel}>
                Close
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 px-2 py-2">
              {rows.length === 0 ? (
                <p className="text-sm text-ink-muted text-center px-4 py-10">
                  No conversations yet. When you have an active exchange with someone,
                  you can message them here.
                </p>
              ) : (
                <ul className="space-y-1">
                  {rows.map(({ otherId, dealId }) => (
                    <li key={otherId}>
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-cream transition"
                        onClick={() => openThread(dealId, otherId)}
                      >
                        <Avatar name={namesById[otherId]} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-ink-primary truncate">
                            {namesById[otherId] ?? 'Member'}
                          </div>
                          <div className="text-xs text-ink-muted truncate">Open thread</div>
                        </div>
                        <svg className="h-4 w-4 text-ink-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 px-2 py-2 border-b border-border shrink-0">
              <button
                type="button"
                className="btn-ghost p-2 rounded-full"
                aria-label="Back to list"
                onClick={backToList}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Avatar name={namesById[activeOtherId]} size="sm" />
                <span className="font-semibold text-ink-primary truncate">
                  {namesById[activeOtherId] ?? 'Member'}
                </span>
              </div>
              <button type="button" className="btn-ghost text-sm shrink-0" onClick={closePanel}>
                Close
              </button>
            </div>
            <div className="flex-1 min-h-0 flex flex-col px-2 pb-3 pt-2 overflow-hidden">
              {activeDealId ? (
                <MessageThread
                  dealId={activeDealId}
                  embedded
                  messagingLocked={activeMessagingLocked}
                  onMarkRead={handleMarkRead}
                />
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
