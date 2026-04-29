export function formatWantLine(deal, role) {
  if (role === 'initiator') {
    if (deal.initiatorWantOpen) return 'Open to suggestions';
    return (deal.initiatorWant ?? '').trim() || '—';
  }
  if (deal.receiverWantOpen) return 'Open to suggestions';
  return (deal.receiverWant ?? '').trim() || '—';
}

export default function OfferSummary({ title, give, wantLine }) {
  return (
    <div className="rounded-2xl border border-border bg-cream/60 p-4 text-left space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</div>
      <div>
        <div className="text-[11px] text-ink-muted">Giving</div>
        <p className="text-sm text-ink-primary whitespace-pre-wrap">{give?.trim() ? give : '—'}</p>
      </div>
      <div>
        <div className="text-[11px] text-ink-muted">Want in return</div>
        <p className="text-sm text-ink-primary whitespace-pre-wrap">{wantLine}</p>
      </div>
    </div>
  );
}
