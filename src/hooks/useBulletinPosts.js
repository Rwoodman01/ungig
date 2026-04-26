// useBulletinPosts — live-subscribes to active, non-expired posts on the
// bulletin board, optionally filtered by type and locationKey.
//
// Implementation note: we deliberately use ONE server-side query shape
// (status == active, ordered by createdAt) and apply type / locationKey /
// expiry filters on the client. This means the only Firestore composite
// index we depend on is `posts: status ASC, createdAt DESC`. Posts are
// short-lived (30-day TTL) and capped at 5 per user, so the working set
// fetched is small and this scales fine for the foreseeable future. If we
// ever outgrow it, we can layer in narrower server-side queries behind the
// matching indexes.

import { useMemo } from 'react';
import { collection, limit, orderBy, query, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebase.js';
import { POST_STATUS } from '../lib/constants.js';

const ACTIVE_POST_FETCH_LIMIT = 200;

export function useBulletinPosts({ locationKey = '', type = '' } = {}) {
  const q = useMemo(
    () => query(
      collection(db, 'posts'),
      where('status', '==', POST_STATUS.ACTIVE),
      orderBy('createdAt', 'desc'),
      limit(ACTIVE_POST_FETCH_LIMIT),
    ),
    [],
  );

  const [snap, loading, error] = useCollection(q);

  const posts = useMemo(() => {
    if (!snap) return [];
    const now = Date.now();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p) => {
        const exp = p.expiresAt?.toMillis?.();
        if (exp && exp <= now) return false;
        if (type && p.type !== type) return false;
        if (locationKey && p.locationKey !== locationKey) return false;
        return true;
      });
  }, [snap, type, locationKey]);

  return { posts, loading, error };
}
