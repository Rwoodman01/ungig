import { useState } from 'react';
import OfferSummary, { formatWantLine } from './OfferSummary.jsx';

export default function StepMarkComplete({
  deal,
  user,
  otherName,
  canEngage,
  busy,
  onMarkComplete,
  iMarkedComplete,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <p className="text-sm text-ink-secondary text-center">
        Meet time:{' '}
        <span className="font-semibold text-ink-primary">
          {deal.scheduledDate} {deal.scheduledTime}
        </span>
      </p>
      <OfferSummary title="Initiator" give={deal.initiatorService} wantLine={formatWantLine(deal, 'initiator')} />
      <OfferSummary title="Receiver" give={deal.receiverService} wantLine={formatWantLine(deal, 'receiver')} />

      <button
        type="button"
        className="btn-primary w-full mt-auto"
        onClick={() => setOpen(true)}
        disabled={!canEngage || busy || iMarkedComplete}
      >
        {iMarkedComplete ? `Waiting for ${otherName} to mark complete` : 'Mark complete'}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-surface rounded-[20px] w-full max-w-sm p-5 shadow-2xl border border-border">
            <h3 className="text-lg font-display font-bold text-ink-primary">Mark exchange complete?</h3>
            <p className="text-sm text-ink-muted mt-2 leading-relaxed">
              Only mark complete once your part of the exchange is finished. Reviews unlock after both of you mark complete.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setOpen(false);
                  onMarkComplete();
                }}
              >
                Yes, complete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
