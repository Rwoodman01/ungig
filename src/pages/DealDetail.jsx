// DealDetail — the heart of the app. Handles:
//   - viewing the other participant's summary
//   - editing the service each side offers
//   - picking a date/time
//   - status transitions (accept/decline/schedule/complete)
//   - messaging
//   - review submission

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import LockedAction from '../components/ui/LockedAction.jsx';
import MessageThread from '../components/deals/MessageThread.jsx';
import DealCompletionPhotoManager from '../components/photos/DealCompletionPhotoManager.jsx';
import { DEAL_STATUS } from '../lib/constants.js';
import {
  fetchOtherParticipant,
  markDealComplete,
  setDealStatus,
  updateDealFields,
} from '../lib/deals.js';

function StatusPill({ status }) {
  return (
    <span className="chip-gold text-[10px] uppercase tracking-wide">
      {status}
    </span>
  );
}

function DealStageBar({ status }) {
  const stages = ['Proposed', 'Accepted', 'Scheduled', 'Completed', 'Reviewed'];
  const idxFor = (s) => {
    if (s === DEAL_STATUS.REVIEWED) return 4;
    if (s === DEAL_STATUS.COMPLETED) return 3;
    if (s === DEAL_STATUS.SCHEDULED) return 2;
    if (s === DEAL_STATUS.ACCEPTED) return 1;
    return 0; // requested/declined/etc
  };
  const current = idxFor(status);
  return (
    <div className="card-cream p-3 border border-border rounded-2xl">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        {stages.map((label, i) => (
          <div key={label} className="flex-1 min-w-0">
            <div
              className={[
                'h-1.5 rounded-full',
                i <= current ? 'bg-green' : 'bg-border',
              ].join(' ')}
            />
            <div
              className={[
                'mt-1 text-center truncate',
                i === current ? 'text-ink-primary font-semibold' : 'text-ink-muted',
              ].join(' ')}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DealDetail() {
  const { dealId } = useParams();
  const { user, canEngage, hasPendingReviews, firstPendingDealId } = useAuth();
  const [dealSnap, loading, error] = useDocument(doc(db, 'deals', dealId));
  const [other, setOther] = useState(null);
  const [savingField, setSavingField] = useState('');
  const [actionBusy, setActionBusy] = useState('');
  const [actionError, setActionError] = useState('');
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);

  const deal = dealSnap?.exists() ? { id: dealSnap.id, ...dealSnap.data() } : null;

  const iAmInitiator = deal?.initiatorId === user?.uid;
  const myServiceField = iAmInitiator ? 'initiatorService' : 'receiverService';
  const theirServiceField = iAmInitiator ? 'receiverService' : 'initiatorService';

  const [myService, setMyService] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    if (!deal) return;
    setMyService(deal[myServiceField] ?? '');
    setScheduledDate(deal.scheduledDate ?? '');
    setScheduledTime(deal.scheduledTime ?? '');
  }, [deal?.id, deal?.[myServiceField], deal?.scheduledDate, deal?.scheduledTime]);

  useEffect(() => {
    let cancel = false;
    if (!deal || !user) return;
    fetchOtherParticipant(deal, user.uid).then((p) => {
      if (!cancel) setOther(p);
    });
    return () => { cancel = true; };
  }, [deal?.id, user?.uid]);

  const iAlreadyReviewed = useMemo(
    () => !!deal?.reviewedBy?.[user?.uid],
    [deal?.reviewedBy, user?.uid],
  );
  const iMarkedComplete = useMemo(
    () => !!deal?.completedBy?.[user?.uid],
    [deal?.completedBy, user?.uid],
  );

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-400 text-sm">Error: {error.message}</p>;
  if (!deal) return <EmptyState title="Exchange not found" />;
  if (!deal.participantIds?.includes(user.uid)) {
    return <EmptyState title="Not authorized" description="This exchange is private." />;
  }

  // Engagement actions (accept/decline, schedule, complete, review) all
  // require approved status — pending members see a soft lock instead.
  const canAcceptDecline = canEngage
    && !hasPendingReviews
    && !iAmInitiator
    && deal.status === DEAL_STATUS.REQUESTED;
  const acceptBlockedByReview = canEngage
    && hasPendingReviews
    && !iAmInitiator
    && deal.status === DEAL_STATUS.REQUESTED;
  const canSchedule = canEngage
    && (deal.status === DEAL_STATUS.ACCEPTED || deal.status === DEAL_STATUS.SCHEDULED);
  const canMarkComplete = canEngage
    && (deal.status === DEAL_STATUS.ACCEPTED || deal.status === DEAL_STATUS.SCHEDULED)
    && !iMarkedComplete;
  const canReview = canEngage
    && (deal.status === DEAL_STATUS.COMPLETED || deal.status === DEAL_STATUS.REVIEWED)
    && !iAlreadyReviewed;

  const saveMyService = async () => {
    setSavingField(myServiceField);
    try {
      await updateDealFields(deal.id, { [myServiceField]: myService.trim() });
    } finally {
      setSavingField('');
    }
  };

  const saveSchedule = async () => {
    setSavingField('schedule');
    try {
      await updateDealFields(deal.id, {
        scheduledDate,
        scheduledTime,
        status: scheduledDate ? DEAL_STATUS.SCHEDULED : deal.status,
      });
    } finally {
      setSavingField('');
    }
  };

  const doAction = async (label, fn) => {
    setActionBusy(label);
    setActionError('');
    try { await fn(); }
    catch (err) { setActionError(err.message ?? 'Something went wrong.'); }
    finally { setActionBusy(''); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-ink-primary">Exchange</h1>
        <StatusPill status={deal.status} />
      </div>

      <DealStageBar status={deal.status} />

      {other ? (
        <div className="card p-4 flex items-center gap-3">
          <Avatar src={other.photoURL} name={other.displayName} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-ink-primary truncate">
              {other.displayName}
            </div>
            {other.location ? (
              <div className="text-xs text-ink-muted truncate">{other.location}</div>
            ) : null}
          </div>
        </div>
      ) : null}

      {!canEngage ? (
        <LockedAction>
          You can read this exchange. Engagement actions unlock once your
          culture call is complete.
        </LockedAction>
      ) : null}

      <section className="card p-4 space-y-2">
        <h2 className="text-sm font-semibold text-ink-primary">Your offer</h2>
        <textarea
          className="input min-h-[3rem]"
          placeholder="Describe what you’ll provide. Include scope, timeline, and any details that make it easy to say yes."
          value={myService}
          onChange={(e) => setMyService(e.target.value)}
          onBlur={saveMyService}
          disabled={!canEngage}
        />
        <div className="text-xs text-ink-muted">
          <div className="flex items-center justify-between gap-3">
            <span>
              {savingField === myServiceField ? 'Saving...' : canEngage ? 'Saved on blur.' : 'Locked until approval.'}
            </span>
            <span className="tabular-nums">{myService.length} chars</span>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-border">
          <h3 className="text-sm font-semibold text-ink-primary">
            {other?.displayName ?? 'Their'} offer
          </h3>
          <p className="text-sm text-ink-secondary mt-1">
            {deal[theirServiceField] || <span className="text-ink-muted italic">Not yet described.</span>}
          </p>
        </div>
      </section>

      {canSchedule ? (
        <section className="card p-4 space-y-2">
          <h2 className="text-sm font-semibold text-ink-primary">Schedule</h2>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              className="input"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
            <input
              type="time"
              className="input"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={saveSchedule}
            className="btn-secondary w-full mt-2"
            disabled={savingField === 'schedule'}
          >
            {savingField === 'schedule' ? 'Saving...' : 'Save schedule'}
          </button>
        </section>
      ) : null}

      {acceptBlockedByReview ? (
        <LockedAction>
          Finish your pending review before accepting a new exchange.{' '}
          {firstPendingDealId ? (
            <Link to={`/deals/${firstPendingDealId}/review`} className="text-green font-semibold underline">
              Leave review
            </Link>
          ) : null}
        </LockedAction>
      ) : null}

      {canAcceptDecline ? (
        <section className="card p-4 space-y-3">
          <div className="text-sm text-ink-secondary">
            <span className="text-ink-muted">They offered:</span>{' '}
            {deal.initiatorService
              ? <span className="text-ink-primary font-medium">{deal.initiatorService}</span>
              : <span className="text-ink-muted italic">No offer details yet.</span>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-primary"
              onClick={() => doAction('accept', () => setDealStatus(deal.id, DEAL_STATUS.ACCEPTED))}
              disabled={actionBusy === 'accept'}
            >
              {actionBusy === 'accept' ? '...' : 'Accept'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => doAction('decline', () => setDealStatus(deal.id, DEAL_STATUS.DECLINED))}
              disabled={actionBusy === 'decline'}
            >
              {actionBusy === 'decline' ? '...' : 'Decline'}
            </button>
          </div>
        </section>
      ) : null}

      {canMarkComplete ? (
        <>
          <button
            className="btn-primary w-full"
            onClick={() => setConfirmCompleteOpen(true)}
            disabled={actionBusy === 'complete'}
          >
            {actionBusy === 'complete'
              ? 'Saving...'
              : iMarkedComplete
                ? 'Waiting on them to mark complete'
                : 'Mark complete'}
          </button>
          {confirmCompleteOpen ? (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
              <div className="bg-surface rounded-[20px] w-full max-w-sm p-5 shadow-2xl border border-border">
                <h3 className="text-lg font-display font-bold text-ink-primary">
                  Mark exchange complete?
                </h3>
                <p className="text-sm text-ink-muted mt-2 leading-relaxed">
                  Only mark complete once your part of the exchange is finished.
                  Your review will unlock next.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setConfirmCompleteOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      setConfirmCompleteOpen(false);
                      doAction('complete', () => markDealComplete(deal.id, user.uid));
                    }}
                  >
                    Yes, complete
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {deal.status === DEAL_STATUS.COMPLETED || deal.status === DEAL_STATUS.REVIEWED ? (
        <>
          <div className="card-cream p-4 text-sm text-ink-secondary flex items-center gap-3">
            <img src="/giff/gift.png" alt="" className="h-10 w-10" />
            <div>
              <div className="font-semibold text-ink-primary">Exchange complete.</div>
              <div className="text-ink-muted">Small acts. Big impact.</div>
            </div>
          </div>
          <DealCompletionPhotoManager deal={deal} uid={user.uid} otherName={other?.displayName} />
        </>
      ) : null}

      {canReview && other ? (
        <div className="card p-4 space-y-3 border-green/20 bg-green/5">
          <div className="text-sm font-semibold text-ink-primary">Your turn — leave a review</div>
          <p className="text-xs text-ink-muted">
            Reviews are blind until you both submit. Honest feedback helps everyone trade with confidence.
          </p>
          <Link to={`/deals/${deal.id}/review`} className="btn-primary w-full text-center block">
            Leave your review
          </Link>
        </div>
      ) : null}

      {actionError ? (
        <p className="text-red-400 text-sm">{actionError}</p>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold text-ink-primary mb-2">Messages</h2>
        <MessageThread dealId={deal.id} />
      </section>
    </div>
  );
}
