import { Link, useLocation, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../../lib/constants.js';

export default function TopBar({ title, showBack = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const atRoot = location.pathname === '/';

  return (
    <header
      className="sticky top-0 z-30 bg-navy-950/90 backdrop-blur border-b border-navy-800"
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
        <Link to="/" className="font-display text-xl font-bold text-gold-400">
          {title ?? APP_NAME}
        </Link>
      </div>
    </header>
  );
}
