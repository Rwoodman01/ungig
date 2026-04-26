import { Link } from 'react-router-dom';
import BrowseVisibilityToggle from '../../components/admin/BrowseVisibilityToggle.jsx';

export default function AdminHome() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display font-bold text-ink-primary">Admin</h1>
      <p className="text-sm text-ink-muted">Community management tools.</p>

      <BrowseVisibilityToggle />

      <div className="grid gap-3">
        <Link to="/admin/pending" className="card p-4 hover:border-green/40 transition">
          <div className="font-semibold text-ink-primary">Pending approvals</div>
          <div className="text-xs text-ink-muted mt-1">
            Review new members awaiting a culture call.
          </div>
        </Link>
        <Link to="/admin/deals" className="card p-4 hover:border-green/40 transition">
          <div className="font-semibold text-ink-primary">All deals</div>
          <div className="text-xs text-ink-muted mt-1">
            Monitor every trade in the community.
          </div>
        </Link>
        <Link to="/admin/members" className="card p-4 hover:border-green/40 transition">
          <div className="font-semibold text-ink-primary">All members</div>
          <div className="text-xs text-ink-muted mt-1">
            See badges, trade counts, and statuses.
          </div>
        </Link>
        <Link to="/admin/reviews" className="card p-4 hover:border-green/40 transition">
          <div className="font-semibold text-ink-primary">Reviews &amp; flags</div>
          <div className="text-xs text-ink-muted mt-1">
            Moderate flagged reviews and award Giff&apos;s Pick.
          </div>
        </Link>
        <Link to="/admin/bulletin" className="card p-4 hover:border-green/40 transition">
          <div className="font-semibold text-ink-primary">Bulletin moderation</div>
          <div className="text-xs text-ink-muted mt-1">
            Review flagged bulletin posts.
          </div>
        </Link>
      </div>
    </div>
  );
}
