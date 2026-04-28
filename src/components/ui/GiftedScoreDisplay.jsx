import clsx from 'clsx';

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.max(1, Math.min(100, Math.round(n)));
}

function colorClass(score) {
  if (score > 70) return 'text-green';
  if (score >= 50) return 'text-gold-700';
  return 'text-coral';
}

export default function GiftedScoreDisplay({ score, className = '' }) {
  const s = clampScore(score);
  return (
    <div className={clsx('text-center', className)}>
      <div className={clsx('text-4xl font-display font-bold leading-none', colorClass(s))}>
        {s}
      </div>
      <div className="text-[11px] text-ink-muted mt-1">Gifted Score</div>
    </div>
  );
}

