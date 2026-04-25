import { Link } from 'react-router-dom';
import Wordmark from '../components/brand/Wordmark.jsx';
import Tagline from '../components/brand/Tagline.jsx';
import AuthFooter from '../components/brand/AuthFooter.jsx';

// Public splash screen for users who aren't signed in.
// Mobile-first hero: Gifted wordmark, brand tagline, two CTAs, auth footer line.
export default function Landing() {
  return (
    <div className="min-h-full flex flex-col">
      <div className="screen flex-1 px-6 py-12">
        <div className="flex-1 flex flex-col justify-center text-center gap-6">
          <div className="mx-auto w-full max-w-sm">
            <img
              src="/giff/standing.png"
              alt="Giff the Giving Frog"
              className="mx-auto w-[280px] max-w-full drop-shadow-[0_18px_30px_rgba(15,19,49,0.12)]"
            />
          </div>
          <Wordmark size="xl" className="mx-auto" />
          <Tagline className="max-w-xs mx-auto" />
          <p className="text-ink-secondary max-w-sm mx-auto leading-relaxed">
            Gifted is a trust-based community where members exchange gifts of time
            and talent — give what you can, receive what you need.
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
        <p className="text-xs text-ink-muted text-center mt-8">
          Membership is $9.99/month. Community-first.
        </p>
        <AuthFooter className="mt-6" />
      </div>
    </div>
  );
}
