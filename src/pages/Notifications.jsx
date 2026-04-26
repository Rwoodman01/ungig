import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { markAllNotificationsRead } from '../lib/notifications.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { usePushPermission } from '../hooks/usePushPermission.js';
import NotificationItem from '../components/notifications/NotificationItem.jsx';
import Spinner from '../components/ui/Spinner.jsx';

function PushStatusBanner({ uid }) {
  const {
    permission,
    showPrompt,
    showDismissed,
    showBlocked,
    requesting,
    requestPermission,
    clearDismissed,
  } = usePushPermission(uid);

  if (permission === 'granted') {
    return (
      <div className="flex items-center gap-2 text-xs text-green px-1">
        <span>✓</span>
        <span>Push notifications are on for this device.</span>
      </div>
    );
  }

  if (showBlocked) {
    return (
      <div className="card-cream p-3 rounded-xl border border-border text-xs text-ink-secondary leading-relaxed">
        <span className="font-semibold text-coral">Notifications are blocked.</span>{' '}
        To re-enable, open your browser or OS settings, find{' '}
        <strong>Gifted</strong>, and allow notifications. Then reload the app.
      </div>
    );
  }

  if (showPrompt || showDismissed) {
    return (
      <div className="card p-3 flex items-center gap-3">
        <span className="text-lg select-none">🔔</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-ink-muted leading-snug">
            Enable push notifications to hear about matches, trades, and
            messages when the app is closed.
          </p>
        </div>
        <button
          onClick={async () => {
            if (showDismissed) clearDismissed();
            await requestPermission();
          }}
          disabled={requesting}
          className="btn-primary text-xs py-1.5 px-3 flex-shrink-0 disabled:opacity-50"
        >
          {requesting ? 'Enabling…' : 'Enable'}
        </button>
      </div>
    );
  }

  return null;
}

export default function Notifications() {
  const { user, canEngage } = useAuth();
  const { items, loading } = useNotifications(user?.uid);

  useEffect(() => {
    if (user?.uid) {
      markAllNotificationsRead(user.uid).catch(() => {});
    }
  }, [user?.uid]);

  if (!user) return null;
  if (loading) return <Spinner label="Loading…" />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-bold text-ink-primary">Notifications</h1>

      {canEngage && <PushStatusBanner uid={user.uid} />}

      {items.length === 0 ? (
        <div className="card-cream p-8 text-center rounded-2xl border border-border">
          <img src="/giff/face.png" alt="" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-ink-primary font-semibold">You&apos;re all caught up!</p>
          <p className="text-sm text-ink-muted mt-2">We&apos;ll let you know when something new happens.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <NotificationItem item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
