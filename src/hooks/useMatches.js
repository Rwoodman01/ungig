import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebase.js';
import { MATCH_STATUS } from '../lib/constants.js';

export function useMatches(uid) {
  const matchesQuery = useMemo(
    () => (uid
      ? query(
        collection(db, 'matches'),
        where('participantIds', 'array-contains', uid),
        orderBy('createdAt', 'desc'),
      )
      : null),
    [uid],
  );
  const [snap, loading, error] = useCollection(matchesQuery);
  const [hydrated, setHydrated] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const rows = snap?.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((m) => m.status === MATCH_STATUS.ACTIVE) ?? [];

    (async () => {
      const out = await Promise.all(rows.map(async (match) => {
        const otherUid = match.participantIds?.find((id) => id !== uid);
        if (!otherUid) return { ...match, other: null };
        const userSnap = await getDoc(doc(db, 'users', otherUid));
        return {
          ...match,
          other: userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null,
        };
      }));
      if (!cancelled) setHydrated(out);
    })();

    return () => { cancelled = true; };
  }, [snap, uid]);

  return {
    matches: hydrated,
    loading,
    error,
    count: hydrated.length,
  };
}
