'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallBanner() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia(
      '(display-mode: standalone)'
    ).matches;
    setIsStandalone(standalone);
    if (standalone) return;

    if (sessionStorage.getItem('pwa-banner-dismissed')) {
      setDismissed(true);
      return;
    }

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') {
      setInstallEvent(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  };

  if (isStandalone || dismissed) return null;
  if (!installEvent && !isIOS) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-nhs-dark-blue text-white rounded-lg shadow-xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
        <span className="text-nhs-blue font-bold text-sm">NHS</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Install MMC Tool</p>
        {isIOS ? (
          <p className="text-xs text-blue-200 mt-0.5">
            Tap the share button then &quot;Add to Home Screen&quot; to install.
          </p>
        ) : (
          <p className="text-xs text-blue-200 mt-0.5">
            Install for offline use and faster access.
          </p>
        )}
        {installEvent && (
          <button
            onClick={handleInstall}
            className="mt-2 px-3 py-1 bg-white text-nhs-dark-blue text-xs font-semibold rounded hover:bg-blue-50 transition-colors"
          >
            Install
          </button>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="text-blue-300 hover:text-white transition-colors shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
