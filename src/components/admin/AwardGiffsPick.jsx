import { useState } from 'react';
import { awardGiffsPick } from '../../lib/reviews.js';

export default function AwardGiffsPick() {
  const [uid, setUid] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const id = uid.trim();
    if (!id) return;
    setBusy(true);
    setMsg('');
    try {
      await awardGiffsPick(id);
      setMsg(`Awarded Giff's Pick to ${id}.`);
      setUid('');
    } catch (err) {
      setMsg(err.message ?? 'Failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-4 space-y-3">
      <h2 className="font-semibold text-ink-primary">Award Giff&apos;s Pick</h2>
      <p className="text-xs text-ink-muted">
        Paste the member&apos;s user ID (from their profile URL: <code>/members/…</code>).
      </p>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <input
          className="input flex-1"
          placeholder="User UID"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={busy}>
          {busy ? '…' : 'Award'}
        </button>
      </form>
      {msg ? <p className="text-xs text-ink-secondary">{msg}</p> : null}
    </div>
  );
}
