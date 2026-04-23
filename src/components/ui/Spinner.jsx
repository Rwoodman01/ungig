export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8 text-ink-300">
      <span className="h-5 w-5 rounded-full border-2 border-gold-500/40 border-t-gold-500 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
