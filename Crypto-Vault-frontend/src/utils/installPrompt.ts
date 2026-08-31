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

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(standaloneQuery).matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
};

const initialState: InstallState = {
  event: null,
  isInstalled: isStandalone(),
};

let state = initialState;
const listeners = new Set<() => void>();
let listenersAttached = false;

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

const refreshInstalledState = () => {
  if (isStandalone()) updateState({ event: null, isInstalled: true });
};

export function attachInstallPromptListeners() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (listenersAttached) return;

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleInstalled);
  window.addEventListener('pageshow', refreshInstalledState);
  document.addEventListener('visibilitychange', refreshInstalledState);

  listenersAttached = true;
}

export function detachInstallPromptListeners() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!listenersAttached) return;

  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.removeEventListener('appinstalled', handleInstalled);
  window.removeEventListener('pageshow', refreshInstalledState);
  document.removeEventListener('visibilitychange', refreshInstalledState);

  listenersAttached = false;
}

attachInstallPromptListeners();

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