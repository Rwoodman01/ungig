// Member Directory — lists all approved members with simple client-side
// filtering (service offered, service needed, location substring).
//
// Firestore query: users where status=='approved'. Rules mirror this, so
// non-approved members simply can't be read by others.

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebase.js';
import { MEMBER_STATUS } from '../lib/constants.js';
import Avatar from '../components/ui/Avatar.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { isVisibleInMemberBrowse } from '../lib/memberBrowseVisibility.js';
import { useSwipeDeck } from '../hooks/useSwipeDeck.js';
import { useMatches } from '../hooks/useMatches.js';
import SwipeDeck from '../components/swipe/SwipeDeck.jsx';
import MatchCelebrationModal from '../components/swipe/MatchCelebrationModal.jsx';

function MemberCard({ member }) {
  const cover = member.portfolioPhotos?.[0]?.url ?? member.proofPhotos?.[0] ?? '';
  return (
    <Link
      to={`/members/${member.id}`}
      className="card overflow-hidden hover:border-gold-500/40 transition block"
    >
      {cover ? (
        <div className="aspect-[16/9] bg-cream border-b border-border">
          <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      ) : null}
      <div className="p-4 flex gap-4 items-start">
        <Avatar src={member.photoURL} name={member.displayName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-ink-50 truncate">
              {member.displayName || 'Member'}
            </div>
            {member.badges?.length ? (
              <span className="chip-gold text-[10px]">{member.badges.length} ★</span>
            ) : null}
          </div>
          {member.location ? (
            <div className="text-xs text-ink-300 truncate">{member.location}</div>
          ) : null}
          {member.talentsOffered?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {member.talentsOffered.slice(0, 3).map((t) => (
                <span key={t} className="chip text-[10px]">{t}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default function Directory() {
  const { user, userDoc } = useAuth();
  const [params, setParams] = useSearchParams();
  const intent = params.get('intent');
  const initialView = params.get('view') === 'list' ? 'list' : 'swipe';
  const [view, setView] = useState(initialView);
  const [q, setQ] = useState('');
  const [offered, setOffered] = useState('');
  const [needed, setNeeded] = useState('');
  const [loc, setLoc] = useState('');
  const [pendingMatchTarget, setPendingMatchTarget] = useState(null);
  const [celebration, setCelebration] = useState(null);

  const membersQuery = useMemo(
    () => query(
      collection(db, 'users'),
      where('status', '==', MEMBER_STATUS.APPROVED),
      orderBy('displayName'),
    ),
    [],
  );

  const [snap, loading, error] = useCollection(membersQuery);
  const {
    deck,
    seenDeck,
    loading: deckLoading,
    error: deckError,
    recordDecision,
  } = useSwipeDeck({ user, userDoc, locationFilter: loc });
  const { matches } = useMatches(user?.uid);

  useEffect(() => {
    if (!pendingMatchTarget) return;
    const match = matches.find((m) => m.participantIds?.includes(pendingMatchTarget.id));
    if (match) {
      setCelebration(pendingMatchTarget.displayName ?? 'this member');
      setPendingMatchTarget(null);
    }
  }, [matches, pendingMatchTarget]);

  const setBrowseView = (next) => {
    setView(next);
    const copy = new URLSearchParams(params);
    copy.set('view', next);
    setParams(copy, { replace: true });
  };

  const members = useMemo(() => {
    if (!snap) return [];
    const rows = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((m) => m.id !== user?.uid)
      .filter(isVisibleInMemberBrowse);

    const norm = (s) => s.trim().toLowerCase();
    const textMatch = (m) => {
      if (!q) return true;
      const hay = [m.displayName, m.bio, m.location, ...(m.talentsOffered ?? []), ...(m.servicesNeeded ?? [])]
        .filter(Boolean).join(' ').toLowerCase();
      return hay.includes(norm(q));
    };
    const offeredMatch = (m) =>
      !offered || (m.talentsOffered ?? []).some((t) => t.includes(norm(offered)));
    const neededMatch = (m) =>
      !needed || (m.servicesNeeded ?? []).some((t) => t.includes(norm(needed)));
    const locMatch = (m) =>
      !loc || (m.location ?? '').toLowerCase().includes(norm(loc));

    return rows.filter((m) => textMatch(m) && offeredMatch(m) && neededMatch(m) && locMatch(m));
  }, [snap, q, offered, needed, loc, user?.uid]);

  return (
    <div className="space-y-4">
      {celebration ? (
        <MatchCelebrationModal matchName={celebration} onClose={() => setCelebration(null)} />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-primary">Find your match</h1>
          {intent === 'give' ? (
            <p className="text-sm text-ink-muted mt-1">Someone could use what you offer.</p>
          ) : (
            <p className="text-sm text-ink-muted mt-1">Swipe through members who may fit your gifts.</p>
          )}
        </div>
        <Link to="/matches" className="btn-secondary text-sm shrink-0">
          Matches
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-cream p-1 border border-border">
        <button
          type="button"
          onClick={() => setBrowseView('swipe')}
          className={`rounded-xl py-2 text-sm font-semibold ${view === 'swipe' ? 'bg-surface text-green shadow-sm' : 'text-ink-muted'}`}
        >
          Swipe
        </button>
        <button
          type="button"
          onClick={() => setBrowseView('list')}
          className={`rounded-xl py-2 text-sm font-semibold ${view === 'list' ? 'bg-surface text-green shadow-sm' : 'text-ink-muted'}`}
        >
          List
        </button>
      </div>

      {view === 'swipe' ? (
        <>
          <input
            className="input"
            placeholder="Prioritize location (optional)"
            value={loc}
            onChange={(e) => setLoc(e.target.value)}
          />
          {deckLoading ? <Spinner /> : null}
          {deckError ? (
            <p className="text-coral text-sm">Error loading deck: {deckError.message}</p>
          ) : null}
          {!deckLoading && !deckError ? (
            <SwipeDeck
              members={deck}
              recycledMembers={seenDeck}
              userDoc={userDoc}
              onShowList={() => setBrowseView('list')}
              onDecision={async ({ targetUid, direction, source, member }) => {
                await recordDecision({ targetUid, direction, source });
                if (direction === 'right') setPendingMatchTarget(member);
              }}
            />
          ) : null}
        </>
      ) : (
        <>
          <input
            className="input"
            placeholder="Search by name, skill, or keyword"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <details className="card p-4">
            <summary className="cursor-pointer text-sm text-ink-secondary font-medium">
              Filters
            </summary>
            <div className="mt-3 space-y-2">
              <input
                className="input"
                placeholder="Service offered (e.g. photography)"
                value={offered}
                onChange={(e) => setOffered(e.target.value)}
              />
              <input
                className="input"
                placeholder="Service needed (e.g. resume help)"
                value={needed}
                onChange={(e) => setNeeded(e.target.value)}
              />
              <input
                className="input"
                placeholder="Location"
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
              />
            </div>
          </details>

          {loading ? <Spinner /> : null}
          {error ? (
            <p className="text-red-400 text-sm">Error loading members: {error.message}</p>
          ) : null}

          {!loading && members.length === 0 ? (
            <EmptyState
              title="No members match"
              description="Try a broader search or clear your filters."
            />
          ) : null}

          <div className="space-y-3">
            {members.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
