import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useMatches } from '../hooks/useMatches.js';
import { useBlockMuteLists } from '../hooks/useBlockMuteLists.js';
import MatchCard from '../components/matches/MatchCard.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function Matches() {
  const { user } = useAuth();
  const { matches, loading, error } = useMatches(user?.uid);
  const { hiddenMemberIds } = useBlockMuteLists(user?.uid);
  const visibleMatches = useMemo(
    () => matches.filter((m) => {
      const other = m.participantIds?.find((id) => id !== user?.uid);
      return other && !hiddenMemberIds.has(other);
    }),
    [matches, user?.uid, hiddenMemberIds],
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-primary">Matches</h1>
        <p className="text-sm text-ink-muted mt-1">
          People who are also interested in trading with you.
        </p>
      </div>

      {loading ? <Spinner /> : null}
      {error ? <p className="text-coral text-sm">{error.message}</p> : null}
      {!loading && visibleMatches.length === 0 ? (
        <EmptyState
          title="No matches yet"
          description="Swipe right on members you’d like to trade with. Giff will let you know when it’s mutual."
        />
      ) : null}

      <div className="space-y-3">
        {visibleMatches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}
