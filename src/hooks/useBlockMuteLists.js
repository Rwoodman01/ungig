import { useMemo } from 'react';
import { collection } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebase.js';

/**
 * Live sets for block/mute filtering. `hiddenMemberIds` = I blocked them OR they blocked me.
 */
export function useBlockMuteLists(uid) {
  const blocksRef = useMemo(
    () => (uid ? collection(db, 'users', uid, 'blocks') : null),
    [uid],
  );
  const blockedByRef = useMemo(
    () => (uid ? collection(db, 'users', uid, 'blockedBy') : null),
    [uid],
  );
  const mutesRef = useMemo(
    () => (uid ? collection(db, 'users', uid, 'mutes') : null),
    [uid],
  );

  const [blocksSnap, blocksLoading, blocksError] = useCollection(blocksRef);
  const [blockedBySnap, blockedByLoading, blockedByError] = useCollection(blockedByRef);
  const [mutesSnap, mutesLoading, mutesError] = useCollection(mutesRef);

  const blockedByMeIds = useMemo(
    () => new Set((blocksSnap?.docs ?? []).map((d) => d.id)),
    [blocksSnap],
  );
  const blockedMeIds = useMemo(
    () => new Set((blockedBySnap?.docs ?? []).map((d) => d.id)),
    [blockedBySnap],
  );
  const hiddenMemberIds = useMemo(() => {
    const s = new Set(blockedByMeIds);
    blockedMeIds.forEach((id) => s.add(id));
    return s;
  }, [blockedByMeIds, blockedMeIds]);
  const mutedIds = useMemo(
    () => new Set((mutesSnap?.docs ?? []).map((d) => d.id)),
    [mutesSnap],
  );

  const loading = Boolean(uid) && (blocksLoading || blockedByLoading || mutesLoading);
  const error = blocksError || blockedByError || mutesError;

  return {
    blockedByMeIds,
    blockedMeIds,
    hiddenMemberIds,
    mutedIds,
    loading,
    error,
  };
}
