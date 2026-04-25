import { Link } from 'react-router-dom';

export default function EmptyDeckState({ onShowList }) {
  return (
    <div className="card-cream min-h-[55vh] flex flex-col items-center justify-center text-center p-8 rounded-[20px]">
      <img src="/giff/face.png" alt="" className="h-24 w-24 mb-5" />
      <h2 className="text-xl font-display font-bold text-ink-primary">
        You&apos;ve seen everyone nearby.
      </h2>
      <p className="text-sm text-ink-muted mt-2 max-w-xs">
        Check back when new members join.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-2 w-full max-w-xs">
        <button type="button" className="btn-primary flex-1" onClick={onShowList}>
          Browse list
        </button>
        <Link to="/browse?view=list" className="btn-secondary flex-1 text-center">
          Directory
        </Link>
      </div>
    </div>
  );
}
