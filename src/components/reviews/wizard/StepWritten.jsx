import clsx from 'clsx';
import { REVIEW_LIMITS } from '../../../lib/constants.js';

export default function StepWritten({
  otherName,
  writtenReview,
  onChange,
  onNext,
  onBack,
  disabled,
}) {
  const len = writtenReview.trim().length;
  const min = REVIEW_LIMITS.WRITTEN_MIN;
  const max = REVIEW_LIMITS.WRITTEN_MAX;
  const ok = len >= min;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-bold text-navyHero leading-tight">
        Tell the community about your experience
      </h1>
      <div className="relative">
        <textarea
          className="input min-h-[10rem] text-base pr-14"
          placeholder={`What was it like trading with ${otherName}? Be honest — your words help others make good decisions…`}
          value={writtenReview}
          onChange={(e) => onChange(e.target.value.slice(0, max))}
          maxLength={max}
        />
        <span
          className={clsx(
            'absolute bottom-3 right-3 text-xs font-medium',
            ok ? 'text-green' : 'text-ink-muted',
          )}
        >
          {len}/{min}+
        </span>
      </div>
      <p className="text-sm text-ink-secondary">
        Your review won&apos;t be visible until {otherName} reviews you too.
      </p>
      <div className="flex gap-2 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onBack}>
          Back
        </button>
        <button type="button" className="btn-primary flex-1" onClick={onNext} disabled={disabled || !ok}>
          Continue
        </button>
      </div>
    </div>
  );
}
