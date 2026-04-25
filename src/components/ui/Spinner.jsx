export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8 text-ink-muted">
      <span className="h-5 w-5 rounded-full border-2 border-border border-t-green animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
