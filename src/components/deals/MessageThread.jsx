import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, orderBy, query } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import clsx from 'clsx';
import { db } from '../../firebase.js';
import { sendDealMessage } from '../../lib/deals.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { timeAgo } from '../../lib/format.js';

export default function MessageThread({ dealId, embedded = false, onMarkRead, messagingLocked = false }) {
  const { user, canEngage } = useAuth();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  /** Fingerprint of snapshot so we do not call onMarkRead when nothing meaningful changed. */
  const lastReadFingerprintRef = useRef(null);

  const msgsQuery = useMemo(
    () => query(
      collection(db, 'deals', dealId, 'messages'),
      orderBy('createdAt', 'asc'),
    ),
    [dealId],
  );
  const [snap, loading, error] = useCollection(msgsQuery);
  const messages = snap?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [];

  useEffect(() => {
    lastReadFingerprintRef.current = null;
  }, [dealId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Clears global DM unread when parent passes onMarkRead (Deal detail or panel).
  // Depends on `snap`, not `messages`, because `messages` is a new array every render and would loop.
  useEffect(() => {
    if (!onMarkRead || !dealId || !user?.uid) return;
    const docs = snap?.docs ?? [];
    let latestOther = 0;
    for (const d of docs) {
      const data = d.data();
      if (data.senderId && data.senderId !== user.uid) {
        latestOther = Math.max(latestOther, data.createdAt?.toMillis?.() ?? 0);
      }
    }
    const fp = `${docs.length}:${latestOther}`;
    if (lastReadFingerprintRef.current === fp) return;
    lastReadFingerprintRef.current = fp;
    const at = latestOther > 0 ? latestOther : Date.now();
    onMarkRead(dealId, at);
  }, [onMarkRead, dealId, user?.uid, snap]);

  const send = async (e) => {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await sendDealMessage(dealId, user.uid, draft);
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={clsx(
        'card flex flex-col',
        embedded && 'flex-1 min-h-0 border-0 shadow-none',
      )}
    >
      <div
        ref={scrollRef}
        className={clsx(
          'p-3 space-y-2 overflow-y-auto',
          embedded ? 'flex-1 min-h-0 max-h-none' : 'max-h-80',
        )}
      >
        {loading ? (
          <p className="text-xs text-ink-muted text-center py-6">Loading messages…</p>
        ) : null}
        {error ? (
          <p className="text-xs text-coral text-center py-6">{error.message}</p>
        ) : null}
        {!loading && !error && messages.length === 0 ? (
          <p className="text-xs text-ink-muted text-center py-6">
            Start the conversation. Agree on what each of you will provide and
            pick a date.
          </p>
        ) : null}
        {messages.map((m) => {
          const mine = m.senderId === user.uid;
          return (
            <div key={m.id} className={clsx('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={clsx(
                  'max-w-[75%] px-3 py-2 rounded-2xl text-sm',
                  mine
                    ? 'bg-green-50 text-ink-primary border border-border rounded-br-sm'
                    : 'bg-cream text-ink-primary border border-border rounded-bl-sm',
                )}
              >
                <div>{m.text}</div>
                <div className="text-[10px] text-ink-muted mt-1">
                  {timeAgo(m.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {messagingLocked ? (
        <div className="p-3 border-t border-border text-center text-xs text-ink-muted">
          {"Messaging isn't available for this exchange."}
        </div>
      ) : canEngage ? (
        <form onSubmit={send} className="flex gap-2 p-2 border-t border-border">
          <input
            className="input flex-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message..."
            maxLength={1000}
          />
          <button className="btn-primary px-4" disabled={!draft.trim() || sending}>
            Send
          </button>
        </form>
      ) : (
        <div className="p-3 border-t border-border text-center text-xs text-ink-muted">
          🤝 Messaging unlocks once your culture call is complete.
        </div>
      )}
    </div>
  );
}
