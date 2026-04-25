// useBulletinPosts — live-subscribes to active, non-expired posts on the
// bulletin board, optionally filtered by type and locationKey.
//
// We deliberately do client-side expiry filtering on top of a server-side
// query so the UI stays clean even if the Firestore TTL policy hasn't yet
// swept old docs (TTL runs roughly daily).

import { useMemo } from 'react';
import { collection, orderBy, query, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebase.js';
import { POST_STATUS } from '../lib/constants.js';

export function useBulletinPosts({ locationKey = '', type = '' } = {}) {
  const q = useMemo(() => {
    const constraints = [where('status', '==', POST_STATUS.ACTIVE)];
    if (type) constraints.push(where('type', '==', type));
    if (locationKey) constraints.push(where('locationKey', '==', locationKey));
    constraints.push(orderBy('createdAt', 'desc'));
    return query(collection(db, 'posts'), ...constraints);
  }, [type, locationKey]);

  const [snap, loading, error] = useCollection(q);

  const posts = useMemo(() => {
    if (!snap) return [];
    const now = Date.now();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p) => {
        const exp = p.expiresAt?.toMillis?.();
        return !exp || exp > now;
      });
  }, [snap]);

  return { posts, loading, error };
}
