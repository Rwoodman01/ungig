import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, orderBy, query } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../../firebase.js';
import Avatar from '../../components/ui/Avatar.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

export default function AllMembers() {
  const q = useMemo(
    () => query(collection(db, 'users'), orderBy('createdAt', 'desc')),
    [],
  );
  const [snap, loading, error] = useCollection(q);
  if (loading) return <Spinner />;
  if (error) return <p className="text-red-400 text-sm">Error: {error.message}</p>;
  const rows = snap?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [];

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-display font-bold text-ink-primary">All members</h1>
      {rows.map((m) => (
        <Link
          key={m.id}
          to={`/members/${m.id}`}
          className="card p-4 flex items-center gap-3"
        >
          <Avatar src={m.photoURL} name={m.displayName} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-ink-primary truncate">
              {m.displayName || '(no name)'}
            </div>
            <div className="text-xs text-ink-muted truncate">{m.email}</div>
          </div>
          <div className="text-right">
            <span className="chip text-[10px] uppercase">{m.status}</span>
            <div className="text-xs text-ink-muted mt-1">
              {m.tradeCount ?? 0} gifts · {(m.badges ?? []).length} badges
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
