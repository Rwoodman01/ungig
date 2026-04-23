import { Link } from 'react-router-dom';

export default function AdminHome() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display font-bold text-gold-400">Admin</h1>
      <p className="text-sm text-ink-300">Community management tools.</p>
      <div className="grid gap-3">
        <Link to="/admin/pending" className="card p-4 hover:border-gold-500/40">
          <div className="font-semibold text-ink-50">Pending approvals</div>
          <div className="text-xs text-ink-300 mt-1">
            Review new members awaiting a culture call.
          </div>
        </Link>
        <Link to="/admin/deals" className="card p-4 hover:border-gold-500/40">
          <div className="font-semibold text-ink-50">All deals</div>
          <div className="text-xs text-ink-300 mt-1">
            Monitor every trade in the community.
          </div>
        </Link>
        <Link to="/admin/members" className="card p-4 hover:border-gold-500/40">
          <div className="font-semibold text-ink-50">All members</div>
          <div className="text-xs text-ink-300 mt-1">
            See badges, trade counts, and statuses.
          </div>
        </Link>
      </div>
    </div>
  );
}
