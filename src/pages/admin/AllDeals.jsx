import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, orderBy, query } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../../firebase.js';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { timeAgo } from '../../lib/format.js';

export default function AllDeals() {
  const q = useMemo(
    () => query(collection(db, 'deals'), orderBy('updatedAt', 'desc')),
    [],
  );
  const [snap, loading, error] = useCollection(q);

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-400 text-sm">Error: {error.message}</p>;

  const rows = snap?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [];

  if (rows.length === 0) {
    return <EmptyState title="No deals yet" />;
  }

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-display font-bold text-ink-primary">All deals</h1>
      {rows.map((d) => (
        <Link key={d.id} to={`/deals/${d.id}`} className="card p-4 block">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-primary font-mono">{d.id.slice(0, 8)}…</span>
            <span className="chip-gold text-[10px] uppercase">{d.status}</span>
          </div>
          <div className="text-xs text-ink-muted mt-1">
            {d.initiatorId.slice(0, 6)}… ↔ {d.receiverId.slice(0, 6)}…
          </div>
          <div className="text-xs text-ink-muted mt-1">
            Updated {timeAgo(d.updatedAt)}
          </div>
        </Link>
      ))}
    </div>
  );
}
