export default function ReviewSummaryBar({ memberName, stats }) {
  const { count, average, wouldAgainPct, showedUpPct, topTag } = stats;

  if (!count) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <span className="text-gold text-3xl leading-none">★</span>
        <span className="text-2xl font-bold text-ink-primary">{average?.toFixed(1) ?? '—'}</span>
        <span className="text-sm text-ink-muted pb-1">
          ({count} review{count === 1 ? '' : 's'})
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-cream border border-border px-3 py-1.5 text-xs font-medium text-navyHero">
          {wouldAgainPct ?? 0}% would trade again
        </span>
        <span className="rounded-full bg-cream border border-border px-3 py-1.5 text-xs font-medium text-navyHero">
          {showedUpPct ?? 0}% showed up
        </span>
      </div>
      {topTag ? (
        <div className="rounded-2xl border border-border bg-surface p-4 flex gap-3 items-center shadow-sm">
          <img src="/giff/face.png" alt="" className="w-12 h-12 shrink-0 rounded-full object-cover bg-cream" />
          <p className="text-sm text-ink-primary">
            <span className="font-semibold">People say {memberName} is {topTag}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
