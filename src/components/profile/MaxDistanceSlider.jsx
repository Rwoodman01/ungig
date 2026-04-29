import { MAX_DISTANCE_MILES_OPTIONS } from '../../lib/constantsGeo.js';

/**
 * Discrete max-distance control (miles). "Anywhere" is stored as `null`.
 * @param {{ value: number | null, onChange: (v: number | null) => void, disabled?: boolean }} props
 */
export default function MaxDistanceSlider({ value, onChange, disabled }) {
  const idx = MAX_DISTANCE_MILES_OPTIONS.findIndex((o) => {
    if (o.miles === null) return value === null;
    return o.miles === value;
  });
  const safeIdx = idx >= 0 ? idx : 2;

  return (
    <div>
      <label className="text-sm font-medium text-ink-secondary mb-2 block">
        Max match distance
      </label>
      <input
        type="range"
        min={0}
        max={MAX_DISTANCE_MILES_OPTIONS.length - 1}
        step={1}
        value={safeIdx}
        disabled={disabled}
        onChange={(e) => {
          const i = Number(e.target.value);
          const opt = MAX_DISTANCE_MILES_OPTIONS[i];
          if (opt) onChange(opt.miles);
        }}
        className="w-full accent-green"
      />
      <div className="flex justify-between text-[10px] text-ink-muted mt-1 uppercase tracking-wide">
        <span>5 mi</span>
        <span>Anywhere</span>
      </div>
      <p className="text-xs text-ink-secondary mt-2">
        Showing members within{' '}
        <strong className="text-ink-primary">
          {MAX_DISTANCE_MILES_OPTIONS[safeIdx]?.label ?? '25 miles'}
        </strong>
        {' '}on Find your match (when your location is set).
      </p>
    </div>
  );
}
