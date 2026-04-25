import { useMemo } from 'react';
import { collection, orderBy, query, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../../firebase.js';
import Spinner from '../../components/ui/Spinner.jsx';
import FlaggedPostCard from '../../components/admin/FlaggedPostCard.jsx';

export default function AdminBulletin() {
  const q = useMemo(
    () => query(
      collection(db, 'posts'),
      where('flagCount', '>', 0),
      orderBy('flagCount', 'desc'),
      orderBy('createdAt', 'desc'),
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
        <h1 className="text-2xl font-display font-bold text-ink-primary">
          Flagged posts
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Approve to clear flags, or remove from the bulletin.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">No flagged posts right now.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((p) => (
            <li key={p.id}>
              <FlaggedPostCard post={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
