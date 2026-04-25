import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar.jsx';
import { createDealFromMatch } from '../../lib/matches.js';
import { getFitReason, getMemberCover } from '../../lib/matching.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function MatchCard({ match }) {
  const navigate = useNavigate();
  const { user, userDoc } = useAuth();
  const [busy, setBusy] = useState(false);
  const other = match.other;
  const cover = getMemberCover(other);

  const propose = async () => {
    if (!user || !other) return;
    setBusy(true);
    try {
      const dealId = await createDealFromMatch({ match, initiatorId: user.uid });
      navigate(`/deals/${dealId}`);
    } finally {
      setBusy(false);
    }
  };

  if (!other) return null;

  return (
    <article className="card overflow-hidden">
      {cover ? (
        <div className="aspect-[16/9] bg-cream">
          <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      ) : null}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Avatar src={other.photoURL} name={other.displayName} size="sm" />
          <div className="min-w-0">
            <h2 className="font-semibold text-ink-primary truncate">{other.displayName || 'Member'}</h2>
            {other.location ? <p className="text-xs text-ink-muted truncate">{other.location}</p> : null}
          </div>
        </div>
        <p className="text-sm text-ink-secondary">{getFitReason({ member: other, userDoc })}</p>
        <button type="button" className="btn-primary w-full" onClick={propose} disabled={busy}>
          {busy ? 'Creating exchange…' : 'Propose Trade'}
        </button>
      </div>
    </article>
  );
}
