import { APP_TAGLINE } from '../../lib/constants';

/**
 * Brand tagline. Uses the middle-dot separators already baked into the copy:
 *   "Exchange value • Build together • Create a way out"
 */
export default function Tagline({ className = '' }) {
  return (
    <p className={`tagline text-center ${className}`}>{APP_TAGLINE}</p>
  );
}
