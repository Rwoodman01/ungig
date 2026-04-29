import clsx from 'clsx';
import OfferSummary, { formatWantLine } from './OfferSummary.jsx';

export default function StepMutualConfirm({
  deal,
  user,
  otherName,
  canEngage,
  busy,
  onConfirm,
}) {
  const terms = deal.confirmations?.terms && typeof deal.confirmations.terms === 'object'
    ? deal.confirmations.terms
    : {};
  const iConfirmed = !!terms[user.uid];
  const otherId = deal.participantIds?.find((id) => id !== user.uid);
  const theyConfirmed = otherId ? !!terms[otherId] : false;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <p className="text-sm text-ink-secondary text-center">
        You&apos;re both happy with these terms. Confirm when you&apos;re ready to lock them in.
      </p>
      <OfferSummary
        title="Initiator offer"
        give={deal.initiatorService}
        wantLine={formatWantLine(deal, 'initiator')}
      />
      <OfferSummary
        title="Receiver offer"
        give={deal.receiverService}
        wantLine={formatWantLine(deal, 'receiver')}
      />

      {!theyConfirmed && iConfirmed ? (
        <p
          className={clsx(
            'text-center text-sm text-ink-secondary rounded-xl bg-cream/80 border border-border py-3 px-4',
            'animate-pulse',
          )}
        >
          {`Waiting for ${otherName} to confirm…`}
        </p>
      ) : null}

      <button
        type="button"
        className="btn-primary w-full mt-auto shrink-0"
        disabled={!canEngage || busy || iConfirmed}
        onClick={onConfirm}
      >
        {busy ? 'Saving…' : iConfirmed ? 'You’ve confirmed' : 'Confirm'}
      </button>
    </div>
  );
}
