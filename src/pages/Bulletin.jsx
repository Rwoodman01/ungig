// Bulletin board — local notes, offers, and asks. Anyone signed in can read.
// Approved members with at least one completed trade can post.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import Spinner from '../components/ui/Spinner.jsx';
import PostCard from '../components/bulletin/PostCard.jsx';
import EmptyBoard from '../components/bulletin/EmptyBoard.jsx';
import LockedPosting from '../components/bulletin/LockedPosting.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useBulletinPosts } from '../hooks/useBulletinPosts.js';
import { canUserPost, normalizeLocation } from '../lib/bulletin.js';
import { POST_TYPES } from '../lib/constants.js';

const TYPE_TABS = [
  { value: '', label: 'All' },
  { value: POST_TYPES.OFFERING, label: 'Offering' },
  { value: POST_TYPES.LOOKING_FOR, label: 'Looking For' },
  { value: POST_TYPES.COMMUNITY, label: 'Community' },
];

export default function Bulletin() {
  const { userDoc } = useAuth();
  const myKey = useMemo(
    () => normalizeLocation(userDoc?.location ?? ''),
    [userDoc?.location],
  );
  const [showAllAreas, setShowAllAreas] = useState(!myKey);
  const [typeFilter, setTypeFilter] = useState('');

  const locationKey = showAllAreas ? '' : myKey;
  const { posts, loading, error } = useBulletinPosts({
    locationKey,
    type: typeFilter,
  });

  const canPost = canUserPost(userDoc);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-primary">
            Bulletin
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Local offers, asks, and notes from your community.
          </p>
        </div>
        {canPost ? (
          <Link to="/bulletin/new" className="btn-primary text-sm shrink-0">
            + Post
          </Link>
        ) : null}
      </div>

      {!canPost ? <LockedPosting userDoc={userDoc} /> : null}

      <div className="card p-3 flex items-center justify-between gap-3">
        <div className="text-xs text-ink-secondary">
          {showAllAreas
            ? 'Showing posts from all areas'
            : `Showing posts in ${userDoc?.location || 'your area'}`}
        </div>
        <button
          type="button"
          onClick={() => setShowAllAreas((v) => !v)}
          className="text-xs font-semibold text-green hover:underline shrink-0"
          disabled={!myKey}
        >
          {showAllAreas ? 'My area' : 'Show all areas'}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            type="button"
            onClick={() => setTypeFilter(tab.value)}
            className={clsx(
              'rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap border',
              typeFilter === tab.value
                ? 'bg-ink-primary text-ink-inverse border-ink-primary'
                : 'bg-surface text-ink-secondary border-border',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : null}
      {error ? (
        <p className="text-sm text-coral">Could not load posts: {error.message}</p>
      ) : null}

      {!loading && !error && posts.length === 0 ? (
        <EmptyBoard allAreas={showAllAreas} canPost={canPost} />
      ) : null}

      <ul className="space-y-3">
        {posts.map((p) => (
          <li key={p.id}>
            <PostCard post={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
