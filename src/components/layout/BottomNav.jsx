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
const DealsIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16v10H4z M8 7V5h8v2" />
  </svg>
);
const ProfileIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <circle cx="12" cy="8" r="4" />
    <path strokeLinecap="round" d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
  </svg>
);
const AdminIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
  </svg>
);

const baseItem =
  'flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[11px] tracking-brand uppercase text-silver-300 font-medium';

function Item({ to, label, Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(baseItem, isActive && 'text-lilac')
      }
    >
      <Icon className="h-6 w-6" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function BottomNav({ isAdmin }) {
  return (
    <nav
      className="sticky bottom-0 z-30 bg-charcoal/95 backdrop-blur border-t border-steel-700"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-app mx-auto flex">
        <Item to="/" end label="Home" Icon={HomeIcon} />
        <Item to="/browse" label="Browse" Icon={BrowseIcon} />
        <Item to="/deals" label="Deals" Icon={DealsIcon} />
        <Item to="/me" label="Profile" Icon={ProfileIcon} />
        {isAdmin ? <Item to="/admin" label="Admin" Icon={AdminIcon} /> : null}
      </div>
    </nav>
  );
}
