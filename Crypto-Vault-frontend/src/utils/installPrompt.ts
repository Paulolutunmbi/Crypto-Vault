import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches
  || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

const isIosDevice = () => /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isAndroidDevice = () => /Android/.test(navigator.userAgent);

export function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isStandalone);
  const [isIos] = useState(isIosDevice);
  const [isAndroid] = useState(isAndroidDevice);

  useEffect(() => {
    const updateInstalledState = () => {
      if (isStandalone()) setIsInstalled(true);
    };
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (isStandalone()) return;
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallEvent(null);
      setIsInstalled(true);
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
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setInstallEvent(null);
      if (choice.outcome === 'accepted' && isStandalone()) setIsInstalled(true);
      return choice.outcome === 'accepted';
    } catch {
      setInstallEvent(null);
      return false;
    }
  };

  return {
    canInstall: Boolean(installEvent) && !isInstalled,
    isInstalled,
    install,
    isIos,
    isAndroid,
    isUnavailable: !installEvent && !isInstalled,
  };
}