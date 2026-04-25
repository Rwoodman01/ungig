import { useMemo } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../../firebase.js';
import Spinner from '../../components/ui/Spinner.jsx';
import FlaggedReviewCard from '../../components/admin/FlaggedReviewCard.jsx';
import AwardGiffsPick from '../../components/admin/AwardGiffsPick.jsx';

export default function AdminReviews() {
  const q = useMemo(
    () => query(
      collection(db, 'reviews'),
      where('flagged', '==', true),
      orderBy('submittedAt', 'desc'),
    ),
    [],
  );
  const [snap, loading, err] = useCollection(q);

  if (loading) return <Spinner />;
  if (err) return <p className="text-coral text-sm">{err.message}</p>;

  const rows = snap?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-primary">Flagged reviews</h1>
        <p className="text-sm text-ink-muted mt-1">Approve to restore visibility, or remove from the directory.</p>
      </div>

      <AwardGiffsPick />

      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">No flagged reviews right now.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id}>
              <FlaggedReviewCard review={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
