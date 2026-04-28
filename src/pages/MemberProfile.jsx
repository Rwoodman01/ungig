// Public-ish member profile — visible only to signed-in approved members
// (enforced by Firestore rules reading users where status=='approved').

import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { collection, doc, query, where } from 'firebase/firestore';
import { useDocument, useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebase.js';
import Avatar from '../components/ui/Avatar.jsx';
import Badge from '../components/ui/Badge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import LockedAction from '../components/ui/LockedAction.jsx';
import ReviewSummaryBar from '../components/reviews/ReviewSummaryBar.jsx';
import ReviewTagCloud from '../components/reviews/ReviewTagCloud.jsx';
import ReviewsList from '../components/reviews/ReviewsList.jsx';
import ReviewsEmptyState from '../components/reviews/ReviewsEmptyState.jsx';
import UnreviewedFlag from '../components/reviews/UnreviewedFlag.jsx';
import ReviewWarningBanner from '../components/reviews/ReviewWarningBanner.jsx';
import PhotoGrid from '../components/photos/PhotoGrid.jsx';
import CompletedWorkSection from '../components/photos/CompletedWorkSection.jsx';
import GiftedScoreDisplay from '../components/ui/GiftedScoreDisplay.jsx';
import { formatDate } from '../lib/format.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { createDeal } from '../lib/deals.js';
import { aggregateReviewStats, countStaleReviewQueueItems } from '../lib/reviewStats.js';

function sortReviewsDesc(reviews) {
  return [...reviews].sort((a, b) => {
    const ta = a.submittedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
    const tb = b.submittedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
    return tb - ta;
  });
}

export default function MemberProfile() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const {
    user,
    canEngage,
    hasPendingReviews,
    firstPendingDealId,
  } = useAuth();
  const [memberSnap, loading] = useDocument(doc(db, 'users', memberId));

  const reviewsQuery = useMemo(
    () => query(collection(db, 'reviews'), where('revieweeId', '==', memberId)),
    [memberId],
  );
  const [reviewsSnap] = useCollection(reviewsQuery);

  const queueQuery = useMemo(
    () => collection(db, 'users', memberId, 'reviewQueue'),
    [memberId],
  );
  const [queueSnap] = useCollection(queueQuery);

  if (loading) return <Spinner />;
  if (!memberSnap?.exists()) {
    return <EmptyState title="Member not found" />;
  }

  const member = { id: memberSnap.id, ...memberSnap.data() };
  const giftedScore = member.giftedScore ?? 50;
  const isSelf = user?.uid === member.id;
  const rawReviews = reviewsSnap?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [];
  const visibleReviews = rawReviews.filter((r) => r.visibleAt != null && r.moderationStatus !== 'removed');
  const reviews = sortReviewsDesc(visibleReviews);
  const stats = aggregateReviewStats(visibleReviews);

  const queueItems = queueSnap?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [];
  const staleUnreviewed = countStaleReviewQueueItems(queueItems);
  const portfolioPhotos = member.portfolioPhotos?.length
    ? member.portfolioPhotos
    : (member.proofPhotos ?? []).map((url) => ({ url, path: '', legacy: true }));

  const requestTrade = async () => {
    if (!user || isSelf) return;
    const dealId = await createDeal({ initiatorId: user.uid, receiverId: member.id });
    navigate(`/deals/${dealId}`);
  };

  const firstName = member.displayName?.split(/\s+/)[0] ?? 'this member';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <Avatar src={member.photoURL} name={member.displayName} size="xl" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display font-bold text-ink-primary truncate">
            {member.displayName}
          </h1>
          {member.location ? (
            <p className="text-sm text-ink-muted">{member.location}</p>
          ) : null}
          <p className="text-xs text-ink-muted mt-1">
            Member since {formatDate(member.memberSince)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="flex gap-3 text-xs text-ink-secondary">
              <span><strong className="text-green">{member.tradeCount ?? 0}</strong> gifts</span>
              <span><strong className="text-green">{member.badges?.length ?? 0}</strong> badges</span>
            </div>
            <GiftedScoreDisplay score={giftedScore} className="ml-auto" />
            <UnreviewedFlag count={staleUnreviewed} />
          </div>
        </div>
      </div>

      <ReviewWarningBanner unreviewedCount={staleUnreviewed} />

      {member.bio ? (
        <p className="text-sm text-ink-secondary leading-relaxed">{member.bio}</p>
      ) : null}

      {member.badges?.length ? (
        <div className="flex flex-wrap gap-2">
          {member.badges.map((b) => <Badge key={b} badgeKey={b} />)}
        </div>
      ) : null}

      {member.talentsOffered?.length ? (
        <section>
          <h2 className="text-sm font-semibold text-ink-primary mb-2">Offers</h2>
          <div className="flex flex-wrap gap-2">
            {member.talentsOffered.map((t) => <span key={t} className="chip">{t}</span>)}
          </div>
        </section>
      ) : null}

      {member.servicesNeeded?.length ? (
        <section>
          <h2 className="text-sm font-semibold text-ink-primary mb-2">Needs</h2>
          <div className="flex flex-wrap gap-2">
            {member.servicesNeeded.map((t) => <span key={t} className="chip">{t}</span>)}
          </div>
        </section>
      ) : null}

      {portfolioPhotos.length ? (
        <section>
          <h2 className="text-sm font-semibold text-ink-primary mb-2">Portfolio</h2>
          <PhotoGrid
            photos={portfolioPhotos}
            coverIndex={member.portfolioPhotos?.length ? 0 : -1}
          />
        </section>
      ) : null}

      <CompletedWorkSection memberId={member.id} />

      {member.connections?.length ? (
        <section>
          <h2 className="text-sm font-semibold text-ink-primary mb-2">Connections</h2>
          <p className="text-xs text-ink-muted">
            {member.connections.length} completed exchange partner
            {member.connections.length === 1 ? '' : 's'}.
          </p>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-ink-primary">Reviews</h2>
        {reviews.length === 0 ? (
          <ReviewsEmptyState memberName={firstName} />
        ) : (
          <>
            <ReviewSummaryBar memberName={firstName} stats={stats} />
            <ReviewTagCloud tagCounts={stats.tagCounts} />
            <ReviewsList reviews={reviews} />
          </>
        )}
      </section>

      {isSelf ? (
        <Link to="/me" className="btn-secondary w-full">
          Edit your profile
        </Link>
      ) : canEngage && hasPendingReviews ? (
        <LockedAction>
          <strong className="text-green">Propose Trade</strong>
          {' — '}finish your pending review first.{' '}
          {firstPendingDealId ? (
            <Link to={`/deals/${firstPendingDealId}/review`} className="text-green font-semibold underline">
              Leave review
            </Link>
          ) : null}
        </LockedAction>
      ) : canEngage ? (
        <button className="btn-primary w-full" onClick={requestTrade}>
          Propose Trade
        </button>
      ) : (
        <LockedAction>
          <strong className="text-green">Propose Trade</strong>
          {' '}unlocks once your culture call is complete.
        </LockedAction>
      )}
    </div>
  );
}
