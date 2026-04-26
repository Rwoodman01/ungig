import { useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { db } from '../../firebase.js';

/**
 * Lets an admin account opt into appearing in Browse + Swipe (for end-to-end
 * trade testing). Stored on `users/{uid}.showInBrowse` (default false).
 */
export default function BrowseVisibilityToggle() {
  const { user, userDoc, isAdmin } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!isAdmin || !user?.uid || !userDoc) return null;

  const on = userDoc.showInBrowse === true;

  const toggle = async () => {
    setBusy(true);
    setErr('');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        showInBrowse: !on,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      setErr(e?.message ?? 'Could not update setting.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-4 border border-border">
      <div className="font-semibold text-ink-primary">Browse &amp; swipe visibility</div>
      <p className="text-xs text-ink-muted mt-1 leading-relaxed">
        Admin accounts are hidden from Find your match by default. Turn this on
        to appear like a regular member so you can test trades and matches.
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm text-ink-secondary">
          {on ? 'Visible in browse' : 'Hidden from browse'}
        </span>
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={`text-sm font-semibold px-4 py-2 rounded-xl border transition disabled:opacity-50 ${
            on
              ? 'border-border bg-surface text-ink-secondary'
              : 'border-green bg-green text-white'
          }`}
        >
          {busy ? 'Saving…' : on ? 'Turn off' : 'Show me in browse'}
        </button>
      </div>
      {err ? <p className="text-xs text-coral mt-2">{err}</p> : null}
    </div>
  );
}
