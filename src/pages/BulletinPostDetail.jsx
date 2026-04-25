import { Link, useParams } from 'react-router-dom';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { db } from '../firebase.js';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import PostTypeBadge from '../components/bulletin/PostTypeBadge.jsx';
import InterestButton from '../components/bulletin/InterestButton.jsx';
import PostActions from '../components/bulletin/PostActions.jsx';
import {
  POST_AVAILABILITY_LABEL,
  POST_LIMITS,
  POST_STATUS,
  POST_TYPE_META,
} from '../lib/constants.js';
import { formatDate, timeAgo } from '../lib/format.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const ACCENT_HEADER = {
  green: 'bg-green/5',
  coral: 'bg-coral/5',
  gold: 'bg-gold/10',
};

export default function BulletinPostDetail() {
  const { postId } = useParams();
  const { user, isAdmin } = useAuth();
  const [snap, loading, error] = useDocument(doc(db, 'posts', postId));

  if (loading) return <Spinner />;
  if (error) {
    return (
      <EmptyState
        title="Could not load post"
        description={error.message}
      />
    );
  }
  if (!snap?.exists()) {
    return (
      <EmptyState
        title="Post not found"
        description="It may have been deleted or expired."
        action={<Link to="/bulletin" className="btn-secondary inline-flex">Back to bulletin</Link>}
      />
    );
  }

  const post = { id: snap.id, ...snap.data() };
  const meta = POST_TYPE_META[post.type];
  const accentBg = ACCENT_HEADER[meta?.accent] ?? '';
  const expiresAt = post.expiresAt?.toMillis?.();
  const expiresInDays = expiresAt
    ? Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
    : POST_LIMITS.ACTIVE_DAYS;
  const isHidden = post.status === POST_STATUS.HIDDEN;
  const isOwner = user?.uid === post.authorId;

  if (isHidden && !isOwner && !isAdmin) {
    return (
      <EmptyState
        title="Post unavailable"
        description="This post is currently hidden."
        action={<Link to="/bulletin" className="btn-secondary inline-flex">Back to bulletin</Link>}
      />
    );
  }

  return (
    <div className="space-y-5">
      {isHidden ? (
        <div className="card-cream p-3 text-xs text-coral text-center font-semibold">
          This post is hidden pending moderation.
        </div>
      ) : null}

      <article className={`card overflow-hidden`}>
        <div className={`p-4 flex items-start justify-between gap-3 ${accentBg}`}>
          <PostTypeBadge type={post.type} />
          <span className="text-[11px] text-ink-muted">{timeAgo(post.createdAt)}</span>
        </div>

        <div className="p-5 space-y-4">
          <h1 className="text-2xl font-display font-bold text-ink-primary leading-snug">
            {post.what}
          </h1>

          {post.exchange ? (
            <div>
              <div className="text-xs uppercase tracking-wide text-ink-muted">
                In exchange for
              </div>
              <p className="mt-1 text-base text-ink-primary">{post.exchange}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="card-cream p-3">
              <div className="text-[11px] uppercase tracking-wide text-ink-muted">Available</div>
              <div className="text-sm font-semibold text-ink-primary mt-1">
                {POST_AVAILABILITY_LABEL[post.availability] ?? '—'}
              </div>
            </div>
            <div className="card-cream p-3">
              <div className="text-[11px] uppercase tracking-wide text-ink-muted">Location</div>
              <div className="text-sm font-semibold text-ink-primary mt-1">
                {post.location || '—'}
              </div>
            </div>
          </div>

          {post.details ? (
            <div>
              <div className="text-xs uppercase tracking-wide text-ink-muted mb-1">Details</div>
              <p className="text-sm text-ink-secondary whitespace-pre-wrap leading-relaxed">
                {post.details}
              </p>
            </div>
          ) : null}

          <div className="border-t border-border pt-4 flex items-center gap-3">
            <Avatar src={post.authorPhotoURL} name={post.authorDisplayName} size="sm" />
            <div className="min-w-0 flex-1">
              <Link
                to={`/members/${post.authorId}`}
                className="text-sm font-semibold text-ink-primary hover:underline truncate block"
              >
                {post.authorDisplayName || 'Member'}
              </Link>
              <div className="text-[11px] text-ink-muted">
                Posted {formatDate(post.createdAt)} · expires in {expiresInDays}d
              </div>
            </div>
          </div>
        </div>
      </article>

      <InterestButton post={post} />
      <PostActions post={post} />
    </div>
  );
}
