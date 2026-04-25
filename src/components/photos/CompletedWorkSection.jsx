import { useMemo } from 'react';
import { collection, orderBy, query, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../../firebase.js';
import { DEAL_STATUS } from '../../lib/constants.js';
import PhotoGrid from './PhotoGrid.jsx';

export default function CompletedWorkSection({ memberId }) {
  const dealsQuery = useMemo(
    () => query(
      collection(db, 'deals'),
      where('participantIds', 'array-contains', memberId),
      orderBy('updatedAt', 'desc'),
    ),
    [memberId],
  );
  const [snap] = useCollection(dealsQuery);

  const photos = useMemo(() => {
    const rows = snap?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [];
    return rows
      .filter((deal) => deal.status === DEAL_STATUS.COMPLETED || deal.status === DEAL_STATUS.REVIEWED)
      .flatMap((deal) => (deal.completionPhotos?.[memberId] ?? []).map((photo) => ({
        ...photo,
        dealId: deal.id,
      })));
  }, [snap, memberId]);

  if (!photos.length) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-ink-primary">Completed work</h2>
      <PhotoGrid photos={photos.slice(0, 9)} emptyText="No completed work photos yet." />
    </section>
  );
}
