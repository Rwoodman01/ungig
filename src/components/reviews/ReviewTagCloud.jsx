import { tagSizeClass } from '../../lib/reviewStats.js';

export default function ReviewTagCloud({ tagCounts }) {
  const entries = Object.entries(tagCounts ?? {}).filter(([, c]) => c > 0);
  if (!entries.length) return null;
  const max = Math.max(...entries.map(([, c]) => c));

  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-primary mb-2">What people mention</h3>
      <div className="flex flex-wrap gap-2 items-center">
        {entries.map(([tag, count]) => (
          <span
            key={tag}
            className={`rounded-full px-3 py-1.5 text-sage bg-sage/15 border border-sage/30 ${tagSizeClass(count, max)}`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
