export default function UnreviewedFlag({ count }) {
  if (!count || count < 1) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-coral/15 text-coral text-xs font-medium px-2.5 py-1 border border-coral/30">
      Has {count} unreviewed exchange{count === 1 ? '' : 's'}
    </span>
  );
}
