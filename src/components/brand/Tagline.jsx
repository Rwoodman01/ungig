import { APP_TAGLINE } from '../../lib/constants';

/**
 * Brand tagline. Gifted uses all-caps with middle dots:
 *   "GIVE • RECEIVE • GROW"
 */
export default function Tagline({ className = '' }) {
  return (
    <p className={`tagline text-center ${className}`}>{APP_TAGLINE}</p>
  );
}
