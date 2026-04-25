import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { markAllNotificationsRead } from '../lib/notifications.js';
import { useNotifications } from '../hooks/useNotifications.js';
import NotificationItem from '../components/notifications/NotificationItem.jsx';
import Spinner from '../components/ui/Spinner.jsx';

export default function Notifications() {
  const { user } = useAuth();
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
