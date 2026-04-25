import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getCountFromServer, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { POST_STATUS } from '../../lib/constants.js';
import { normalizeLocation } from '../../lib/bulletin.js';

export default function BulletinHomeCard({ userDoc }) {
  const locationKey = useMemo(
    () => normalizeLocation(userDoc?.location ?? ''),
    [userDoc?.location],
  );
  const [count, setCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const constraints = [
          where('status', '==', POST_STATUS.ACTIVE),
          where('expiresAt', '>', Timestamp.now()),
        ];
        if (locationKey) constraints.push(where('locationKey', '==', locationKey));
        const snap = await getCountFromServer(query(collection(db, 'posts'), ...constraints));
        if (!cancelled) setCount(snap.data().count ?? 0);
      } catch {
        if (!cancelled) setCount(null);
      }
    })();
    return () => { cancelled = true; };
  }, [locationKey]);

  const subtitle = count == null
    ? 'Local notes, offers, and asks.'
    : count === 0
      ? locationKey
        ? 'Be the first to pin something local.'
        : 'Be the first to pin something.'
      : `${count} active ${count === 1 ? 'post' : 'posts'}${locationKey ? ' near you' : ''}.`;

  return (
    <Link
      to="/bulletin"
      className="card p-5 flex items-start gap-4 hover:border-gold/50 transition border-l-[6px] border-l-gold"
    >
      <div className="text-3xl" aria-hidden>📌</div>
      <div className="min-w-0 flex-1">
        <div className="text-lg font-display font-bold text-ink-primary">
          Bulletin board
        </div>
        <p className="text-sm text-ink-muted mt-1">{subtitle}</p>
      </div>
      <div className="text-ink-muted shrink-0 text-xl">›</div>
    </Link>
  );
}
