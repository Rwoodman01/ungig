import { Link } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function NotificationBell() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications(user?.uid);

  return (
    <Link
      to="/notifications"
      className="relative p-2 rounded-xl hover:bg-cream text-ink-primary shrink-0"
      aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {unreadCount > 0 ? (
        <span className="absolute top-1 right-1 min-w-[1.125rem] h-[1.125rem] px-0.5 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
