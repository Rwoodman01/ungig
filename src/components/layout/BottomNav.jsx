import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

// Icons are intentionally inline SVG to keep the bundle small and avoid
// an icon-library dependency this early in the project.
const HomeIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l9-8 9 8M5 10v10h14V10" />
  </svg>
);
const BrowseIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <circle cx="11" cy="11" r="7" />
    <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
  </svg>
);
const GiveIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v12M6 12h12" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 6c0 2 2 3 5 3 0-2-1-5-3-5-1 0-2 1-2 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 6c0 2-2 3-5 3 0-2 1-5 3-5 1 0 2 1 2 2z" />
  </svg>
);
const InboxIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 13h5l2 3h2l2-3h5" />
  </svg>
);
const ProfileIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <circle cx="12" cy="8" r="4" />
    <path strokeLinecap="round" d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
  </svg>
);

const baseItem =
  'flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[11px] text-ink-muted font-medium';

function Item({ to, label, Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(baseItem, isActive && 'text-green')
      }
    >
      <Icon className="h-6 w-6" />
      <span>{label}</span>
    </NavLink>
  );
}

function GiveFab() {
  return (
    <NavLink
      to="/browse?intent=give"
      className={({ isActive }) =>
        clsx(
          'flex-1 flex items-center justify-center',
          isActive ? 'opacity-100' : 'opacity-100',
        )
      }
      aria-label="Give"
    >
      <div className="fab-give">
        <img
          src="/giff/face.png"
          alt=""
          className="h-7 w-7"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </div>
    </NavLink>
  );
}

export default function BottomNav() {
  return (
    <nav
      className="sticky bottom-0 z-30 bg-surface/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-app mx-auto flex">
        <Item to="/" end label="Home" Icon={HomeIcon} />
        <Item to="/browse" label="Browse" Icon={BrowseIcon} />
        <GiveFab />
        <Item to="/deals" label="Inbox" Icon={InboxIcon} />
        <Item to="/me" label="Profile" Icon={ProfileIcon} />
      </div>
    </nav>
  );
}
