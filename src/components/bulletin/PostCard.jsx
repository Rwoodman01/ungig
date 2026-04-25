import { Link } from 'react-router-dom';
import clsx from 'clsx';
import Avatar from '../ui/Avatar.jsx';
import PostTypeBadge from './PostTypeBadge.jsx';
import { POST_AVAILABILITY_LABEL, POST_TYPE_META } from '../../lib/constants.js';
import { timeAgo } from '../../lib/format.js';

const ACCENT_BORDER = {
  green: 'border-l-green',
  coral: 'border-l-coral',
  gold: 'border-l-gold',
};

export default function PostCard({ post }) {
  const meta = POST_TYPE_META[post.type];
  const accent = ACCENT_BORDER[meta?.accent] ?? 'border-l-border';

  return (
    <Link
      to={`/bulletin/${post.id}`}
      className={clsx(
        'card block p-4 border-l-[6px] hover:border-green/50 transition',
        accent,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <PostTypeBadge type={post.type} />
        <span className="text-[11px] text-ink-muted shrink-0">
          {timeAgo(post.createdAt)}
        </span>
      </div>

      <h3 className="mt-3 text-base font-bold text-ink-primary leading-snug">
        {post.what}
      </h3>

      {post.exchange ? (
        <p className="mt-1 text-sm text-ink-secondary">
          <span className="text-ink-muted">For: </span>
          {post.exchange}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
        {post.location ? <span>📍 {post.location}</span> : null}
        {post.availability ? (
          <span>🗓 {POST_AVAILABILITY_LABEL[post.availability]}</span>
        ) : null}
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
        <Avatar
          src={post.authorPhotoURL}
          name={post.authorDisplayName}
          size="xs"
        />
        <span className="text-xs text-ink-secondary truncate">
          {post.authorDisplayName || 'Member'}
        </span>
      </div>
    </Link>
  );
}
