import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, orderBy, query } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import clsx from 'clsx';
import { db } from '../../firebase.js';
import { sendDealMessage } from '../../lib/deals.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { timeAgo } from '../../lib/format.js';

export default function MessageThread({ dealId }) {
  const { user } = useAuth();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const msgsQuery = useMemo(
    () => query(
      collection(db, 'deals', dealId, 'messages'),
      orderBy('createdAt', 'asc'),
    ),
    [dealId],
  );
  const [snap] = useCollection(msgsQuery);
  const messages = snap?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

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
    <div className="card flex flex-col">
      <div
        ref={scrollRef}
        className="p-3 space-y-2 max-h-80 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-ink-300 text-center py-6">
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
                    ? 'bg-gold-500/20 text-gold-200 rounded-br-sm'
                    : 'bg-navy-800 text-ink-50 rounded-bl-sm',
                )}
              >
                <div>{m.text}</div>
                <div className="text-[10px] text-ink-300 mt-1">
                  {timeAgo(m.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} className="flex gap-2 p-2 border-t border-navy-800">
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
    </div>
  );
}
