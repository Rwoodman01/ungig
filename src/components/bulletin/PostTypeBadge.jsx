import clsx from 'clsx';
import { POST_TYPE_META } from '../../lib/constants.js';

const ACCENT_CLASSES = {
  green: 'bg-green/10 text-green border-green/30',
  coral: 'bg-coral/10 text-coral border-coral/30',
  gold: 'bg-gold/15 text-ink-secondary border-gold/40',
};

export default function PostTypeBadge({ type, className = '' }) {
  const meta = POST_TYPE_META[type];
  if (!meta) return null;
  return (
    <span
      className={clsx(
        'inline-flex items-center text-[11px] font-bold uppercase tracking-wide',
        'px-2.5 py-1 rounded-full border',
        ACCENT_CLASSES[meta.accent] ?? ACCENT_CLASSES.gold,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
