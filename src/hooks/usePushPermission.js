import { useCallback, useEffect, useState } from 'react';
import {
  getNotificationPermission,
  requestPushToken,
} from '../lib/messaging.js';

// localStorage key — once set, the card never re-appears even after a reload.
const DISMISSED_KEY = 'gifted_push_dismissed';

/**
 * Manages the push-notification permission prompt lifecycle.
 *
 * `showPrompt` is true when:
 *  - The user is signed in (uid is truthy)
 *  - Permission has not been decided yet ('default')
 *  - The user hasn't previously dismissed the card
 */
export function usePushPermission(uid) {
  const [permission, setPermission] = useState(() =>
    getNotificationPermission(),
  );
  const [dismissed, setDismissed] = useState(() =>
    Boolean(localStorage.getItem(DISMISSED_KEY)),
  );
  const [requesting, setRequesting] = useState(false);

  // Re-read permission state whenever uid changes (e.g. sign-in).
  useEffect(() => {
    setPermission(getNotificationPermission());
  }, [uid]);

  const requestPermission = useCallback(async () => {
    if (!uid) return;
    setRequesting(true);
    try {
      await requestPushToken(uid);
    } catch {
      // User denied or browser error — swallow; we update state from API.
    } finally {
      setPermission(getNotificationPermission());
      setRequesting(false);
    }
  }, [uid]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  }, []);

  const showPrompt =
    permission === 'default' && !dismissed && Boolean(uid);

  return { permission, showPrompt, requesting, requestPermission, dismiss };
}
