import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebase.js';

const STORAGE_KEY = 'ungig_dm_last_read_v1';

function loadReadMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return typeof o === 'object' && o ? o : {};
  } catch {
    return {};
  }
}

function saveReadMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

/**
 * Tracks latest incoming (other party) message time per deal and compares to
 * per-deal read timestamps in localStorage for a global DM unread dot.
 */
export function useDealDmUnread(uid, hiddenMemberIds) {
  const [readMap, setReadMap] = useState(loadReadMap);
  const [latestIncomingByDeal, setLatestIncomingByDeal] = useState({});

  const dealsQuery = useMemo(() => {
    if (!uid) return null;
    return query(
      collection(db, 'deals'),
      where('participantIds', 'array-contains', uid),
      orderBy('updatedAt', 'desc'),
    );
  }, [uid]);

  const [dealsSnap] = useCollection(dealsQuery);
  const deals = useMemo(() => {
    const raw = (dealsSnap?.docs ?? []).map((d) => ({ id: d.id, ...d.data() }));
    if (!uid || !hiddenMemberIds || hiddenMemberIds.size === 0) return raw;
    return raw.filter((d) => {
      const other = d.participantIds?.find((id) => id !== uid);
      return other && !hiddenMemberIds.has(other);
    });
  }, [dealsSnap, uid, hiddenMemberIds]);
  const dealIds = useMemo(() => deals.map((d) => d.id), [deals]);

  useEffect(() => {
    if (!uid) {
      setLatestIncomingByDeal({});
      return undefined;
    }
    if (!dealIds.length) {
      setLatestIncomingByDeal({});
      return undefined;
    }

    const unsubs = dealIds.map((dealId) => {
      const mq = query(
        collection(db, 'deals', dealId, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(40),
      );
      return onSnapshot(mq, (snap) => {
        let maxOther = 0;
        for (const d of snap.docs) {
          const data = d.data();
          if (data.senderId && data.senderId !== uid) {
            const ms = data.createdAt?.toMillis?.() ?? 0;
            if (ms > maxOther) maxOther = ms;
          }
        }
        setLatestIncomingByDeal((prev) => {
          if (prev[dealId] === maxOther) return prev;
          return { ...prev, [dealId]: maxOther };
        });
      });
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [uid, dealIds]);

  const markDealRead = useCallback((dealId, atMs = Date.now()) => {
    setReadMap((prev) => {
      const cur = prev[dealId] ?? 0;
      const nextMs = Math.max(cur, atMs);
      if (nextMs === cur) return prev;
      const next = { ...prev, [dealId]: nextMs };
      saveReadMap(next);
      return next;
    });
  }, []);

  const hasUnreadDm = useMemo(() => {
    if (!dealIds.length) return false;
    return dealIds.some((id) => {
      const incoming = latestIncomingByDeal[id] ?? 0;
      if (!incoming) return false;
      const readAt = readMap[id] ?? 0;
      return incoming > readAt;
    });
  }, [dealIds, latestIncomingByDeal, readMap]);

  const hasUnreadForDeal = useCallback(
    (id) => {
      if (!id) return false;
      const incoming = latestIncomingByDeal[id] ?? 0;
      if (!incoming) return false;
      const readAt = readMap[id] ?? 0;
      return incoming > readAt;
    },
    [latestIncomingByDeal, readMap],
  );

  return { hasUnreadDm, hasUnreadForDeal, markDealRead, dealIds, deals };
}
