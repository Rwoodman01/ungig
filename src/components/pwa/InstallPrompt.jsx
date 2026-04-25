import { useState } from 'react';
import { getDeferredInstallPrompt, promptInstall } from '../../lib/installPrompt.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const STORAGE_KEY = 'gifted_install_prompt_seen';

function isStandalone() {
  return typeof window !== 'undefined'
    && (window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true);
}

export default function InstallPrompt() {
  const { userDoc } = useAuth();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'yes');

  const tradeCount = userDoc?.tradeCount ?? 0;
  const deferred = getDeferredInstallPrompt();

  if (dismissed || tradeCount < 1 || !deferred || isStandalone()) {
    return null;
  }

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'yes');
    setDismissed(true);
  };

  const install = async () => {
    await promptInstall();
    localStorage.setItem(STORAGE_KEY, 'yes');
    setDismissed(true);
  };

  return (
    <div className="card-cream border border-border rounded-2xl p-4 mb-4 flex flex-col sm:flex-row gap-4 items-center shadow-sm">
      <img src="/giff/face.png" alt="" className="w-14 h-14 shrink-0" />
      <div className="flex-1 text-center sm:text-left">
        <p className="font-semibold text-ink-primary">Install Gifted</p>
        <p className="text-sm text-ink-muted mt-1">Add Gifted to your home screen for quick access.</p>
      </div>
      <div className="flex gap-2 w-full sm:w-auto shrink-0">
        <button type="button" className="btn-secondary flex-1 sm:flex-none" onClick={dismiss}>
          Not now
        </button>
        <button type="button" className="btn-primary flex-1 sm:flex-none" onClick={install}>
          Install
        </button>
      </div>
    </div>
  );
}
