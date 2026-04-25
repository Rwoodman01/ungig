export default function EmptyState({ title, description, action }) {
  return (
    <div className="card p-6 text-center">
      <img
        src="/giff/standing.png"
        alt=""
        className="mx-auto w-24 h-24 object-contain drop-shadow-[0_14px_24px_rgba(15,19,49,0.10)]"
      />
      <h3 className="text-lg font-semibold text-ink-primary mt-3">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
