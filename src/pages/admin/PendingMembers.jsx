// Admin: pending members awaiting culture-call approval.
// Flips `status` and keeps an audit trail in `approvedBy`/`rejectedBy`.

import { useMemo, useState } from 'react';
import { collection, doc, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../../firebase.js';
import Avatar from '../../components/ui/Avatar.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { MEMBER_STATUS } from '../../lib/constants.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function PendingMembers() {
  const { user } = useAuth();
  const [busyId, setBusyId] = useState('');
  const q = useMemo(
    () => query(
      collection(db, 'users'),
      where('status', '==', MEMBER_STATUS.PENDING),
      orderBy('createdAt', 'asc'),
    ),
    [],
  );
  const [snap, loading, error] = useCollection(q);

  const decide = async (uid, newStatus) => {
    setBusyId(uid + newStatus);
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: newStatus,
        [newStatus === MEMBER_STATUS.APPROVED ? 'approvedBy' : 'rejectedBy']: user.uid,
        [newStatus === MEMBER_STATUS.APPROVED ? 'approvedAt' : 'rejectedAt']: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } finally {
      setBusyId('');
    }
  };

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-400 text-sm">Error: {error.message}</p>;

  const rows = snap?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display font-bold text-gold-400">
        Pending approvals
      </h1>
      {rows.length === 0 ? (
        <EmptyState title="All caught up" description="No members awaiting approval." />
      ) : null}
      <div className="space-y-3">
        {rows.map((m) => (
          <div key={m.id} className="card p-4 flex items-start gap-3">
            <Avatar src={m.photoURL} name={m.displayName} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-ink-50 truncate">
                {m.displayName || '(no name)'}
              </div>
              <div className="text-xs text-ink-300 truncate">{m.email}</div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                className="btn-primary text-xs py-1.5 px-3"
                onClick={() => decide(m.id, MEMBER_STATUS.APPROVED)}
                disabled={busyId === m.id + MEMBER_STATUS.APPROVED}
              >
                Approve
              </button>
              <button
                className="btn-secondary text-xs py-1.5 px-3"
                onClick={() => decide(m.id, MEMBER_STATUS.REJECTED)}
                disabled={busyId === m.id + MEMBER_STATUS.REJECTED}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
