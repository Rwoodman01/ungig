import { useState } from 'react';
import OfferSummary, { formatWantLine } from './OfferSummary.jsx';

export default function StepReviewOffer({
  deal,
  user,
  canEngage,
  busy,
  onAccept,
  onCounter,
  onDecline,
}) {
  const [confirmDecline, setConfirmDecline] = useState(false);

  if (user.uid !== deal.receiverId) {
    return (
      <p className="text-sm text-ink-muted text-center py-8">
        Waiting for them to respond to your offer.
      </p>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <OfferSummary
        title="Their offer"
        give={deal.initiatorService}
        wantLine={formatWantLine(deal, 'initiator')}
      />
      {(deal.receiverService || deal.receiverWant || deal.receiverWantOpen) ? (
        <OfferSummary
          title="Your offer (on file)"
          give={deal.receiverService}
          wantLine={formatWantLine(deal, 'receiver')}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-2 mt-auto">
        <button
          type="button"
          className="btn-primary w-full"
          disabled={!canEngage || busy}
          onClick={onAccept}
        >
          {busy === 'accept' ? '…' : 'Accept'}
        </button>
        <button
          type="button"
          className="btn-secondary w-full"
          disabled={!canEngage || busy}
          onClick={onCounter}
        >
          {busy === 'counter' ? '…' : 'Counter'}
        </button>
        <button
          type="button"
          className="btn-secondary w-full text-coral border-coral/40"
          disabled={!canEngage || busy}
          onClick={() => setConfirmDecline(true)}
        >
          Decline
        </button>
      </div>

      {confirmDecline ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-surface rounded-[20px] w-full max-w-sm p-5 shadow-2xl border border-border">
            <h3 className="text-lg font-display font-bold text-ink-primary">Decline this exchange?</h3>
            <p className="text-sm text-ink-muted mt-2 leading-relaxed">
              This will end the trade for both of you. This cannot be undone.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary" onClick={() => setConfirmDecline(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary bg-coral border-coral hover:bg-coral/90"
                onClick={() => {
                  setConfirmDecline(false);
                  onDecline();
                }}
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
