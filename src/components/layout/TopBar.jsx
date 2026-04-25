import { Link, useLocation, useNavigate } from 'react-router-dom';
import Wordmark from '../brand/Wordmark.jsx';
import NotificationBell from '../notifications/NotificationBell.jsx';

export default function TopBar({ title, showBack = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const atRoot = location.pathname === '/';

  return (
    <header
      className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-border"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="max-w-app mx-auto flex items-center gap-2 px-4 h-14">
        {showBack && !atRoot ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-ghost px-2 py-1 -ml-2"
            aria-label="Back"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ) : null}
        <Link to="/" className="flex items-center min-w-0 flex-1">
          {title ? (
            <span className="font-display text-ink-primary text-xl font-bold truncate">
              {title}
            </span>
          ) : (
            <Wordmark size="md" withTagline={false} />
          )}
        </Link>
        <Link
          to="/bulletin"
          aria-label="Bulletin board"
          className="p-2 rounded-full text-ink-secondary hover:bg-cream"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="4" width="14" height="17" rx="2" />
            <path strokeLinecap="round" d="M9 4v2h6V4" />
            <path strokeLinecap="round" d="M9 10h6M9 14h6M9 18h4" />
          </svg>
        </Link>
        <NotificationBell />
      </div>
    </header>
  );
}
