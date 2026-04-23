export default function EmptyState({ title, description, action }) {
  return (
    <div className="card p-6 text-center">
      <h3 className="text-lg font-semibold text-ink-50">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-ink-300">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
