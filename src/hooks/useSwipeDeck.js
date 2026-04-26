import { useCallback, useMemo } from 'react';
import { collection, orderBy, query, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebase.js';
import { MEMBER_STATUS } from '../lib/constants.js';
import { recordSwipe, swipesCollection } from '../lib/matches.js';
import { sortDeckMembers } from '../lib/matching.js';
import { isVisibleInMemberBrowse } from '../lib/memberBrowseVisibility.js';

export function useSwipeDeck({ user, userDoc, locationFilter = '' }) {
  const membersQuery = useMemo(
    () => query(
      collection(db, 'users'),
      where('status', '==', MEMBER_STATUS.APPROVED),
      orderBy('displayName'),
    ),
    [],
  );
  const swipesQuery = useMemo(
    () => (user?.uid ? query(swipesCollection(user.uid), orderBy('timestamp', 'desc')) : null),
    [user?.uid],
  );

  const [membersSnap, membersLoading, membersError] = useCollection(membersQuery);
  const [swipesSnap, swipesLoading, swipesError] = useCollection(swipesQuery);

  const swipes = useMemo(
    () => swipesSnap?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [],
    [swipesSnap],
  );

  const members = useMemo(
    () => (membersSnap?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [])
      .filter(isVisibleInMemberBrowse),
    [membersSnap],
  );

  const { primary, recycled } = useMemo(
    () => sortDeckMembers({ members, userDoc, swipes, locationFilter }),
    [members, userDoc, swipes, locationFilter],
  );

  const recordDecision = useCallback(async ({ targetUid, direction, source = 'swipe' }) => {
    await recordSwipe({ uid: user.uid, targetUid, direction, source });
  }, [user?.uid]);

  return {
    deck: primary,
    seenDeck: recycled,
    swipes,
    loading: membersLoading || swipesLoading,
    error: membersError || swipesError,
    recordDecision,
  };
}
