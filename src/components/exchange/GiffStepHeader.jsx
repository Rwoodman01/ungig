import clsx from 'clsx';
import { EXCHANGE_STEP_LABELS, FOREST_GREEN, getGiffPoseBaseForUiStep } from '../../lib/exchangeFlow.js';
import { useGiffPoseUrl } from '../../hooks/useGiffPoseUrl.js';

export default function GiffStepHeader({ uiStep, totalDots = 6 }) {
  const poseBase = getGiffPoseBaseForUiStep(uiStep);
  const imgUrl = useGiffPoseUrl(poseBase);
  const label = EXCHANGE_STEP_LABELS[uiStep] ?? 'Exchange';

  return (
    <header className="flex flex-col items-center text-center px-2 pt-1 pb-3">
      <div className="h-24 w-24 rounded-full overflow-hidden bg-cream border border-border shadow-card shrink-0">
        <img src={imgUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-4" aria-hidden>
        {Array.from({ length: totalDots }, (_, i) => (
          <span
            key={i}
            className={clsx(
              'h-2 w-2 rounded-full transition-colors',
              uiStep >= 1 && i + 1 === uiStep ? 'bg-green' : 'bg-border',
            )}
          />
        ))}
      </div>
      <p
        className="mt-2 text-sm font-semibold tracking-tight font-sans"
        style={{ color: FOREST_GREEN }}
      >
        {label}
      </p>
    </header>
  );
}
