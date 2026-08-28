import { useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallState {
  event: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
}

const standaloneQuery = '(display-mode: standalone)';

const isStandalone = () => window.matchMedia(standaloneQuery).matches
  || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

const initialState: InstallState = {
  event: null,
  isInstalled: isStandalone(),
};

let state = initialState;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach(listener => listener());

const updateState = (nextState: Partial<InstallState>) => {
  state = { ...state, ...nextState };
  notify();
};

const handleBeforeInstallPrompt = (event: Event) => {
  if (isStandalone()) return;
  event.preventDefault();
  updateState({ event: event as BeforeInstallPromptEvent });
};

const handleInstalled = () => updateState({ event: null, isInstalled: true });

window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
window.addEventListener('appinstalled', handleInstalled);

const refreshInstalledState = () => {
  if (isStandalone()) updateState({ event: null, isInstalled: true });
};

window.addEventListener('pageshow', refreshInstalledState);
document.addEventListener('visibilitychange', refreshInstalledState);

const isIosDevice = () => /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isAndroidDevice = () => /Android/.test(navigator.userAgent);

const isIos = isIosDevice();
const isAndroid = isAndroidDevice();

export function useInstallPrompt() {
  const currentState = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => initialState,
  );

  const install = async () => {
    if (!currentState.event || currentState.isInstalled) return false;
    const promptEvent = currentState.event;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      updateState({ event: null });
      if (choice.outcome === 'accepted' && isStandalone()) updateState({ isInstalled: true });
      return choice.outcome === 'accepted';
    } catch {
      updateState({ event: null });
      return false;
    }
  };

  return {
    canInstall: Boolean(currentState.event) && !currentState.isInstalled,
    isInstalled: currentState.isInstalled,
    install,
    isIos,
    isAndroid,
    isUnavailable: !currentState.event && !currentState.isInstalled,
  };
}