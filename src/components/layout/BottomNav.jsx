import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

// Icons are intentionally inline SVG to keep the bundle small and avoid
// an icon-library dependency this early in the project.
const HomeIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l9-8 9 8M5 10v10h14V10" />
  </svg>
);
const BulletinIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path strokeLinecap="round" d="M9 4v2h6V4" />
    <path strokeLinecap="round" d="M9 10h6M9 14h6M9 18h4" />
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

/** Centre raised control — Giff avatar, opens Browse (member discovery). */
function BrowseCentreFab() {
  return (
    <NavLink
      to="/browse"
      className={({ isActive }) =>
        clsx(
          'flex-1 flex items-center justify-center',
          isActive ? 'opacity-100' : 'opacity-100',
        )
      }
      aria-label="Browse members"
    >
      <div className="fab-give overflow-hidden p-0.5">
        <img
          src="/giff/face.png"
          alt=""
          className="h-full w-full rounded-full object-cover"
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
        <Item to="/bulletin" label="Bulletin" Icon={BulletinIcon} />
        <BrowseCentreFab />
        <Item to="/deals" label="Inbox" Icon={InboxIcon} />
        <Item to="/me" label="Profile" Icon={ProfileIcon} />
      </div>
    </nav>
  );
}
