// Public-ish member profile — visible only to signed-in approved members
// (enforced by Firestore rules reading users where status=='approved').

import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { collection, doc, orderBy, query, where } from 'firebase/firestore';
import { useDocument, useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebase.js';
import Avatar from '../components/ui/Avatar.jsx';
import Badge from '../components/ui/Badge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import LockedAction from '../components/ui/LockedAction.jsx';
import { formatDate } from '../lib/format.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { createDeal } from '../lib/deals.js';

function Stars({ rating }) {
  return (
    <span className="text-gold-400 text-sm" aria-label={`${rating} of 5 stars`}>
      {'★'.repeat(rating)}
      <span className="text-ink-300">{'★'.repeat(Math.max(0, 5 - rating))}</span>
    </span>
  );
}

export default function MemberProfile() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { user, canEngage } = useAuth();
  const [memberSnap, loading] = useDocument(doc(db, 'users', memberId));

  const reviewsQuery = useMemo(
    () => query(
      collection(db, 'reviews'),
      where('revieweeId', '==', memberId),
      orderBy('createdAt', 'desc'),
    ),
    [memberId],
  );
  const [reviewsSnap] = useCollection(reviewsQuery);

  if (loading) return <Spinner />;
  if (!memberSnap?.exists()) {
    return <EmptyState title="Member not found" />;
  }

  const member = { id: memberSnap.id, ...memberSnap.data() };
  const isSelf = user?.uid === member.id;
  const reviews = reviewsSnap?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [];

  const requestTrade = async () => {
    if (!user || isSelf) return;
    const dealId = await createDeal({ initiatorId: user.uid, receiverId: member.id });
    navigate(`/deals/${dealId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Avatar src={member.photoURL} name={member.displayName} size="xl" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display font-bold text-gold-400 truncate">
            {member.displayName}
          </h1>
          {member.location ? (
            <p className="text-sm text-ink-300">{member.location}</p>
          ) : null}
          <p className="text-xs text-ink-300 mt-1">
            Member since {formatDate(member.memberSince)}
          </p>
          <div className="mt-2 flex gap-3 text-xs text-ink-100">
            <span><strong className="text-gold-400">{member.tradeCount ?? 0}</strong> trades</span>
            <span><strong className="text-gold-400">{member.badges?.length ?? 0}</strong> badges</span>
          </div>
        </div>
      </div>

      {member.bio ? (
        <p className="text-sm text-ink-100 leading-relaxed">{member.bio}</p>
      ) : null}

      {member.badges?.length ? (
        <div className="flex flex-wrap gap-2">
          {member.badges.map((b) => <Badge key={b} badgeKey={b} />)}
        </div>
      ) : null}

      {member.talentsOffered?.length ? (
        <section>
          <h2 className="text-sm font-semibold text-ink-50 mb-2">Offers</h2>
          <div className="flex flex-wrap gap-2">
            {member.talentsOffered.map((t) => <span key={t} className="chip">{t}</span>)}
          </div>
        </section>
      ) : null}

      {member.servicesNeeded?.length ? (
        <section>
          <h2 className="text-sm font-semibold text-ink-50 mb-2">Needs</h2>
          <div className="flex flex-wrap gap-2">
            {member.servicesNeeded.map((t) => <span key={t} className="chip">{t}</span>)}
          </div>
        </section>
      ) : null}

      {member.proofPhotos?.length ? (
        <section>
          <h2 className="text-sm font-semibold text-ink-50 mb-2">Proof of work</h2>
          <div className="grid grid-cols-3 gap-2">
            {member.proofPhotos.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="aspect-square rounded-lg overflow-hidden bg-navy-800 border border-navy-700"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {member.connections?.length ? (
        <section>
          <h2 className="text-sm font-semibold text-ink-50 mb-2">Connections</h2>
          <p className="text-xs text-ink-300">
            {member.connections.length} completed trade partner
            {member.connections.length === 1 ? '' : 's'}.
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold text-ink-50 mb-2">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-xs text-ink-300">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-ink-300">{formatDate(r.createdAt)}</span>
                </div>
                {r.comment ? (
                  <p className="text-sm text-ink-100 mt-2">{r.comment}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {isSelf ? (
        <Link to="/me" className="btn-secondary w-full">
          Edit your profile
        </Link>
      ) : canEngage ? (
        <button className="btn-primary w-full" onClick={requestTrade}>
          Request a Trade
        </button>
      ) : (
        <LockedAction>
          <strong className="text-gold-300">Request a Trade</strong>
          {' '}unlocks once your culture call is complete.
        </LockedAction>
      )}
    </div>
  );
}
