import { useAuth } from '../../contexts/AuthContext.jsx';
import { usePushPermission } from '../../hooks/usePushPermission.js';

/**
 * Soft prompt shown on the Home screen (approved members only) asking them to
 * enable push notifications.  Disappears permanently once granted or dismissed.
 */
export default function PushPermissionCard() {
  const { user, canEngage } = useAuth();
  const { showPrompt, requesting, requestPermission, dismiss } =
    usePushPermission(user?.uid);

  // Only surface the card to fully-approved members who haven't decided yet.
  if (!canEngage || !showPrompt) return null;

  return (
    <div className="card p-4 flex items-start gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green/10 flex items-center justify-center text-lg select-none">
        🔔
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink-primary leading-snug">
          Stay in the loop
        </p>
        <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
          Get notified about matches, trades, and messages — even when the app
          is closed.
        </p>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={requestPermission}
            disabled={requesting}
            className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
          >
            {requesting ? 'Enabling…' : 'Enable notifications'}
          </button>
          <button
            onClick={dismiss}
            className="text-xs text-ink-muted py-1.5 px-2"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
