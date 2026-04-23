import clsx from 'clsx';

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export default function Avatar({ src, name, size = 'md', className }) {
  const sizes = {
    xs: 'h-8 w-8 text-xs',
    sm: 'h-10 w-10 text-sm',
    md: 'h-14 w-14 text-base',
    lg: 'h-20 w-20 text-lg',
    xl: 'h-28 w-28 text-2xl',
  };
  return (
    <div
      className={clsx(
        'rounded-full overflow-hidden bg-navy-800 border border-navy-700',
        'flex items-center justify-center text-gold-300 font-semibold',
        sizes[size] || sizes.md,
        className,
      )}
      aria-label={name ? `${name} avatar` : 'avatar'}
    >
      {src ? (
        <img src={src} alt={name ?? ''} className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}
