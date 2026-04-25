import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Wordmark from '../components/brand/Wordmark.jsx';
import Tagline from '../components/brand/Tagline.jsx';
import { MEMBER_STATUS } from '../lib/constants.js';
import InstallPrompt from '../components/pwa/InstallPrompt.jsx';
import { useMatches } from '../hooks/useMatches.js';
import BulletinHomeCard from '../components/bulletin/BulletinHomeCard.jsx';

// Signed-in dashboard (tab: Home). Intentionally spare — surface next actions
// rather than info overload.
export default function Home() {
  const { user, userDoc, canEngage } = useAuth();
  const { count: matchCount } = useMatches(user?.uid);
  const isPending = userDoc?.status === MEMBER_STATUS.PENDING;

  return (
    <div className="space-y-6">
      <InstallPrompt />
      <div className="hero-card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Wordmark
              size="lg"
              withTagline={false}
              headClassName="text-ink-inverse"
              tailClassName="text-green"
              className="block"
            />
            <Tagline className="text-ink-inverse/70 text-left mt-2" />
          </div>
          <Avatar src={userDoc?.photoURL} name={userDoc?.displayName} size="md" />
        </div>

        <div className="mt-5">
          <div className="text-sm text-ink-inverse/80">Welcome back,</div>
          <div className="text-2xl font-display font-bold text-ink-inverse mt-0.5">
            {userDoc?.displayName || 'Member'}
          </div>
          <div className="text-sm text-ink-inverse/80 mt-2">
            Give what you can. Receive what you need.
          </div>
        </div>
      </div>

      {isPending && !canEngage ? (
        <div className="card-cream p-4">
          <div className="text-sm text-ink-secondary leading-relaxed">
            <strong className="text-ink-primary">Your culture call is on the way.</strong>
            {' '}Explore profiles and see how exchanges work here.
            You'll unlock proposing and messaging as soon as you're approved.
          </div>
        </div>
      ) : null}

      <div className="card p-5">
        <h2 className="text-lg font-display font-bold text-ink-primary">
          Find your match
        </h2>
        <p className="text-sm text-ink-muted mt-1">
          {canEngage
            ? 'Find your match and propose trade.'
            : 'Find your match and explore how the community works.'}
        </p>
        <Link to="/browse" className="btn-primary mt-4 inline-flex">
          Find your match
        </Link>
      </div>

      <BulletinHomeCard userDoc={userDoc} />

      <div className="grid grid-cols-2 gap-3">
        <Link to="/matches" className="card p-4 text-center">
          <div className="text-2xl font-display font-bold text-ink-primary">
            {matchCount}
          </div>
          <div className="text-xs text-ink-muted">Matches</div>
        </Link>
        <Link to="/deals" className="card p-4 text-center">
          <div className="text-2xl font-display font-bold text-ink-primary">
            {userDoc?.tradeCount ?? 0}
          </div>
          <div className="text-xs text-ink-muted">Gifts Given</div>
        </Link>
        <Link to="/me" className="card p-4 text-center">
          <div className="text-2xl font-display font-bold text-ink-primary">
            {userDoc?.badges?.length ?? 0}
          </div>
          <div className="text-xs text-ink-muted">Badges</div>
        </Link>
      </div>
    </div>
  );
}
