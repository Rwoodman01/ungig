import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { APP_TAGLINE } from '../lib/constants.js';

// Signed-in dashboard (tab: Home). Intentionally spare — surface next actions
// rather than info overload.
export default function Home() {
  const { userDoc } = useAuth();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Avatar src={userDoc?.photoURL} name={userDoc?.displayName} size="md" />
        <div>
          <div className="text-sm text-ink-300">Welcome back,</div>
          <div className="text-xl font-display font-bold text-gold-400">
            {userDoc?.displayName || 'Member'}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display text-lg font-bold text-ink-50">
          {APP_TAGLINE}
        </h2>
        <p className="text-sm text-ink-300 mt-1">
          Browse members who need what you offer — and propose a trade.
        </p>
        <Link to="/browse" className="btn-primary mt-4 inline-flex">
          Browse members
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/deals" className="card p-4 text-center">
          <div className="text-2xl font-display font-bold text-gold-400">
            {userDoc?.tradeCount ?? 0}
          </div>
          <div className="text-xs text-ink-300">Trades complete</div>
        </Link>
        <Link to="/me" className="card p-4 text-center">
          <div className="text-2xl font-display font-bold text-gold-400">
            {userDoc?.badges?.length ?? 0}
          </div>
          <div className="text-xs text-ink-300">Badges</div>
        </Link>
      </div>
    </div>
  );
}
