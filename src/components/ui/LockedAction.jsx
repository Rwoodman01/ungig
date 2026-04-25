// Soft-lock notice shown in place of engagement actions (Request a Trade,
// message input, mark-complete buttons) while a member is pending approval.
//
// Visual: a warm, low-contrast card with a handshake emoji — reassuring,
// not frustrating. No red/alarm colors.

export default function LockedAction({ children }) {
  return (
    <div className="card-cream p-4 text-center">
      <div className="text-xl mb-1" aria-hidden>🤝</div>
      <p className="text-sm text-ink-secondary leading-relaxed">
        {children ?? 'Available once your culture call is complete.'}
      </p>
    </div>
  );
}
