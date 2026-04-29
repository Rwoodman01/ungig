import { useMemo } from 'react';
import { collection, orderBy, query } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Link } from 'react-router-dom';
import { db } from '../../firebase.js';
import Spinner from '../../components/ui/Spinner.jsx';
import { formatDate } from '../../lib/format.js';
import { REPORT_REASON_LABELS } from '../../lib/constants.js';

export default function AdminReports() {
  const q = useMemo(
    () => query(collection(db, 'reports'), orderBy('createdAt', 'desc')),
    [],
  );
  const [snap, loading, error] = useCollection(q);

  const rows = useMemo(
    () => (snap?.docs ?? []).map((d) => ({ id: d.id, ...d.data() })),
    [snap],
  );

  return (
    <div className="space-y-4">
      <div>
        <Link to="/admin" className="text-sm text-green font-medium hover:underline">
          ← Admin
        </Link>
        <h1 className="text-2xl font-display font-bold text-ink-primary mt-2">Member reports</h1>
        <p className="text-sm text-ink-muted mt-1">Newest first. Only admins can read this list.</p>
      </div>

      {loading ? <Spinner /> : null}
      {error ? <p className="text-coral text-sm">{error.message}</p> : null}

      {!loading && rows.length === 0 ? (
        <p className="text-sm text-ink-muted">No reports yet.</p>
      ) : null}

      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="card p-4 space-y-2">
            <div className="flex flex-wrap justify-between gap-2 text-xs text-ink-muted">
              <span>{r.createdAt ? formatDate(r.createdAt) : '—'}</span>
              <span className="chip-gold text-[10px]">{r.status ?? 'open'}</span>
            </div>
            <div className="text-sm text-ink-primary">
              <strong>Reason:</strong>{' '}
              {REPORT_REASON_LABELS[r.reason] ?? r.reason}
            </div>
            <div className="text-xs text-ink-secondary break-all">
              <span className="text-ink-muted">Reporter</span> {r.reporterId}
            </div>
            <div className="text-xs text-ink-secondary break-all">
              <span className="text-ink-muted">Reported</span> {r.reportedUserId}
            </div>
            {r.details ? (
              <p className="text-sm text-ink-secondary whitespace-pre-wrap border-t border-border pt-2">
                {r.details}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
