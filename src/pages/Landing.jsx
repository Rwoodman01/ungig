import { Link } from 'react-router-dom';
import { APP_NAME, APP_TAGLINE } from '../lib/constants.js';

// Public splash screen for users who aren't signed in.
// Mobile-first hero with two clear CTAs.
export default function Landing() {
  return (
    <div className="min-h-full flex flex-col">
      <div className="screen flex-1 px-6 py-12">
        <div className="flex-1 flex flex-col justify-center text-center gap-6">
          <h1 className="font-display text-5xl font-bold text-gold-400 leading-tight">
            {APP_NAME}
          </h1>
          <p className="font-display text-xl text-ink-50">{APP_TAGLINE}</p>
          <p className="text-ink-300 max-w-sm mx-auto">
            A trust-based community where members trade talents for services — no
            money, just fair exchange with people you can verify.
          </p>
          <div className="mt-4 space-y-3">
            <Link to="/signup" className="btn-primary w-full">
              Create an account
            </Link>
            <Link to="/signin" className="btn-secondary w-full">
              I already have one
            </Link>
          </div>
        </div>
        <p className="text-xs text-ink-300 text-center mt-8">
          Membership is $9.99/month. Invite-quality only.
        </p>
      </div>
    </div>
  );
}
