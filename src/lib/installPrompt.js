/** @type {Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null} */
let deferredPrompt = null;

export function listenInstallPrompt() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

export function getDeferredInstallPrompt() {
  return deferredPrompt;
}

export function clearDeferredInstallPrompt() {
  deferredPrompt = null;
}

export async function promptInstall() {
  const p = deferredPrompt;
  if (!p?.prompt) return { outcome: 'unavailable' };
  await p.prompt();
  const choice = await p.userChoice;
  clearDeferredInstallPrompt();
  return choice;
}
