import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBulletinPosts } from '../../hooks/useBulletinPosts.js';
import { normalizeLocation } from '../../lib/bulletin.js';

export default function BulletinHomeCard({ userDoc }) {
  const locationKey = useMemo(
    () => normalizeLocation(userDoc?.location ?? ''),
    [userDoc?.location],
  );
  // Reuses the same single-shape query the bulletin page uses, so we
  // depend on exactly one composite index (status ASC, createdAt DESC).
  const { posts, loading, error } = useBulletinPosts({ locationKey });
  const count = posts.length;

  let subtitle;
  if (loading || error) {
    subtitle = 'Local notes, offers, and asks.';
  } else if (count === 0) {
    subtitle = locationKey
      ? 'Be the first to pin something local.'
      : 'Be the first to pin something.';
  } else {
    subtitle = `${count} active ${count === 1 ? 'post' : 'posts'}${
      locationKey ? ' near you' : ''
    }.`;
  }

  return (
    <Link
      to="/bulletin"
      className="card p-5 flex items-start gap-4 hover:border-gold/50 transition border-l-[6px] border-l-gold"
    >
      <div className="text-3xl" aria-hidden>📌</div>
      <div className="min-w-0 flex-1">
        <div className="text-lg font-display font-bold text-ink-primary">
          Bulletin board
        </div>
        <p className="text-sm text-ink-muted mt-1">{subtitle}</p>
      </div>
      <div className="text-ink-muted shrink-0 text-xl">›</div>
    </Link>
  );
}
