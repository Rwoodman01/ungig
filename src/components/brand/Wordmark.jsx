import { APP_NAME } from '../../lib/constants';
import Tagline from './Tagline.jsx';

/**
 * Gifted wordmark.
 * - Typography: Fraunces Italic (via `.wordmark` class in `src/index.css`)
 * - Color split: "Gif" (ink.primary) + "ted" (green)
 */
export default function Wordmark({
  size = 'md',
  withTagline = false,
  headClassName = 'text-ink-primary',
  tailClassName = 'text-green',
  className = '',
}) {
  const sizeClass =
    size === 'xl' ? 'text-6xl' :
    size === 'lg' ? 'text-4xl' :
    size === 'sm' ? 'text-lg' :
    'text-2xl';

  const name = APP_NAME || 'Gifted';
  const pivot = 3; // "Gif" | "ted"
  const head = name.slice(0, pivot);
  const tail = name.slice(pivot);

  return (
    <span className={className}>
      <span className={`wordmark ${sizeClass}`}>
        <span className={headClassName}>{head}</span>
        <span className={tailClassName}>{tail}</span>
      </span>
      {withTagline ? <Tagline className="mt-2" /> : null}
    </span>
  );
}
