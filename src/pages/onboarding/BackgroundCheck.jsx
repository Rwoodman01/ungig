// Onboarding step 3: background check confirmation (Checkr bounce).
// MVP just captures a confirmation checkbox + timestamp. Phase 2 will
// integrate Checkr's API directly.

import { useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { CHECKR_URL } from '../../lib/constants.js';

export default function BackgroundCheck() {
  const { user } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!user || !confirmed) return;
    setBusy(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        bgCheckConfirmed: true,
        bgCheckDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen px-6 py-10">
      <h1 className="text-3xl font-display font-bold text-gold-400">
        Background Check
      </h1>
      <p className="text-ink-300 text-sm mt-1">
        We rely on trust. Please complete your background check before you
        start trading services.
      </p>

      <ol className="mt-8 space-y-4">
        <li className="card p-4">
          <div className="text-sm text-gold-300 font-medium">Step 1</div>
          <div className="text-ink-50">Complete the Checkr background check.</div>
          <a
            href={CHECKR_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary mt-3 inline-flex"
          >
            Open Checkr
          </a>
        </li>
        <li className="card p-4">
          <div className="text-sm text-gold-300 font-medium">Step 2</div>
          <div className="text-ink-50">Confirm below once complete.</div>
          <label className="flex items-start gap-3 mt-3 text-sm text-ink-100">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 h-5 w-5 accent-gold-500"
            />
            I have completed my background check.
          </label>
        </li>
      </ol>

      {error ? <p className="text-red-400 text-sm mt-4">{error}</p> : null}

      <button
        className="btn-primary w-full mt-6"
        disabled={!confirmed || busy}
        onClick={save}
      >
        {busy ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
}
