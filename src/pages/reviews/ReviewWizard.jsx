import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { db } from '../../firebase.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { DEAL_STATUS, REVIEW_LIMITS, SKILL_TAGS } from '../../lib/constants.js';
import { fetchOtherParticipant } from '../../lib/deals.js';
import { submitReview } from '../../lib/reviews.js';
import Spinner from '../../components/ui/Spinner.jsx';
import WizardProgress from '../../components/reviews/wizard/WizardProgress.jsx';
import StepStarRating from '../../components/reviews/wizard/StepStarRating.jsx';
import StepReliability from '../../components/reviews/wizard/StepReliability.jsx';
import StepRepeat from '../../components/reviews/wizard/StepRepeat.jsx';
import StepWritten from '../../components/reviews/wizard/StepWritten.jsx';
import StepSkillTags from '../../components/reviews/wizard/StepSkillTags.jsx';
import StepCelebration from '../../components/reviews/wizard/StepCelebration.jsx';

function ms(ts) {
  if (!ts) return 0;
  return typeof ts.toMillis === 'function' ? ts.toMillis() : 0;
}

export default function ReviewWizard() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user, canEngage, loading: authLoading } = useAuth();
  const dealRef = useMemo(
    () => (user?.uid && dealId ? doc(db, 'deals', dealId) : null),
    [user?.uid, dealId],
  );
  const [dealSnap, loading, err] = useDocument(dealRef);
  const [other, setOther] = useState(null);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [starRating, setStarRating] = useState(5);
  const [showedUp, setShowedUp] = useState(null);
  const [wouldTradeAgain, setWouldTradeAgain] = useState(null);
  const [writtenReview, setWrittenReview] = useState('');
  const [skillTags, setSkillTags] = useState([]);

  const deal = dealSnap?.exists() ? { id: dealSnap.id, ...dealSnap.data() } : null;

  useEffect(() => {
    let c = false;
    if (!deal || !user) return undefined;
    fetchOtherParticipant(deal, user.uid).then((p) => {
      if (!c) setOther(p);
    });
    return () => { c = true; };
  }, [deal?.id, user?.uid]);

  const closed = useMemo(() => {
    if (!deal?.completedAt) return false;
    const t = ms(deal.completedAt);
    const max = REVIEW_LIMITS.AUTO_CLOSE_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - t > max;
  }, [deal?.completedAt]);

  const iAlreadyReviewed = !!deal?.reviewedBy?.[user?.uid];
  const otherName = other?.displayName ?? 'them';

  const toggleTag = (tag) => {
    setSkillTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= REVIEW_LIMITS.SKILL_TAGS_MAX) return prev;
      return [...prev, tag];
    });
  };

  const doSubmit = async () => {
    if (!user || !other || !deal) return;
    setBusy(true);
    setError('');
    try {
      await submitReview({
        dealId: deal.id,
        reviewerId: user.uid,
        revieweeId: other.id,
        starRating,
        showedUp,
        wouldTradeAgain,
        writtenReview,
        skillTags: skillTags.filter((t) => SKILL_TAGS.includes(t)),
      });
      setStep(6);
    } catch (e) {
      setError(e.message ?? 'Could not submit review.');
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || !dealRef || loading) return <Spinner label="Loading…" />;
  if (err) return <p className="text-coral text-sm p-4">{err.message}</p>;
  if (!deal) return <p className="p-4 text-ink-secondary">Exchange not found.</p>;
  // Debug: if we ever trip a permissions error, log what we had in state.
  // eslint-disable-next-line no-console
  console.log('[ReviewWizard] permission-check inputs', {
    dealId,
    uid: user?.uid ?? null,
    participantIds: deal?.participantIds ?? null,
    status: deal?.status ?? null,
  });
  if (!deal.participantIds?.includes(user?.uid)) {
    return <p className="p-4 text-ink-secondary">You are not part of this exchange.</p>;
  }
  if (!canEngage) {
    return (
      <div className="min-h-screen bg-cream p-4 flex flex-col justify-center">
        <p className="text-ink-secondary text-center">Reviews unlock once you&apos;re approved.</p>
        <Link to={`/deals/${dealId}`} className="btn-secondary mt-4 text-center">Back</Link>
      </div>
    );
  }
  if (deal.status !== DEAL_STATUS.COMPLETED && deal.status !== DEAL_STATUS.REVIEWED) {
    return (
      <div className="min-h-screen bg-cream p-4">
        <p className="text-ink-secondary">Complete the exchange before leaving a review.</p>
        <Link to={`/deals/${dealId}`} className="btn-primary mt-4 inline-block">Back to exchange</Link>
      </div>
    );
  }
  if (closed || iAlreadyReviewed) {
    return (
      <div className="min-h-screen bg-cream p-4 flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4">
        <img src="/giff/face.png" alt="" className="w-20 h-20" />
        <h1 className="text-lg font-display font-bold text-navyHero">
          {iAlreadyReviewed ? 'You already left a review.' : 'Reviews are now closed.'}
        </h1>
        <p className="text-sm text-ink-muted">
          {iAlreadyReviewed ? 'Thanks for helping the community stay trustworthy.' : 'This exchange is past the 7-day review window.'}
        </p>
        <Link to={`/deals/${dealId}`} className="btn-primary w-full">Back to exchange</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="sticky top-0 z-10 bg-cream/95 border-b border-border px-4 py-3 flex items-center gap-3" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <button type="button" onClick={() => navigate(-1)} className="btn-ghost px-2 -ml-2" aria-label="Back">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-ink-primary">Leave a review</span>
      </header>

      {step <= 5 ? (
        <div className="px-4 pt-4 pb-8 max-w-lg mx-auto w-full">
          <WizardProgress currentStep={step} />
        </div>
      ) : null}

      <main className="flex-1 px-4 pb-10 max-w-lg mx-auto w-full">
        {error ? <p className="text-coral text-sm mb-4">{error}</p> : null}

        {step === 1 ? (
          <StepStarRating
            otherName={otherName}
            starRating={starRating}
            onChange={setStarRating}
            onNext={() => setStep(2)}
            disabled={busy}
          />
        ) : null}
        {step === 2 ? (
          <StepReliability
            otherName={otherName}
            showedUp={showedUp}
            onChange={setShowedUp}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
            disabled={busy}
          />
        ) : null}
        {step === 3 ? (
          <StepRepeat
            otherName={otherName}
            wouldTradeAgain={wouldTradeAgain}
            onChange={setWouldTradeAgain}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
            disabled={busy}
          />
        ) : null}
        {step === 4 ? (
          <StepWritten
            otherName={otherName}
            writtenReview={writtenReview}
            onChange={setWrittenReview}
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
            disabled={busy}
          />
        ) : null}
        {step === 5 ? (
          <StepSkillTags
            otherName={otherName}
            skillTags={skillTags}
            onToggle={toggleTag}
            onNext={doSubmit}
            onBack={() => setStep(4)}
            disabled={busy}
          />
        ) : null}
        {step === 6 && other ? <StepCelebration otherName={otherName} /> : null}
      </main>
    </div>
  );
}
