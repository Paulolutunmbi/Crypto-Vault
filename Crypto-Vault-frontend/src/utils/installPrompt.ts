import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches
  || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

const isIosDevice = () => /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isStandalone);
  const [installRequested, setInstallRequested] = useState(false);
  const [isIos] = useState(isIosDevice);

  useEffect(() => {
    const updateInstalledState = () => {
      if (isStandalone()) setIsInstalled(true);
    };
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (isStandalone()) return;
      setInstallEvent(event as BeforeInstallPromptEvent);
      setInstallRequested(false);
    };
    const handleInstalled = () => {
      setInstallEvent(null);
      setIsInstalled(true);
      setInstallRequested(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('pageshow', updateInstalledState);
    document.addEventListener('visibilitychange', updateInstalledState);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('pageshow', updateInstalledState);
      document.removeEventListener('visibilitychange', updateInstalledState);
    };
  }, []);

  const install = async () => {
    if (!installEvent || isInstalled) return false;
    const promptEvent = installEvent;
    setInstallEvent(null);
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setInstallRequested(choice.outcome === 'accepted');
      if (choice.outcome === 'accepted' && isStandalone()) setIsInstalled(true);
      return choice.outcome === 'accepted';
    } catch {
      setInstallRequested(false);
      return false;
    }
  };

  return {
    canInstall: Boolean(installEvent) && !isInstalled && !installRequested,
    isInstalled,
    install,
    isIos,
    isUnavailable: !installEvent && !isInstalled && !isIos && !installRequested,
    installRequested,
  };
}