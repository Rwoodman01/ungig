import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import PostForm from '../components/bulletin/PostForm.jsx';
import LockedPosting from '../components/bulletin/LockedPosting.jsx';
import { canUserPost, createPost } from '../lib/bulletin.js';

export default function BulletinNew() {
  const { user, userDoc } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!userDoc) return null;

  if (!canUserPost(userDoc)) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-display font-bold text-ink-primary">
          New post
        </h1>
        <LockedPosting userDoc={userDoc} />
      </div>
    );
  }

  const handleSubmit = async (draft) => {
    setBusy(true);
    setError('');
    try {
      const id = await createPost({ uid: user.uid, userDoc, draft });
      navigate(`/bulletin/${id}`, { replace: true });
    } catch (err) {
      setError(err?.message ?? 'Could not post.');
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-primary">
          New post
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Pin something to the local board. Neighbors with overlapping
          locations will see it.
        </p>
      </div>
      <PostForm
        initialLocation={userDoc.location ?? ''}
        busy={busy}
        error={error}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
