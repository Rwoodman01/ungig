// Onboarding step 1: payment.
//
// Stripe is intentionally stubbed for MVP — clicking "Pay" just flips
// `subscriptionActive = true` and advances status to `pending`. When we
// wire real Stripe later, replace `fakePay()` with a call to a serverless
// endpoint that creates a Checkout Session and redirects.

import { useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { MEMBER_STATUS, SUBSCRIPTION_PRICE } from '../../lib/constants.js';

export default function Payment() {
  const { user, signOutUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const fakePay = async () => {
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      // TODO: Stripe — replace with a call to /api/stripe/checkout and
      // flip these fields from a webhook on checkout.session.completed.
      await updateDoc(doc(db, 'users', user.uid), {
        subscriptionActive: true,
        status: MEMBER_STATUS.PENDING,
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err.message ?? 'Payment failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen px-6 py-10">
      <h1 className="text-3xl font-display font-bold text-gold-400">
        Membership
      </h1>
      <p className="text-ink-300 mt-1 text-sm">
        Join the community with a simple monthly subscription.
      </p>

      <div className="card p-6 mt-8 text-center">
        <div className="text-5xl font-display font-bold text-gold-400">
          {SUBSCRIPTION_PRICE.label}
        </div>
        <p className="text-ink-300 text-sm mt-2">
          Cancel anytime. Pauses your account but keeps your trade history.
        </p>
        <ul className="text-left text-sm text-ink-100 mt-6 space-y-2">
          <li>• Access to the vetted member directory</li>
          <li>• Trust-based service trading with real people</li>
          <li>• Reviews and badges that build your reputation</li>
        </ul>
      </div>

      {error ? <p className="text-red-400 text-sm mt-4">{error}</p> : null}

      <button className="btn-primary w-full mt-6" onClick={fakePay} disabled={busy}>
        {busy ? 'Processing...' : `Pay ${SUBSCRIPTION_PRICE.label}`}
      </button>

      <p className="text-xs text-ink-300 text-center mt-3">
        This is a stubbed payment for MVP — no card is charged.
      </p>

      <button
        type="button"
        onClick={signOutUser}
        className="btn-ghost w-full mt-6 text-sm"
      >
        Sign out
      </button>
    </div>
  );
}
