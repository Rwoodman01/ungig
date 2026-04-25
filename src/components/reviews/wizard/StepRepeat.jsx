import clsx from 'clsx';

export default function StepRepeat({ otherName, wouldTradeAgain, onChange, onNext, onBack, disabled }) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-bold text-navyHero leading-tight">
        Would you trade with {otherName} again?
      </h1>
      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          className={clsx(
            'rounded-2xl border-2 py-4 px-4 text-left font-semibold transition-colors',
            wouldTradeAgain === true ? 'border-green bg-green/10 text-green' : 'border-border bg-surface hover:border-green/40',
          )}
          onClick={() => onChange(true)}
        >
          Absolutely
        </button>
        <button
          type="button"
          className={clsx(
            'rounded-2xl border-2 py-4 px-4 text-left font-semibold transition-colors',
            wouldTradeAgain === false ? 'border-border bg-cream text-ink-secondary' : 'border-border bg-surface',
          )}
          onClick={() => onChange(false)}
        >
          Probably not
        </button>
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="btn-primary flex-1"
          onClick={onNext}
          disabled={disabled || wouldTradeAgain === null || wouldTradeAgain === undefined}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
