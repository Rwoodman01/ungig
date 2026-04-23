// DealDetail — the heart of the app. Handles:
//   - viewing the other participant's summary
//   - editing the service each side offers
//   - picking a date/time
//   - status transitions (accept/decline/schedule/complete)
//   - messaging
//   - review submission

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import MessageThread from '../components/deals/MessageThread.jsx';
import ReviewForm from '../components/deals/ReviewForm.jsx';
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

export default function DealDetail() {
  const { dealId } = useParams();
  const { user } = useAuth();
  const [dealSnap, loading, error] = useDocument(doc(db, 'deals', dealId));
  const [other, setOther] = useState(null);
  const [savingField, setSavingField] = useState('');
  const [actionBusy, setActionBusy] = useState('');
  const [actionError, setActionError] = useState('');

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
  if (!deal) return <EmptyState title="Deal not found" />;
  if (!deal.participantIds?.includes(user.uid)) {
    return <EmptyState title="Not authorized" description="This trade is private." />;
  }

  const canAcceptDecline = !iAmInitiator && deal.status === DEAL_STATUS.REQUESTED;
  const canSchedule =
    deal.status === DEAL_STATUS.ACCEPTED || deal.status === DEAL_STATUS.SCHEDULED;
  const canMarkComplete =
    (deal.status === DEAL_STATUS.ACCEPTED || deal.status === DEAL_STATUS.SCHEDULED) &&
    !iMarkedComplete;
  const canReview =
    (deal.status === DEAL_STATUS.COMPLETED || deal.status === DEAL_STATUS.REVIEWED) &&
    !iAlreadyReviewed;

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
        <h1 className="text-xl font-display font-bold text-gold-400">Trade</h1>
        <StatusPill status={deal.status} />
      </div>

      {other ? (
        <div className="card p-4 flex items-center gap-3">
          <Avatar src={other.photoURL} name={other.displayName} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-ink-50 truncate">
              {other.displayName}
            </div>
            {other.location ? (
              <div className="text-xs text-ink-300 truncate">{other.location}</div>
            ) : null}
          </div>
        </div>
      ) : null}

      <section className="card p-4 space-y-2">
        <h2 className="text-sm font-semibold text-ink-50">Your offer</h2>
        <textarea
          className="input min-h-[3rem]"
          placeholder="Describe what you'll provide."
          value={myService}
          onChange={(e) => setMyService(e.target.value)}
          onBlur={saveMyService}
        />
        <div className="text-xs text-ink-300">
          {savingField === myServiceField ? 'Saving...' : 'Saved on blur.'}
        </div>

        <div className="pt-3 mt-3 border-t border-navy-800">
          <h3 className="text-sm font-semibold text-ink-50">
            {other?.displayName ?? 'Their'} offer
          </h3>
          <p className="text-sm text-ink-100 mt-1">
            {deal[theirServiceField] || <span className="text-ink-300 italic">Not yet described.</span>}
          </p>
        </div>
      </section>

      {canSchedule ? (
        <section className="card p-4 space-y-2">
          <h2 className="text-sm font-semibold text-ink-50">Schedule</h2>
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

      {canAcceptDecline ? (
        <section className="grid grid-cols-2 gap-2">
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
        </section>
      ) : null}

      {canMarkComplete ? (
        <button
          className="btn-primary w-full"
          onClick={() => doAction('complete', () => markDealComplete(deal.id, user.uid))}
          disabled={actionBusy === 'complete'}
        >
          {actionBusy === 'complete'
            ? 'Saving...'
            : iMarkedComplete
              ? 'Waiting on them to mark complete'
              : 'Mark complete'}
        </button>
      ) : null}

      {deal.status === DEAL_STATUS.COMPLETED || deal.status === DEAL_STATUS.REVIEWED ? (
        <div className="card p-3 text-sm text-emerald-400">
          Trade complete. Nice work.
        </div>
      ) : null}

      {canReview && other ? (
        <ReviewForm
          dealId={deal.id}
          reviewerId={user.uid}
          revieweeId={other.id}
        />
      ) : null}

      {actionError ? (
        <p className="text-red-400 text-sm">{actionError}</p>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold text-ink-50 mb-2">Messages</h2>
        <MessageThread dealId={deal.id} />
      </section>
    </div>
  );
}
