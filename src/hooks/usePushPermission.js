import { useCallback, useEffect, useState } from 'react';
import {
  getNotificationPermission,
  requestPushToken,
} from '../lib/messaging.js';

// localStorage key — once set, the Home card no longer re-appears.
const DISMISSED_KEY = 'gifted_push_dismissed';

/**
 * Manages the push-notification permission prompt lifecycle.
 *
 * `showPrompt`  — true when permission is 'default' and not yet dismissed
 * `showBlocked` — true when permission is 'denied' (user needs browser settings)
 * `showDismissed` — true when they tapped "Not now" but haven't granted yet;
 *   used by the Notifications page to offer a second chance.
 *
 * Auto-registration: if the browser already has 'granted' permission when
 * the user signs in (e.g. they installed the PWA which auto-prompted, or a
 * previous session stored it) we silently register the FCM token so the
 * Cloud Function can reach this device without any user action needed.
 */
export function usePushPermission(uid) {
  const [permission, setPermission] = useState(() =>
    getNotificationPermission(),
  );
  const [dismissed, setDismissed] = useState(() =>
    Boolean(localStorage.getItem(DISMISSED_KEY)),
  );
  const [requesting, setRequesting] = useState(false);
  const [lastError, setLastError] = useState('');

  // Re-read permission whenever the user signs in.
  useEffect(() => {
    setPermission(getNotificationPermission());
  }, [uid]);

  // Silently register the FCM token if the browser already granted permission.
  // This covers members who installed the PWA before push notifications existed,
  // or who granted permission via the OS without seeing the in-app prompt.
  useEffect(() => {
    if (!uid || getNotificationPermission() !== 'granted') return;
    requestPushToken(uid).catch(() => {});
  }, [uid]);

  const requestPermission = useCallback(async () => {
    if (!uid) return;
    setRequesting(true);
    setLastError('');
    try {
      // eslint-disable-next-line no-console
      console.log('[Push] requestPermission click', { uid: `${uid.slice(0, 6)}…` });
      const token = await requestPushToken(uid);
      // If permission is granted but we couldn't register a token, surface a
      // lightweight hint so the button doesn't feel like a no-op.
      if (getNotificationPermission() === 'granted' && !token) {
        setLastError('Notifications enabled, but this device is not registered yet. (Missing VAPID key)');
      }
    } catch {
      // User denied or browser error — update from API.
    } finally {
      setPermission(getNotificationPermission());
      setRequesting(false);
    }
  }, [uid]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  }, []);

  // Clear the dismissed flag so the user can re-enable from the Notifications
  // page after having previously tapped "Not now" on the Home card.
  const clearDismissed = useCallback(() => {
    localStorage.removeItem(DISMISSED_KEY);
    setDismissed(false);
  }, []);

  const showPrompt = permission === 'default' && !dismissed && Boolean(uid);
  const showDismissed = permission === 'default' && dismissed && Boolean(uid);
  const showBlocked = permission === 'denied' && Boolean(uid);

  return {
    permission,
    showPrompt,
    showDismissed,
    showBlocked,
    requesting,
    lastError,
    requestPermission,
    dismiss,
    clearDismissed,
  };
}
