import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { deletePost, flagPost } from '../../lib/bulletin.js';

export default function PostActions({ post }) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [busy, setBusy] = useState('');
  const [reported, setReported] = useState(false);
  const [error, setError] = useState('');

  const isOwner = user?.uid && user.uid === post.authorId;

  const onDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    setBusy('delete');
    setError('');
    try {
      await deletePost(post.id);
      navigate('/bulletin', { replace: true });
    } catch (err) {
      setError(err?.message ?? 'Could not delete.');
      setBusy('');
    }
  };

  const onReport = async () => {
    if (!user) return;
    setBusy('report');
    setError('');
    try {
      await flagPost({ postId: post.id, uid: user.uid });
      setReported(true);
    } catch (err) {
      setError(err?.message ?? 'Could not report.');
    } finally {
      setBusy('');
    }
  };

  if (!user) return null;

  return (
    <div className="card-cream p-4 space-y-2">
      {isOwner || isAdmin ? (
        <button
          type="button"
          onClick={onDelete}
          className="btn-secondary w-full"
          disabled={busy === 'delete'}
        >
          {busy === 'delete' ? 'Deleting…' : 'Delete post'}
        </button>
      ) : null}

      {!isOwner ? (
        <button
          type="button"
          onClick={onReport}
          disabled={reported || busy === 'report'}
          className="text-xs font-semibold text-ink-muted hover:text-coral w-full text-center"
        >
          {reported
            ? 'Reported. Thanks for keeping the board kind.'
            : busy === 'report'
              ? 'Reporting…'
              : 'Report this post'}
        </button>
      ) : null}

      {error ? <p className="text-xs text-coral text-center">{error}</p> : null}
    </div>
  );
}
