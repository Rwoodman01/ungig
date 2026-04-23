import { BADGE_META } from '../../lib/constants.js';

export default function Badge({ badgeKey }) {
  const meta = BADGE_META[badgeKey];
  if (!meta) return null;
  return (
    <span className="chip-gold" title={meta.label}>
      <span aria-hidden>{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  );
}
