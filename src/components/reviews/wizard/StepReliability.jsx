import clsx from 'clsx';

export default function StepReliability({ otherName, showedUp, onChange, onNext, onBack, disabled }) {
  const showFollowUp = showedUp === false;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-bold text-navyHero leading-tight">
        Did {otherName} show up as agreed?
      </h1>
      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          className={clsx(
            'rounded-2xl border-2 py-4 px-4 text-left font-semibold transition-colors',
            showedUp === true ? 'border-green bg-green/10 text-green' : 'border-border bg-surface hover:border-green/40',
          )}
          onClick={() => onChange(true)}
        >
          ✓ Yes they did
        </button>
        <button
          type="button"
          className={clsx(
            'rounded-2xl border-2 py-4 px-4 text-left font-semibold transition-colors',
            showedUp === false ? 'border-coral bg-coral/10 text-coral' : 'border-border bg-surface hover:border-coral/40',
          )}
          onClick={() => onChange(false)}
        >
          ✗ Not quite
        </button>
      </div>
      {showFollowUp ? (
        <p className="text-sm text-ink-secondary bg-cream rounded-2xl p-4 border border-border">
          That&apos;s okay. Your honest review helps the community.
        </p>
      ) : null}
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="btn-primary flex-1"
          onClick={onNext}
          disabled={disabled || showedUp === null || showedUp === undefined}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
