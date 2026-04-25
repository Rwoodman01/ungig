import ReviewCard from './ReviewCard.jsx';

export default function ReviewsList({ reviews }) {
  if (!reviews?.length) return null;
  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id}>
          <ReviewCard review={r} />
        </li>
      ))}
    </ul>
  );
}
