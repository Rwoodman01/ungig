import clsx from 'clsx';

function photoUrl(photo) {
  return typeof photo === 'string' ? photo : photo?.url;
}

export default function PhotoGrid({
  photos = [],
  editable = false,
  onDelete,
  emptyText = 'No photos yet.',
  columns = 3,
  coverIndex = -1,
}) {
  if (!photos.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-cream/60 p-5 text-sm text-ink-muted text-center">
        {emptyText}
      </div>
    );
  }

  return (
    <div className={clsx('grid gap-2', columns === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
      {photos.map((photo, idx) => {
        const url = photoUrl(photo);
        if (!url) return null;
        return (
          <div
            key={photo.path ?? url}
            className="relative aspect-square rounded-2xl overflow-hidden bg-cream border border-border"
          >
            <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
            {idx === coverIndex ? (
              <span className="absolute left-2 bottom-2 rounded-full bg-navyHero/85 text-white text-[10px] px-2 py-1">
                Cover
              </span>
            ) : null}
            {editable ? (
              <button
                type="button"
                onClick={() => onDelete?.(photo)}
                className="absolute top-1.5 right-1.5 bg-surface/95 text-coral border border-border rounded-full h-7 w-7 text-sm shadow-sm"
                aria-label="Delete photo"
              >
                ×
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
