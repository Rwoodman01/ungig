import clsx from 'clsx';

const COPY = {
  1: "That's tough. We're sorry.",
  2: 'Thanks for being honest.',
  3: 'Pretty good!',
  4: 'Really nice.',
  5: 'Amazing! The community loves to hear this.',
};

export default function StepStarRating({ otherName, starRating, onChange, onNext, disabled }) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-bold text-navyHero leading-tight">
        How was your trade with {otherName}?
      </h1>
      <div className="flex justify-center gap-2 py-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={clsx(
              'text-4xl sm:text-5xl leading-none p-1 transition-transform active:scale-95',
              n <= starRating ? 'text-gold' : 'text-ink-muted',
            )}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
          >
            ★
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-ink-secondary min-h-[3rem]">
        {COPY[starRating] ?? ''}
      </p>
      <button type="button" className="btn-primary w-full" onClick={onNext} disabled={disabled}>
        Continue
      </button>
    </div>
  );
}
