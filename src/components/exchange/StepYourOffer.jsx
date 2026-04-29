import { useEffect, useState } from 'react';
import { DEAL_STATUS } from '../../lib/constants.js';
import OfferSummary, { formatWantLine } from './OfferSummary.jsx';

export default function StepYourOffer({
  deal,
  user,
  canEngage,
  busy,
  onSubmit,
}) {
  const turnUid = deal.pendingOfferBy ?? deal.initiatorId;
  const isInitiator = user.uid === deal.initiatorId;
  const myGive = isInitiator ? (deal.initiatorService ?? '') : (deal.receiverService ?? '');
  const myWant = isInitiator ? (deal.initiatorWant ?? '') : (deal.receiverWant ?? '');
  const myOpen = isInitiator ? !!deal.initiatorWantOpen : !!deal.receiverWantOpen;

  const [give, setGive] = useState(myGive);
  const [want, setWant] = useState(myWant);
  const [wantOpen, setWantOpen] = useState(myOpen);

  useEffect(() => {
    setGive(myGive);
    setWant(myWant);
    setWantOpen(myOpen);
  }, [deal.id, myGive, myWant, myOpen]);

  if (turnUid !== user.uid) {
    return (
      <p className="text-sm text-ink-muted text-center py-8">
        Waiting for the other member to update their offer.
      </p>
    );
  }

  const showReceiverContext =
    deal.status === DEAL_STATUS.COUNTERED && isInitiator && (deal.receiverService || deal.receiverWant || deal.receiverWantOpen);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      {showReceiverContext ? (
        <OfferSummary
          title="Their side (for context)"
          give={deal.receiverService}
          wantLine={formatWantLine(deal, 'receiver')}
        />
      ) : null}

      <div className="flex flex-col gap-2 flex-1">
        <label className="text-sm font-semibold text-ink-primary">What you&apos;re giving</label>
        <textarea
          className="input min-h-[6rem] flex-1"
          value={give}
          onChange={(e) => setGive(e.target.value)}
          disabled={!canEngage || busy}
          placeholder="Describe what you’ll provide — scope, timing, and anything that helps them say yes."
          maxLength={1200}
        />
        <span className="text-xs text-ink-muted tabular-nums text-right">{give.length} / 1200</span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-ink-primary">What you want in return</label>
        <label className="flex items-center gap-2 text-sm text-ink-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={wantOpen}
            onChange={(e) => setWantOpen(e.target.checked)}
            disabled={!canEngage || busy}
          />
          Open to suggestions
        </label>
        {!wantOpen ? (
          <textarea
            className="input min-h-[5rem]"
            value={want}
            onChange={(e) => setWant(e.target.value)}
            disabled={!canEngage || busy}
            placeholder="What would make this a fair trade for you?"
            maxLength={1200}
          />
        ) : null}
        {!wantOpen ? (
          <span className="text-xs text-ink-muted tabular-nums text-right">{want.length} / 1200</span>
        ) : null}
      </div>

      <button
        type="button"
        className="btn-primary w-full shrink-0"
        disabled={!canEngage || busy}
        onClick={() => onSubmit({ give, want, wantOpen })}
      >
        {busy ? 'Sending…' : 'Submit offer'}
      </button>
    </div>
  );
}
