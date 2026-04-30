// DealDetail — step-by-step exchange flow driven by Firestore `status`.

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useMessagesPanel } from '../contexts/MessagesPanelContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import LockedAction from '../components/ui/LockedAction.jsx';
import GiffStepHeader from '../components/exchange/GiffStepHeader.jsx';
import StepYourOffer from '../components/exchange/StepYourOffer.jsx';
import StepReviewOffer from '../components/exchange/StepReviewOffer.jsx';
import StepMutualConfirm from '../components/exchange/StepMutualConfirm.jsx';
import StepSchedule from '../components/exchange/StepSchedule.jsx';
import StepMarkComplete from '../components/exchange/StepMarkComplete.jsx';
import StepExchangeDone from '../components/exchange/StepExchangeDone.jsx';
import { DEAL_STATUS } from '../lib/constants.js';
import {
  acceptTradeReview,
  confirmMutualTerms,
  counterTradeReview,
  declineTradeReview,
  fetchOtherParticipant,
  markDealComplete,
  saveTradeSchedule,
  submitTradeOffer,
} from '../lib/deals.js';
import { getExchangeUiStep } from '../lib/exchangeFlow.js';
import { getLocationDisplayName } from '../lib/geo.js';
import { useBlockMuteLists } from '../hooks/useBlockMuteLists.js';

export default function DealDetail() {
  const { dealId } = useParams();
  const {
    user,
    userDoc,
    canEngage,
    hasPendingReviews,
    firstPendingDealId,
  } = useAuth();
  const { markDealRead } = useMessagesPanel();
  const { hiddenMemberIds } = useBlockMuteLists(user?.uid);
  const [dealSnap, loading, error] = useDocument(doc(db, 'deals', dealId));
  const [other, setOther] = useState(null);
  const [actionBusy, setActionBusy] = useState('');
  const [actionError, setActionError] = useState('');

  const deal = dealSnap?.exists() ? { id: dealSnap.id, ...dealSnap.data() } : null;

  const ui = useMemo(() => (deal ? getExchangeUiStep(deal) : null), [deal]);

  const iAlreadyReviewed = useMemo(
    () => !!deal?.reviewedBy?.[user?.uid],
    [deal?.reviewedBy, user?.uid],
  );
  const iMarkedComplete = useMemo(
    () => !!deal?.completedBy?.[user?.uid],
    [deal?.completedBy, user?.uid],
  );

  useEffect(() => {
    let cancel = false;
    if (!deal || !user) return;
    fetchOtherParticipant(deal, user.uid).then((p) => {
      if (!cancel) setOther(p);
    });
    return () => { cancel = true; };
  }, [deal?.id, user?.uid]);

  useEffect(() => {
    if (!deal || !user?.uid) return;
    if (deal.completedBy?.[user.uid] || deal.status === DEAL_STATUS.COMPLETED || deal.status === DEAL_STATUS.REVIEWED) {
      setActionError('');
    }
  }, [deal?.completedBy, deal?.status, user?.uid]);

  const doAction = async (label, fn) => {
    setActionBusy(label);
    setActionError('');
    try {
      await fn();
    } catch (err) {
      setActionError(err.message ?? 'Something went wrong.');
    } finally {
      setActionBusy('');
    }
  };

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-400 text-sm">Error: {error.message}</p>;
  if (!deal) return <EmptyState title="Exchange not found" />;
  if (!deal.participantIds?.includes(user.uid)) {
    return <EmptyState title="Not authorized" description="This exchange is private." />;
  }

  const acceptBlockedByReview = canEngage
    && hasPendingReviews
    && user.uid === deal.receiverId
    && (deal.status === DEAL_STATUS.REVIEW || deal.status === DEAL_STATUS.REQUESTED);

  const canReview = canEngage
    && (deal.status === DEAL_STATUS.COMPLETED || deal.status === DEAL_STATUS.REVIEWED)
    && !iAlreadyReviewed;

  const otherName = other?.displayName ?? 'the other member';
  const myName = userDoc?.displayName ?? user?.displayName ?? 'You';
  const exchangeLocked = Boolean(other?.id && hiddenMemberIds.has(other.id));

  const renderStep = () => {
    if (!ui) return null;
    if (ui.kind === 'declined') {
      return <StepExchangeDone kind="declined" deal={deal} user={user} />;
    }
    if (ui.kind === 'reviewed' || ui.kind === 'completed') {
      return (
        <StepExchangeDone
          kind={ui.kind}
          deal={deal}
          user={user}
          other={other}
          canReview={canReview}
          reviewLink={`/deals/${deal.id}/review`}
        />
      );
    }

    if (!canEngage) {
      return (
        <LockedAction>
          You can read this exchange. Engagement actions unlock once your culture call is complete.
        </LockedAction>
      );
    }

    switch (ui.kind) {
      case 'offer':
        return (
          <StepYourOffer
            deal={deal}
            user={user}
            canEngage={!acceptBlockedByReview}
            busy={actionBusy === 'offer'}
            onSubmit={(payload) => doAction('offer', () => submitTradeOffer(deal.id, user.uid, payload))}
          />
        );
      case 'review':
        if (acceptBlockedByReview) {
          return (
            <LockedAction>
              Finish your pending review before accepting a new exchange.{' '}
              {firstPendingDealId ? (
                <Link to={`/deals/${firstPendingDealId}/review`} className="text-green font-semibold underline">
                  Leave review
                </Link>
              ) : null}
            </LockedAction>
          );
        }
        return (
          <StepReviewOffer
            deal={deal}
            user={user}
            canEngage
            busy={actionBusy}
            onAccept={() => doAction('accept', () => acceptTradeReview(deal.id, user.uid))}
            onCounter={() => doAction('counter', () => counterTradeReview(deal.id, user.uid))}
            onDecline={() => doAction('decline', () => declineTradeReview(deal.id, user.uid))}
          />
        );
      case 'mutualConfirm':
        return (
          <StepMutualConfirm
            deal={deal}
            user={user}
            otherName={otherName}
            canEngage
            busy={actionBusy === 'confirm'}
            onConfirm={() => doAction('confirm', () => confirmMutualTerms(deal.id, user.uid))}
          />
        );
      case 'schedule':
        return (
          <StepSchedule
            deal={deal}
            user={user}
            myName={myName}
            otherName={otherName}
            canEngage
            busy={actionBusy === 'schedule'}
            onSave={(payload) => doAction('schedule', () => saveTradeSchedule(deal.id, user.uid, payload))}
          />
        );
      case 'markComplete':
        return (
          <StepMarkComplete
            deal={deal}
            user={user}
            otherName={otherName}
            canEngage
            busy={actionBusy === 'complete'}
            iMarkedComplete={iMarkedComplete}
            onMarkComplete={() => doAction('complete', () => markDealComplete(deal.id, user.uid))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-9rem)] gap-4 pb-2">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-xl font-display font-bold text-ink-primary">Exchange</h1>
      </div>

      {exchangeLocked ? (
        <div className="rounded-2xl border border-coral/30 bg-coral/5 p-4 text-sm text-ink-secondary">
          {"A block is active between you — new messages won't be delivered. Unblock from Me if you placed the block."}
        </div>
      ) : null}

      {other ? (
        <div className="card p-3 flex items-center gap-3 shrink-0">
          <Avatar src={other.photoURL} name={other.displayName} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-ink-primary truncate">
              {other.displayName}
            </div>
            {getLocationDisplayName(other) ? (
              <div className="text-xs text-ink-muted truncate">{getLocationDisplayName(other)}</div>
            ) : null}
          </div>
        </div>
      ) : null}

      <GiffStepHeader uiStep={ui?.step ?? 1} totalDots={ui?.totalDots ?? 6} />

      <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-border bg-surface p-4 shadow-card">
        {renderStep()}
      </div>

      {actionError ? (
        <p className="text-red-400 text-sm shrink-0">{actionError}</p>
      ) : null}

      {/* DM lives in the top bar slide-up panel; mark read when this deal loads in background is handled via panel / thread hooks */}
      <p className="text-[11px] text-ink-muted text-center shrink-0">
        Messages — tap the notepad icon above.
      </p>
    </div>
  );
}
