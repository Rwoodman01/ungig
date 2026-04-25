import { useState } from 'react';
import { Link } from 'react-router-dom';
import PostTypeBadge from '../bulletin/PostTypeBadge.jsx';
import { adminApprovePost, adminRemovePost } from '../../lib/bulletin.js';
import { POST_AVAILABILITY_LABEL } from '../../lib/constants.js';
import { formatDate } from '../../lib/format.js';

export default function FlaggedPostCard({ post }) {
  const [busy, setBusy] = useState('');

  const act = async (kind) => {
    setBusy(kind);
    try {
      if (kind === 'approve') await adminApprovePost(post.id);
      else await adminRemovePost(post.id);
    } finally {
      setBusy('');
    }
  };

  return (
    <article className="card p-4 space-y-3 border-coral/40">
      <div className="flex items-start justify-between gap-3">
        <PostTypeBadge type={post.type} />
        <span className="text-xs text-coral font-semibold">
          {post.flagCount} flag{post.flagCount === 1 ? '' : 's'}
        </span>
      </div>

      <div>
        <Link
          to={`/bulletin/${post.id}`}
          className="text-base font-bold text-ink-primary hover:underline"
        >
          {post.what}
        </Link>
        {post.exchange ? (
          <p className="text-xs text-ink-muted mt-1">For: {post.exchange}</p>
        ) : null}
      </div>

      {post.details ? (
        <p className="text-sm text-ink-secondary whitespace-pre-wrap line-clamp-4">
          {post.details}
        </p>
      ) : null}

      <div className="text-xs text-ink-muted space-y-1 border-t border-border pt-2">
        <div>
          Author: <code className="text-ink-primary">{post.authorId}</code> ({post.authorDisplayName})
        </div>
        <div>Location: {post.location}</div>
        <div>
          Available: {POST_AVAILABILITY_LABEL[post.availability]} · Posted{' '}
          {formatDate(post.createdAt)}
        </div>
        <div>Status: {post.status}</div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className="btn-secondary flex-1"
          disabled={!!busy}
          onClick={() => act('approve')}
        >
          {busy === 'approve' ? '…' : 'Approve (clear flags)'}
        </button>
        <button
          type="button"
          className="btn-primary flex-1 bg-coral border-coral hover:opacity-90"
          disabled={!!busy}
          onClick={() => act('remove')}
        >
          {busy === 'remove' ? '…' : 'Remove'}
        </button>
      </div>
    </article>
  );
}
