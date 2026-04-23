import { APP_NAME } from '../../lib/constants';

/**
 * Ungig wordmark. Text-only for now — Anton, all caps, lilac accent on the
 * second syllable so it reads as UN·GIG even in monochrome contexts.
 *
 * Sizes map onto Tailwind's text scale. Pass `accent={false}` for a flat
 * monochrome render (e.g. favicons, compact top bars).
 */
export default function Wordmark({
  size = 'md',
  accent = true,
  className = '',
}) {
  const sizeClass =
    size === 'xl' ? 'text-6xl' :
    size === 'lg' ? 'text-4xl' :
    size === 'sm' ? 'text-lg' :
    'text-2xl';

  const letters = APP_NAME.toUpperCase();
  // Brand accent falls on the trailing half of the wordmark when enabled.
  const pivot = Math.ceil(letters.length / 2);
  const head = letters.slice(0, pivot);
  const tail = letters.slice(pivot);

  return (
    <span className={`wordmark ${sizeClass} ${className}`}>
      {head}
      <span className={accent ? 'text-lilac' : ''}>{tail}</span>
    </span>
  );
}
