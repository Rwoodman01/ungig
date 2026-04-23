import { Link } from 'react-router-dom';
import Wordmark from '../components/brand/Wordmark.jsx';
import Tagline from '../components/brand/Tagline.jsx';
import AuthFooter from '../components/brand/AuthFooter.jsx';

// Public splash screen for users who aren't signed in.
// Mobile-first hero: Ungig wordmark, brand tagline, two CTAs, auth footer stamp.
export default function Landing() {
  return (
    <div className="min-h-full flex flex-col">
      <div className="screen flex-1 px-6 py-12">
        <div className="flex-1 flex flex-col justify-center text-center gap-6">
          <Wordmark size="xl" className="mx-auto" />
          <Tagline className="max-w-xs mx-auto leading-relaxed" />
          <p className="text-silver-300 max-w-sm mx-auto leading-relaxed">
            A trust-based community where members trade talents for services —
            no money, just fair exchange with people you can verify.
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
        <p className="text-xs text-silver-300 text-center mt-8">
          Membership is $9.99/month. Invite-quality only.
        </p>
        <AuthFooter className="mt-6" />
      </div>
    </div>
  );
}
