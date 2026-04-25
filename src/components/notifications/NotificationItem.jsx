import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

function formatRelative(createdAt) {
  if (!createdAt?.toMillis) return '';
  const diff = Date.now() - createdAt.toMillis();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationItem({ item }) {
  const navigate = useNavigate();
  const unread = item.readAt == null;

  return (
    <button
      type="button"
      onClick={() => navigate(item.link || '/')}
      className={clsx(
        'w-full text-left rounded-2xl border px-4 py-3 flex gap-3 transition-colors',
        unread ? 'border-green/30 bg-green/5' : 'border-border bg-surface',
      )}
    >
      <img src="/giff/face.png" alt="" className="w-10 h-10 shrink-0 rounded-full object-cover bg-cream" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink-primary leading-snug">{item.message}</p>
        <p className="text-xs text-ink-muted mt-1">{formatRelative(item.createdAt)}</p>
      </div>
      {unread ? (
        <span className="w-2 h-2 rounded-full bg-coral shrink-0 mt-2" aria-hidden />
      ) : null}
    </button>
  );
}
