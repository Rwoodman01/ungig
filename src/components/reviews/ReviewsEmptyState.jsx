export default function ReviewsEmptyState({ memberName }) {
  return (
    <div className="rounded-2xl border border-border bg-cream/80 p-6 text-center">
      <img src="/giff/face.png" alt="" className="w-20 h-20 mx-auto mb-3 opacity-90" />
      <p className="text-sm text-ink-secondary leading-relaxed">
        No reviews yet. Be the first to trade with {memberName} and tell the community how it went.
      </p>
    </div>
  );
}
