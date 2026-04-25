import clsx from 'clsx';

/** 5-step progress (celebration is step 6, no bar segment). */
export default function WizardProgress({ currentStep, totalSteps = 5 }) {
  return (
    <div className="flex gap-1.5 w-full max-w-md mx-auto" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const n = i + 1;
        const done = n < currentStep;
        const active = n === currentStep;
        return (
          <div
            key={n}
            className={clsx(
              'h-1.5 flex-1 rounded-full transition-colors',
              done && 'bg-green',
              active && 'bg-green',
              !done && !active && 'bg-border',
            )}
          />
        );
      })}
    </div>
  );
}
