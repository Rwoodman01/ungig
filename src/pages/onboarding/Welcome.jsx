// Step 1 of the onboarding flow: a warm welcome screen.
// Brand essence drives the copy — Freedom, Community, Trust.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import ProgressBar from '../../components/onboarding/ProgressBar.jsx';
import Wordmark from '../../components/brand/Wordmark.jsx';
import AuthFooter from '../../components/brand/AuthFooter.jsx';
import { APP_NAME, BRAND_PILLARS } from '../../lib/constants.js';

export default function Welcome() {
  const { user, userDoc } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleContinue = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        welcomeSeen: true,
        updatedAt: serverTimestamp(),
      });
      navigate('/onboarding/application', { replace: true });
    } finally {
      setBusy(false);
    }
  };

  const firstName = (userDoc?.displayName || user?.displayName || '').split(' ')[0];
  // Lead with Freedom + Community + Trust — the pillars most relevant on entry.
  const introPillars = BRAND_PILLARS.filter((p) =>
    ['freedom', 'community', 'trust'].includes(p.key),
  );

  return (
    <div className="min-h-full flex flex-col">
      <ProgressBar currentStep="welcome" />
      <div className="screen flex-1 px-6 py-8">
        <div className="flex-1 flex flex-col justify-center gap-8">
          <div className="text-center space-y-4">
            <Wordmark size="lg" className="mx-auto" />
            <h1 className="text-4xl text-silver leading-tight">
              {firstName ? `Welcome, ${firstName}` : `Welcome to ${APP_NAME}`}
            </h1>
            <p className="text-silver max-w-sm mx-auto leading-relaxed">
              {APP_NAME} is a trust-based community where members trade talents
              for services — no money between us, just fair exchange with
              people you can verify.
            </p>
          </div>

          <ul className="space-y-3">
            {introPillars.map((p) => (
              <li
                key={p.key}
                className="card p-4 flex items-start gap-3"
              >
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full bg-lilac mt-2 shrink-0"
                />
                <div>
                  <div className="font-display tracking-brand uppercase text-silver text-sm">
                    {p.label}
                  </div>
                  <div className="text-sm text-silver-300 leading-relaxed">
                    {p.copy}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <p className="text-sm text-silver-300 text-center max-w-sm mx-auto">
            Takes about two minutes. We'll set up your membership, then get
            your profile ready so others can find you.
          </p>
        </div>

        <button
          onClick={handleContinue}
          disabled={busy}
          className="btn-primary w-full mt-8"
        >
          {busy ? 'One sec...' : "Let's get you set up"}
        </button>

        <AuthFooter className="mt-6" />
      </div>
    </div>
  );
}
