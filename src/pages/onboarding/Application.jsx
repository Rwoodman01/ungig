// Step 2: the combined application page.
//
// One scrollable screen that gathers everything we need from the member:
//   - Membership payment (stubbed)
//   - Background check confirmation
//   - Community standards agreement
//
// One button at the bottom flips `status` to 'pending' and records all the
// individual attestations. The user then moves on to Profile Setup and lands
// inside the app — no blocking "pending approval" wall.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import ProgressBar from '../../components/onboarding/ProgressBar.jsx';
import AuthFooter from '../../components/brand/AuthFooter.jsx';
import {
  CHECKR_URL,
  MEMBER_STATUS,
  SUBSCRIPTION_PRICE,
} from '../../lib/constants.js';

const STANDARDS = [
  {
    title: 'Show up',
    body: 'When you commit to a trade, you honor it. Reschedule early if life happens.',
  },
  {
    title: 'Trade fairly',
    body: 'Give value matching what you receive. No bait-and-switch, no corner-cutting.',
  },
  {
    title: 'Respect everyone',
    body: 'Treat every member with dignity. Harassment or discrimination ends membership.',
  },
  {
    title: 'Protect the circle',
    body: 'What happens between members stays between members. No doxxing, no drama online.',
  },
];

function SectionHeader({ index, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-3">
      <div className="h-7 w-7 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center text-sm font-semibold">
        {index}
      </div>
      <div>
        <h2 className="font-display text-lg font-bold text-ink-50">{title}</h2>
        {subtitle ? (
          <p className="text-xs text-ink-300 mt-0.5">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function Application() {
  const { user, userDoc } = useAuth();
  const navigate = useNavigate();

  // Each section tracks its own local state. We only persist to Firestore
  // when the user hits "Complete My Application" at the bottom.
  const [paidNow, setPaidNow] = useState(!!userDoc?.subscriptionActive);
  const [bgChecked, setBgChecked] = useState(!!userDoc?.bgCheckConfirmed);
  const [standardsAgreed, setStandardsAgreed] = useState(!!userDoc?.standardsAgreed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = paidNow && bgChecked && standardsAgreed;

  const submit = async () => {
    if (!user || !canSubmit || busy) return;
    setBusy(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        subscriptionActive: true,
        paidAt: serverTimestamp(),
        bgCheckConfirmed: true,
        bgCheckDate: serverTimestamp(),
        standardsAgreed: true,
        standardsAgreedAt: serverTimestamp(),
        status: MEMBER_STATUS.PENDING,
        applicationSubmittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      navigate('/onboarding/profile', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Something went wrong submitting your application.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      <ProgressBar currentStep="application" />
      <div className="screen flex-1 px-6 py-6 space-y-7">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-gold-400">
            Your application
          </h1>
          <p className="text-sm text-ink-300 mt-2">
            Three quick things, then on to your profile.
          </p>
        </div>

        {/* SECTION 1 — Payment */}
        <section>
          <SectionHeader
            index={1}
            title="Join the community"
            subtitle="Monthly membership keeps the circle tight."
          />
          <div className="card p-5">
            <div className="text-center">
              <div className="text-3xl font-display font-bold text-gold-400">
                {SUBSCRIPTION_PRICE.label}
              </div>
              <p className="text-sm text-ink-100 mt-1">
                Founding members get the first month free.
              </p>
              <p className="text-xs text-ink-300 mt-1">
                Cancel anytime — your trade history stays with you.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPaidNow(true)}
              disabled={paidNow}
              className={paidNow ? 'btn-secondary w-full mt-4' : 'btn-primary w-full mt-4'}
            >
              {paidNow ? 'Membership ready ✓' : 'Claim founding member spot'}
            </button>
            <p className="text-[11px] text-ink-300 text-center mt-2">
              Payment is stubbed for MVP — no card is charged.
            </p>
          </div>
        </section>

        {/* SECTION 2 — Background check */}
        <section>
          <SectionHeader
            index={2}
            title="Background check"
            subtitle="Trust starts with verified identity."
          />
          <div className="card p-5 space-y-3">
            <p className="text-sm text-ink-100 leading-relaxed">
              We partner with Checkr. It's a short flow — ID and a quick
              criminal/records check. Takes a few minutes, then comes back in
              a day or two.
            </p>
            <a
              href={CHECKR_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary w-full text-sm"
            >
              Open Checkr
            </a>
            <label className="flex items-start gap-3 text-sm text-ink-100 cursor-pointer">
              <input
                type="checkbox"
                checked={bgChecked}
                onChange={(e) => setBgChecked(e.target.checked)}
                className="mt-1 h-5 w-5 accent-gold-500"
              />
              I have initiated my background check.
            </label>
          </div>
        </section>

        {/* SECTION 3 — Community standards */}
        <section>
          <SectionHeader
            index={3}
            title="Community standards"
            subtitle="What it means to be part of Ungig."
          />
          <div className="card p-5 space-y-4">
            <ul className="space-y-4">
              {STANDARDS.map((s) => (
                <li key={s.title}>
                  <div className="text-sm font-semibold text-gold-300">{s.title}</div>
                  <p className="text-sm text-ink-100 mt-0.5 leading-relaxed">{s.body}</p>
                </li>
              ))}
            </ul>
            <label className="flex items-start gap-3 text-sm text-ink-100 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={standardsAgreed}
                onChange={(e) => setStandardsAgreed(e.target.checked)}
                className="mt-1 h-5 w-5 accent-gold-500"
              />
              I agree to uphold these standards.
            </label>
          </div>
        </section>

        {error ? <p className="text-red-400 text-sm text-center">{error}</p> : null}

        <button
          className="btn-primary w-full"
          onClick={submit}
          disabled={!canSubmit || busy}
        >
          {busy ? 'Submitting...' : 'Complete my application'}
        </button>

        <p className="text-xs text-ink-300 text-center pb-2">
          A community steward will reach out for a short culture call.
          You can explore Ungig while you wait.
        </p>

        <AuthFooter className="pb-4" />
      </div>
    </div>
  );
}
