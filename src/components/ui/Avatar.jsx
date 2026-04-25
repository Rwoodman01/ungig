import { useEffect, useState } from 'react';
import clsx from 'clsx';

export default function Avatar({ src, name, size = 'md', className }) {
  const [failed, setFailed] = useState(false);
  const sizes = {
    xs: 'h-8 w-8 text-xs',
    sm: 'h-10 w-10 text-sm',
    md: 'h-14 w-14 text-base',
    lg: 'h-20 w-20 text-lg',
    xl: 'h-28 w-28 text-2xl',
  };
  const displaySrc = src && !failed ? src : '/giff/face.png';

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div
      className={clsx(
        'rounded-full overflow-hidden bg-surface border border-border',
        'flex items-center justify-center text-ink-secondary font-semibold',
        sizes[size] || sizes.md,
        className,
      )}
      aria-label={name ? `${name} avatar` : 'avatar'}
    >
      <img
        src={displaySrc}
        alt={src && !failed ? (name ?? '') : ''}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
