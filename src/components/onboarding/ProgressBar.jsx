import clsx from 'clsx';

// Simple 3-step progress bar for the onboarding flow.
// Lives above Welcome / Application / ProfileSetup.
const STEPS = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'application', label: 'Application' },
  { key: 'profile', label: 'Profile' },
];

export default function ProgressBar({ currentStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
  return (
    <div className="px-6 pt-6 pb-2">
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <div key={step.key} className="flex-1 flex items-center gap-2">
              <div
                className={clsx(
                  'h-1.5 flex-1 rounded-full transition',
                  done || active ? 'bg-lilac' : 'bg-steel-700',
                )}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[11px] tracking-brand uppercase font-display">
        {STEPS.map((step, i) => (
          <span
            key={step.key}
            className={clsx(
              i === currentIndex && 'text-lilac',
              i < currentIndex && 'text-silver',
              i > currentIndex && 'text-steel',
            )}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}
