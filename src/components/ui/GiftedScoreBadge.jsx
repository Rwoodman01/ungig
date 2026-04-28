import clsx from 'clsx';

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.max(1, Math.min(100, Math.round(n)));
}

function toneFor(score) {
  if (score > 70) return 'green';
  if (score >= 50) return 'gold';
  return 'coral';
}

/**
 * Small, reusable score badge (used on browse cards + swipe cards).
 * Public display is only the final number — no breakdown.
 */
export default function GiftedScoreBadge({ score, variant = 'chip', className = '' }) {
  const s = clampScore(score);
  const tone = toneFor(s);

  if (variant === 'pill') {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
          tone === 'green' && 'bg-green text-white',
          tone === 'gold' && 'bg-gold text-navyHero',
          tone === 'coral' && 'bg-coral text-white',
          className,
        )}
        title="Gifted Score"
      >
        <span className="opacity-90">Score</span>
        <span>{s}</span>
      </span>
    );
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
        tone === 'green' && 'border-green/30 bg-green/10 text-green',
        tone === 'gold' && 'border-gold/40 bg-gold/10 text-gold-700',
        tone === 'coral' && 'border-coral/30 bg-coral/10 text-coral',
        className,
      )}
      title="Gifted Score"
    >
      {s}
    </span>
  );
}

