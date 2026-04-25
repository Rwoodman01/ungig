export default function SwipeControls({ onPass, onLike, disabled }) {
  return (
    <div className="flex items-center justify-center gap-5">
      <button
        type="button"
        onClick={onPass}
        disabled={disabled}
        className="h-16 w-16 rounded-full bg-surface border border-coral/30 text-coral shadow-fab flex items-center justify-center text-2xl font-bold active:scale-95 transition"
        aria-label="Pass"
      >
        ×
      </button>
      <button
        type="button"
        onClick={onLike}
        disabled={disabled}
        className="h-20 w-20 rounded-full bg-green text-white shadow-fab flex items-center justify-center text-3xl font-bold active:scale-95 transition"
        aria-label="Interested"
      >
        ✓
      </button>
    </div>
  );
}
