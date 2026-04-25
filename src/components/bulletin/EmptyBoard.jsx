import { Link } from 'react-router-dom';

export default function EmptyBoard({ allAreas, canPost }) {
  return (
    <div className="card p-6 text-center">
      <img
        src="/giff/standing.png"
        alt=""
        className="mx-auto w-24 h-24 object-contain drop-shadow-[0_14px_24px_rgba(15,19,49,0.10)]"
      />
      <h3 className="text-lg font-semibold text-ink-primary mt-3">
        {allAreas ? 'The board is quiet.' : 'Nothing pinned in your area yet.'}
      </h3>
      <p className="mt-2 text-sm text-ink-muted">
        {allAreas
          ? 'Be the first to post and start the conversation.'
          : 'Try Show all areas, or pin the first note for your neighbors.'}
      </p>
      {canPost ? (
        <Link to="/bulletin/new" className="btn-primary mt-4 inline-flex">
          Post something
        </Link>
      ) : null}
    </div>
  );
}
